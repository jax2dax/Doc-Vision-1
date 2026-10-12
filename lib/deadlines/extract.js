import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/rag/llm.js";
import { loadDocumentText } from "@/lib/rag/document-text.js";
import { resolveIntellects } from "@/lib/intellects";
import { addInterval, isValidDateString } from "./status.js";

const MAX_CHARS = 100_000;

const DATE_KINDS = ["effective", "signed", "last_review", "review_due", "expiry", "completion", "event", "other"];

const SCHEMA = {
  type: "object",
  properties: {
    dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description:
              "What the date is AND whose or what it belongs to, when the document is a list or table (e.g. 'Delegation date: J. Smith, medication task').",
          },
          date: { type: "string", description: "YYYY-MM-DD. Four-digit year always." },
          kind: { type: "string", enum: DATE_KINDS },
          quote: { type: "string", description: "The exact text (or row of cells) containing the date." },
          page: { type: ["integer", "null"], description: "Page number from the [page N] markers, or null." },
        },
        required: ["label", "date", "kind", "quote", "page"],
      },
    },
    rule_anchors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rule_key: { type: "string" },
          anchor_index: {
            type: "integer",
            description: "Index into `dates` of the date this rule is measured from, or -1 if the document has none.",
          },
          stated_index: {
            type: "integer",
            description:
              "Index into `dates` of the due, renewal or expiry date the document itself states for THIS SAME item, or -1 if it states none.",
          },
        },
        required: ["rule_key", "anchor_index", "stated_index"],
      },
    },
  },
  required: ["dates", "rule_anchors"],
};

/**
 * Finds every date in a stored document, works out which are deadlines
 * (stated in the file, or required by the document type's deadline
 * rules), and replaces the asset's rows in document_dates.
 *
 * The AI only reads dates and picks anchors. All date arithmetic is done
 * here in code.
 *
 * @returns {Promise<{ dates: number, deadlines: number }>}
 */
export async function extractDatesForAsset(assetId) {
  const supabase = createServiceClient();

  const { data: asset, error } = await supabase
    .from("assets")
    .select("id, workspace_id, filename, intellect_key, status")
    .eq("id", assetId)
    .maybeSingle();
  if (error) throw new Error(`Could not load file: ${error.message}`);
  if (!asset) throw new Error("File not found");

  const intellect = asset.intellect_key ? (await resolveIntellects([asset.intellect_key]))[0] : null;
  const rules = (intellect?.deadlineRules ?? []).filter((r) => r.every);

  const text = await loadDocumentText(assetId, MAX_CHARS);
  let rows = [];
  if (text.trim()) {
    const result = await generateJson({
      tier: "main",
      system: buildSystemPrompt(intellect, rules),
      prompt: `DOCUMENT: ${asset.filename}\n\n${text}`,
      schema: SCHEMA,
    });
    rows = buildRows({ result, rules, asset });
  }

  const { error: delError } = await supabase.from("document_dates").delete().eq("asset_id", assetId);
  if (delError) throw new Error(`Could not clear old dates: ${delError.message}`);

  if (rows.length) {
    const { error: insError } = await supabase.from("document_dates").insert(rows);
    if (insError) throw new Error(`Could not save dates: ${insError.message}`);
  }
  return { dates: rows.length, deadlines: rows.filter((r) => r.deadline_date).length };
}

// ---------- prompt ----------

