import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/rag/llm.js";
import { readRawSheets, spreadsheetKind } from "@/lib/rag/spreadsheet.js";
import { addInterval, isValidDateString } from "./status.js";

// Dates in Excel and CSV files. The AI only looks at the column headings
// and a few sample rows to say which column is what. Code then reads every
// row itself, so a 2,000 row sheet costs one small model call, every date is
// exact, and the deadline arithmetic never goes through the AI.

const BUCKET = "assets";
const MAX_ROWS_PER_SHEET = 5000;
const SAMPLE_ROWS = 12;
const DATE_KINDS = ["effective", "signed", "last_review", "review_due", "expiry", "completion", "event", "other"];

export function isSpreadsheetAsset(asset) {
  return Boolean(spreadsheetKind(asset.filename, asset.mime_type));
}

/**
 * @returns {Promise<object[]>} rows ready for the document_dates table
 */
export async function extractSpreadsheetRows({ asset, intellect, rules }) {
  const supabase = createServiceClient();
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(asset.storage_path);
  if (error || !blob) throw new Error(`Could not read the original file: ${error?.message ?? "not found"}`);

  const kind = spreadsheetKind(asset.filename, asset.mime_type);
  const sheets = (await readRawSheets({ bytes: new Uint8Array(await blob.arrayBuffer()), kind }))
    .map((s) => ({ sheet: s.sheet, rows: s.data.filter((r) => r.some((c) => cellText(c) !== "")).slice(0, MAX_ROWS_PER_SHEET) }))
    .filter((s) => s.rows.length > 1);
  if (sheets.length === 0) return [];

  const mapping = await generateJson({
    tier: "fast",
    system: buildPrompt(intellect, rules),
    prompt: sheets.map(describeSheet).join("\n\n"),
    schema: SCHEMA,
  });

  const out = [];
  const produced = new Map(rules.map((r) => [r.key, 0]));
  const looseAnchors = new Map(); // non per-item rules: latest anchor across every sheet

  for (const sheet of sheets) {
    const m = (mapping.sheets ?? []).find((x) => x.sheet === sheet.sheet);
    if (!m || m.header_row_index < 0) continue;
    buildSheetRows({ sheet, m, rules, asset, out, produced, looseAnchors });
  }

  // Rules that apply to the document as a whole (next meeting, next drill).
  for (const rule of rules.filter((r) => !r.perItem)) {
    const best = looseAnchors.get(rule.key);
    if (!best) continue;
    produced.set(rule.key, 1);
    out.push({
      ...base(asset, `${rule.label} (counted from latest: ${best.label})`, best.date, "derived", best.quote),
      deadline_date: addInterval(best.date, rule.every),
      deadline_basis: "rule",
      deadline_rule: rule.key,
      rule_due: addInterval(best.date, rule.every),
    });
  }

  for (const rule of rules) {
    if (produced.get(rule.key) === 0) {
      out.push({
        ...base(asset, rule.label, null, "missing", null),
        deadline_rule: rule.key,
        note: `No date was found in this spreadsheet to measure "${rule.label}" from, so its deadline cannot be calculated. Check the column headings, and that the document type matches this file.`,
      });
    }
  }
  return out;
}

// ---------- one sheet ----------

function buildSheetRows({ sheet, m, rules, asset, out, produced, looseAnchors }) {
  const body = sheet.rows.slice(m.header_row_index + 1);

  const dateCols = (m.date_columns ?? []).filter((c) => Number.isInteger(c.column) && c.column >= 0);
  const stated = new Set(rules.flatMap((r) => (m.rule_mappings ?? []).filter((x) => x.rule_key === r.key).map((x) => x.stated_column)));

  for (const row of body) {
    const subject = (m.subject_columns ?? [])
      .map((i) => cellText(row[i]))
      .filter(Boolean)
      .join(", ");
    const quote = `${sheet.sheet}: ${row.map(cellText).filter(Boolean).join(" | ")}`.slice(0, 300);
    const tag = (label) => (subject ? `${label}: ${subject}` : label);

    // Every date in the row.
    const dates = new Map();
    for (const col of dateCols) {
      const date = parseDateCell(row[col.column]);
      if (!date) continue;
      const entry = base(asset, tag(col.label), date, col.kind, quote);
      dates.set(col.column, entry);
      out.push(entry);
    }

    // Renewal rules for this row.
    for (const rule of rules) {
      const map = (m.rule_mappings ?? []).find((x) => x.rule_key === rule.key);
      if (!map) continue;

      const anchors = (map.anchor_columns ?? []).map((i) => dates.get(i)).filter(Boolean);
      const anchor = anchors.sort((a, b) => b.date_value.localeCompare(a.date_value))[0];
      if (!anchor) continue;

      if (!rule.perItem) {
        const best = looseAnchors.get(rule.key);
        if (!best || anchor.date_value > best.date) {
          looseAnchors.set(rule.key, { date: anchor.date_value, label: anchor.label, quote });
        }
        continue;
      }

      produced.set(rule.key, produced.get(rule.key) + 1);
      const ruleDue = addInterval(anchor.date_value, rule.every);
      const statedEntry = Number.isInteger(map.stated_column) ? dates.get(map.stated_column) : null;

      if (statedEntry) {
        const useStated = statedEntry.date_value <= ruleDue;
        Object.assign(statedEntry, {
          deadline_date: useStated ? statedEntry.date_value : ruleDue,
          deadline_basis: useStated ? "stated" : "rule",
          deadline_rule: rule.key,
          stated_due: statedEntry.date_value,
          rule_due: ruleDue,
          note: useStated
            ? null
            : `The sheet says ${statedEntry.date_value}, which is later than the requirement (${rule.label.toLowerCase()}, due ${ruleDue}). The earlier date is used.`,
        });
      } else {
        out.push({
          ...base(asset, tag(rule.label), anchor.date_value, "derived", quote),
          deadline_date: ruleDue,
          deadline_basis: "rule",
          deadline_rule: rule.key,
          rule_due: ruleDue,
        });
      }
    }

    // Due or expiry dates the sheet states that no rule claimed.
    for (const col of dateCols) {
      const entry = dates.get(col.column);
      if (!entry || entry.deadline_date || stated.has(col.column)) continue;
      if (col.kind === "review_due" || col.kind === "expiry") {
        Object.assign(entry, { deadline_date: entry.date_value, deadline_basis: "stated", stated_due: entry.date_value });
      }
    }
    // A stated column belonging to a rule but whose row had no anchor still counts as a stated deadline.
    for (const col of dateCols) {
      const entry = dates.get(col.column);
      if (entry && !entry.deadline_date && stated.has(col.column) && (col.kind === "review_due" || col.kind === "expiry")) {
        Object.assign(entry, { deadline_date: entry.date_value, deadline_basis: "stated", stated_due: entry.date_value });
      }
    }
  }
}

