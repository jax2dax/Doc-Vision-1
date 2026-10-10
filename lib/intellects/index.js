import { isp } from "./isp.js";
import { incidentReport } from "./incident-report.js";
import { bsp } from "./bsp.js";
import { mar } from "./mar.js";
import { trainingRecord } from "./training-record.js";
import { drillLog } from "./drill-log.js";
import { policyProcedure } from "./policy-procedure.js";
import { dailyNote } from "./daily-note.js";
import { safetyPlan } from "./safety-plan.js";
import { protocol } from "./protocol.js";

// ---------- Registry ----------
// To add a document type: copy _template.js, fill it in, import it above
// and add it here. That is the only place that needs to change.
//
// Later, custom intellects will be stored in the database with an
// `approved` flag. They plug in through resolveIntellects() below, so
// nothing that consumes intellects has to change.
const DEFAULT_INTELLECTS = [isp, incidentReport, bsp, mar, trainingRecord, drillLog, policyProcedure, dailyNote, safetyPlan, protocol];

const BY_KEY = new Map(DEFAULT_INTELLECTS.map((i) => [i.key, i]));

/** Lightweight list for the UI (no need to ship the full text to the browser). */
export function listIntellectSummaries() {
  return DEFAULT_INTELLECTS.map((i) => ({
    key: i.key,
    name: i.name,
    abbreviation: i.abbreviation,
    version: i.version,
    strictness: i.strictness?.level ?? "moderate",
    summary: i.purpose || i.identity || "",
    requiredElements: i.requiredElements ?? [],
    commonCitationCount: i.commonCitations?.length ?? 0,
    deadlineRules: (i.deadlineRules ?? []).map((r) => ({ key: r.key, label: r.label, every: r.every })),
    crossChecksWith: [...new Set((i.crossChecks ?? []).map((c) => c.with))],
  }));
}

export function isKnownIntellect(key) {
  return BY_KEY.has(key);
}

/** Resolves keys to full intellects, silently dropping unknown ones. */
export async function resolveIntellects(keys) {
  return (keys ?? []).map((k) => BY_KEY.get(k)).filter(Boolean);
}

// ---------- Rendering for the AI ----------

const list = (items) => items.map((x) => `- ${x}`).join("\n");

function section(title, body) {
  if (!body || (Array.isArray(body) && body.length === 0)) return "";
  return `### ${title}\n${Array.isArray(body) ? list(body) : body}\n`;
}

/** Full expert briefing for one document type. */
export function renderIntellect(i) {
  const blocks = [
    `## ${i.name} (${i.abbreviation}), intellect v${i.version}`,
    section("What this document is", i.identity),
    section("Why it exists", i.purpose),
    section("How it affects the business", i.businessImpact),
    section(
      "Risk when values change",
      (i.valueChangeRisks ?? []).map((r) => `${r.field}: ${r.risk}`)
    ),
    section(
      `Strictness: ${i.strictness?.level ?? "moderate"}`,
      i.strictness?.notes
    ),
    section("How licensors and regulators see it", i.licensorView),
    section("How it gets cited", i.citationView),
    section(
      "Known citation patterns",
      (i.commonCitations ?? []).map(
        (c) => `[${c.severity}] ${c.issue}. Why: ${c.whyCited}`
      )
    ),
    section("Required elements", i.requiredElements),
    section("How to answer questions about it", i.answerGuidance),
    ...Object.entries(i.extra ?? {}).map(([title, body]) => section(title, body)),
  ];
  return blocks.filter(Boolean).join("\n");
}

/** Cross-document rules that involve at least one of the given intellects. */
export function collectCrossChecks(intellects) {
  const keys = new Set(intellects.map((i) => i.key));
  const rules = [];
  for (const i of intellects) {
    for (const c of i.crossChecks ?? []) {
      if (keys.has(c.with)) rules.push(`${i.abbreviation} <-> ${BY_KEY.get(c.with)?.abbreviation ?? c.with}: ${c.rule}`);
    }
  }
  return rules;
}

/**
 * The knowledge block injected into the system prompt when answering
 * or checking. Several intellects are rendered together, followed by
 * the rules that link them.
 */
export function buildKnowledgeBlock(intellects) {
  if (intellects.length === 0) return "";
  const parts = intellects.map(renderIntellect);
  const cross = collectCrossChecks(intellects);
  if (cross.length) {
    parts.push(`## Cross-document rules\n${list(cross)}`);
  }
  return parts.join("\n\n");
}

/** One short line per intellect, for planning prompts where space matters. */
export function buildKnowledgeDigest(intellects) {
  return intellects
    .map(
      (i) =>
        `- ${i.abbreviation} (${i.name}): ${i.purpose || i.identity}` +
        (i.requiredElements?.length ? ` Contains: ${i.requiredElements.join("; ")}.` : "")
    )
    .join("\n");
}