function buildSystemPrompt(intellect, rules) {
  let ruleText = "\nNo renewal rules apply, so return rule_anchors as an empty array.\n";

  if (rules.length) {
    const known = intellect.contains?.dates?.length
      ? `\nDates it normally holds:\n${intellect.contains.dates.map((d) => `- ${d.name}: ${d.meaning}`).join("\n")}`
      : "";
    const list = rules
      .map((r) => {
        const scope = r.perItem
          ? "This rule applies to EACH person or row: return one entry per row."
          : "Return exactly one entry.";
        return `- rule_key "${r.key}" (${r.label}): ${r.anchor} ${scope}`;
      })
      .join("\n");

    ruleText = `
This document is a ${intellect.name}. ${intellect.contains?.summary ?? ""}${known}

For each renewal rule below, return entries in rule_anchors. Each entry picks the date the rule is measured from (anchor_index) and, if the document itself states a due, renewal or expiry date for that same item, that date too (stated_index). Use -1 when there is none.
${list}
`;
  }

  return `You extract dates from workplace documents for a group home: trackers, logs, meeting minutes, training and delegation records, policies.

Return EVERY date that appears in the document. In a spreadsheet, every row with a date is its own entry.

RULES
- Output dates as YYYY-MM-DD with a four-digit year.
- Numeric dates like 10-7-2026 or 10/7/26 are MONTH-DAY-YEAR (US format), so 10-7-2026 is 2026-10-07. Only treat the first number as the day when it is greater than 12 or the document clearly uses day-first dates. Spreadsheet dates are already YYYY-MM-DD.
- Two-digit years are 20xx.
- "kind": effective = when something starts; signed = a signature date; last_review = date of a completed review, revision or competency check; review_due = a date by which a review or renewal is due; expiry = a date something expires or ends; completion = when a task or training was completed; event = a dated event or entry (meeting, drill); other = anything else.
- Only use kind "expiry" or "review_due" for a date that says when something stops being valid or must be renewed. A date recording that something already ended, was archived, or a person left or became inactive is kind "other", never "expiry".
- "label" must say what the date is AND whose or what it belongs to when the document is a list or table (for example "Delegation date: J. Smith, medication task", never just "Delegation date").
- "quote" must be the exact words (or the row of cells) from the document around the date.
- Use only dates written in the document. Never guess or calculate a date that is not written.
- Placeholders, blanks and unfilled fields (like "____") are not dates.
${ruleText}`;
}

// ---------- rows ----------

function buildRows({ result, rules, asset }) {
  // Keep only dates that are real calendar dates.
  const dates = (result.dates ?? []).map((d, index) => ({ ...d, index })).filter((d) => isValidDateString(d.date));

  const rowFor = (d) => ({
    workspace_id: asset.workspace_id,
    asset_id: asset.id,
    label: d.label,
    date_value: d.date,
    kind: d.kind,
    quote: d.quote ?? null,
    page: Number.isInteger(d.page) ? d.page : null,
    deadline_date: null,
    deadline_basis: null,
    deadline_rule: null,
    stated_due: null,
    rule_due: null,
    note: null,
  });

  const byIndex = new Map(dates.map((d) => [d.index, rowFor(d)]));
  const rows = [...byIndex.values()];
  const claimed = new Set();

  // Rule-based deadlines: anchor date + interval, reconciled with any due date the file states.
  for (const rule of rules) {
    const entries = (result.rule_anchors ?? []).filter((e) => e.rule_key === rule.key);
    const usable = rule.perItem ? entries : entries.slice(0, 1);
    let produced = 0;

    for (const entry of usable) {
      const anchor = dates.find((d) => d.index === entry.anchor_index);
      if (!anchor) continue;
      produced++;

      const ruleDue = addInterval(anchor.date, rule.every);
      const stated = dates.find((d) => d.index === entry.stated_index && !claimed.has(d.index));

      if (stated) {
        claimed.add(stated.index);
        const useStated = stated.date <= ruleDue;
        Object.assign(byIndex.get(stated.index), {
          deadline_date: useStated ? stated.date : ruleDue,
          deadline_basis: useStated ? "stated" : "rule",
          deadline_rule: rule.key,
          stated_due: stated.date,
          rule_due: ruleDue,
          date_value: anchor.date,
          note: useStated
            ? null
            : `The document states ${stated.date}, which is later than the requirement (${rule.label.toLowerCase()}, due ${ruleDue}). The earlier date is used.`,
        });
      } else {
        rows.push({
          ...rowFor({ label: anchor.label, date: anchor.date, kind: "derived", quote: anchor.quote, page: anchor.page }),
          deadline_date: ruleDue,
          deadline_basis: "rule",
          deadline_rule: rule.key,
          rule_due: ruleDue,
        });
      }
    }

    if (produced === 0) {
      rows.push({
        ...rowFor({ label: rule.label, date: null, kind: "missing", quote: null, page: null }),
        deadline_rule: rule.key,
        note: `No date was found in this document to measure "${rule.label}" from, so its deadline cannot be calculated. Check that the document carries the dates this type of document normally holds.`,
      });
    }
  }

  // Remaining due dates written in the file with no rule behind them.
  for (const d of dates) {
    if (claimed.has(d.index)) continue;
    if (d.kind === "review_due" || d.kind === "expiry") {
      const row = byIndex.get(d.index);
      if (!row.deadline_date) {
        row.deadline_date = d.date;
        row.deadline_basis = "stated";
        row.stated_due = d.date;
      }
    }
  }
  return rows;
}