function base(asset, label, date, kind, quote) {
  return {
    workspace_id: asset.workspace_id,
    asset_id: asset.id,
    label,
    date_value: date,
    kind,
    quote,
    page: null,
    deadline_date: null,
    deadline_basis: null,
    deadline_rule: null,
    stated_due: null,
    rule_due: null,
    note: null,
  };
}

// ---------- cells ----------

function cellText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  return String(value).replace(/\s+/g, " ").trim();
}

/** Real date cells, ISO text, and US-style M/D/YYYY text. Anything else is not a date. */
export function parseDateCell(value) {
  if (value instanceof Date) {
    const iso = Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
    return isValidDateString(iso) ? iso : null;
  }
  const text = cellText(value);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (iso) return isValidDateString(`${iso[1]}-${iso[2]}-${iso[3]}`) ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;

  const us = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3];
    const candidate = `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
    return isValidDateString(candidate) ? candidate : null;
  }
  return null;
}

// ---------- prompt ----------

const SCHEMA = {
  type: "object",
  properties: {
    sheets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sheet: { type: "string", description: "Sheet name exactly as given." },
          header_row_index: {
            type: "integer",
            description: "Index of the row holding the column headings (0 is the first row shown), or -1 if this sheet has no dates worth reading.",
          },
          subject_columns: {
            type: "array",
            items: { type: "integer" },
            description: "Columns that say WHO or WHAT a row is about (a name, a task, a location). Usually 1 to 3.",
          },
          date_columns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                column: { type: "integer" },
                label: { type: "string", description: "What this column's date means, in a few words (e.g. 'Delegation date')." },
                kind: { type: "string", enum: DATE_KINDS },
              },
              required: ["column", "label", "kind"],
            },
          },
          rule_mappings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rule_key: { type: "string" },
                anchor_columns: {
                  type: "array",
                  items: { type: "integer" },
                  description: "Date columns the rule is measured from. If several are given, the latest date in a row is used.",
                },
                stated_column: {
                  type: "integer",
                  description: "Date column where the sheet itself states the due, renewal or expiry date for the same row, or -1.",
                },
              },
              required: ["rule_key", "anchor_columns", "stated_column"],
            },
          },
        },
        required: ["sheet", "header_row_index", "subject_columns", "date_columns", "rule_mappings"],
      },
    },
  },
  required: ["sheets"],
};

function describeSheet(sheet) {
  const shown = sheet.rows.slice(0, SAMPLE_ROWS);
  const lines = shown.map((row, i) => `Row ${i}: ${row.map((c, col) => `[${col}] ${cellText(c)}`).join(" | ")}`);
  return `SHEET "${sheet.sheet}" (${sheet.rows.length} rows; first ${shown.length} shown)\n${lines.join("\n")}`;
}

function buildPrompt(intellect, rules) {
  const context = intellect
    ? `This file is a ${intellect.name}. ${intellect.contains?.summary ?? ""}${
        intellect.contains?.dates?.length
          ? `\nDates it normally holds:\n${intellect.contains.dates.map((d) => `- ${d.name}: ${d.meaning}`).join("\n")}`
          : ""
      }`
    : "The document type is not known.";

  const ruleText = rules.length
    ? `\nRenewal rules. For each, say which date columns it is measured from and which column (if any) states the due date:\n${rules
        .map((r) => `- rule_key "${r.key}" (${r.label}): ${r.anchor}`)
        .join("\n")}`
    : "\nNo renewal rules apply, so return rule_mappings as an empty array.";

  return `You map the columns of workplace spreadsheets (group home trackers, logs, training and delegation records). You are shown the first rows of each sheet. Columns are numbered like [0], [1].

${context}

For each sheet return which row is the header, which columns identify the person or item, and which columns hold dates, with what each date means. Only list columns that actually contain dates.
- Use kind "expiry" or "review_due" only for a date that says when something stops being valid or must be renewed. A date recording that something already ended, was archived or a person left is kind "other".
- Skip sheets that are notes, instructions or archives with no useful dates by setting header_row_index to -1.
${ruleText}`;
}
