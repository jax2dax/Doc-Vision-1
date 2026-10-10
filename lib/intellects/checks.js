import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/rag/llm.js";
import { getEquippedIntellects } from "./workspace.js";
import { buildKnowledgeBlock, renderIntellect } from "./index.js";
import { CHECK_TYPES } from "./check-types.js";
import { loadDocumentText } from "@/lib/rag/document-text.js";

const MAX_PRIMARY_CHARS = 120_000;
const MAX_OTHER_CHARS = 30_000;
const MAX_OTHER_DOCS = 6;

export class CheckError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Runs a check on one uploaded document using the intellects equipped
 * in its workspace. Other equipped documents are pulled in so the check
 * can cross-reference them.
 *
 * @param {{ workspaceId: string, assetId: string, checkType: string }} input
 */
export async function runCheck({ workspaceId, assetId, checkType }) {
  if (!CHECK_TYPES.some((t) => t.key === checkType)) {
    throw new CheckError(`Unknown check "${checkType}"`, 400);
  }

  const supabase = createServiceClient();
  const equipped = await getEquippedIntellects(workspaceId);
  const byKey = new Map(equipped.map((i) => [i.key, i]));

  const { data: assets, error } = await supabase
    .from("assets")
    .select("id, filename, description, intellect_key, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "ready");
  if (error) throw new Error(`Could not load files: ${error.message}`);

  const primary = assets.find((a) => a.id === assetId);
  if (!primary) throw new CheckError("That document was not found or is not ready yet.", 404);

  const primaryIntellect = byKey.get(primary.intellect_key);
  if (!primaryIntellect) {
    throw new CheckError(
      primary.intellect_key
        ? "This document's type is not equipped in the workspace. Equip it on the Intellects tab first."
        : "Choose a document type for this file first (Files tab), so the check knows what it is checking.",
      422
    );
  }

  // Other typed documents in the workspace, for cross-checking.
  const others = assets
    .filter((a) => a.id !== primary.id && byKey.has(a.intellect_key))
    .slice(0, MAX_OTHER_DOCS);

  const [primaryText, ...otherTexts] = await Promise.all([
    loadDocumentText(primary.id, MAX_PRIMARY_CHARS),
    ...others.map((a) => loadDocumentText(a.id, MAX_PRIMARY_CHARS)),
  ]);
  if (!primaryText.trim()) throw new CheckError("No stored text was found for this document.", 422);

  const otherDocs = others.map((a, i) => ({
    asset: a,
    intellect: byKey.get(a.intellect_key),
    text: otherTexts[i],
  }));

  const result = await generateJson({
    tier: "main",
    system: buildSystemPrompt({ checkType, primaryIntellect, otherDocs, equipped }),
    prompt: buildUserPrompt({ primary, primaryText, otherDocs }),
    schema: RESULT_SCHEMA,
  });

  const findings = (result.findings ?? []).map((f, i) => ({ id: i + 1, ...f }));

  return {
    checkType,
    document: { id: primary.id, filename: primary.filename, type: primaryIntellect.name },
    comparedWith: otherDocs.map((d) => ({ id: d.asset.id, filename: d.asset.filename, type: d.intellect.abbreviation })),
    intellects: equipped.map((i) => ({ key: i.key, abbreviation: i.abbreviation, version: i.version })),
    summary: result.summary,
    overallRisk: result.overall_risk,
    findings,
    strengths: result.strengths ?? [],
    truncated: primaryText.length >= MAX_PRIMARY_CHARS,
  };
}

// ---------- prompts ----------

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Two to four sentences: the headline for the person reading." },
    overall_risk: { type: "string", enum: ["low", "moderate", "high"] },
    strengths: { type: "array", items: { type: "string" }, description: "Things done well, briefly." },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "major", "minor", "observation"] },
          kind: {
            type: "string",
            enum: ["missing_element", "inconsistency", "cross_document", "wording", "date_or_timeline", "citation_risk"],
          },
          title: { type: "string", description: "Short headline." },
          evidence: {
            type: "string",
            description:
              "Exact quote from the document (include the page marker if present), or 'Not found in the document' for an absence.",
          },
          document: { type: "string", description: "Filename the evidence is from." },
          licensor_citation: {
            type: "string",
            description:
              "How a licensor would write this up as a citation. Factual, specific, in the citation style from the knowledge provided.",
          },
          why_it_matters: { type: "string", description: "Business, risk or rights consequence, using the knowledge provided." },
          recommended_fix: { type: "string", description: "A concrete next step." },
        },
        required: [
          "severity",
          "kind",
          "title",
          "evidence",
          "document",
          "licensor_citation",
          "why_it_matters",
          "recommended_fix",
        ],
      },
    },
  },
  required: ["summary", "overall_risk", "strengths", "findings"],
};

function buildSystemPrompt({ checkType, primaryIntellect, otherDocs, equipped }) {
  const hasOthers = otherDocs.length > 0;
  const knowledge = hasOthers ? buildKnowledgeBlock(equipped) : renderIntellect(primaryIntellect);

  const task =
    checkType === "citation_test"
      ? "TASK: Run a SIMULATED CITATION TEST. Act as a licensor reviewing the PRIMARY document. Find what you would realistically cite, using the known citation patterns and citation style in the knowledge below. Write each as a licensor would write it up. Order by severity. Do not pad: if something would not be cited, leave it out."
      : "TASK: Run a DOCUMENT REVIEW of the PRIMARY document. Check it against the required elements and strictness for its type: missing elements, vague or inconsistent values, dates and timelines that do not add up, and wording that creates risk. Also note what it does well.";

  const crossRule = hasOthers
    ? "COMPARISON documents are provided. Check the PRIMARY document for consistency with them using the cross-document rules, and report contradictions as kind 'cross_document', quoting both sides."
    : "No other equipped documents are available, so do not report cross-document findings. You may say in the summary that comparison documents would allow a cross-check.";

  return `You are an expert compliance reviewer for care provider documentation.

${task}

RULES
- The PRIMARY document and any COMPARISON documents are the only facts you may use about this case. The knowledge below tells you what good looks like, how strict to be, and how licensors see it. It is not evidence about the documents.
- Every finding needs evidence: quote the document exactly, or state "Not found in the document" for something that is missing.
- Do not invent rules, deadlines or regulations that are not in the knowledge below. If a requirement depends on a rule you do not have, say the rule needs confirming rather than asserting it.
- Severity: use the severities in the known citation patterns where one matches. "observation" is for things worth noting that would not be cited.
- ${crossRule}
- Report only issues in the PRIMARY document, or contradictions between the PRIMARY document and a COMPARISON document. Do not report problems that exist only inside a COMPARISON document; those belong to that document's own check.
- If the document is clean, return few or no findings. Never invent problems to look thorough.
- Be specific and concise.

KNOWLEDGE
${knowledge}`;
}

function buildUserPrompt({ primary, primaryText, otherDocs }) {
  const others = otherDocs
    .map(
      (d) =>
        `--- COMPARISON DOCUMENT: ${d.asset.filename} (${d.intellect.name}${d.asset.description ? `, ${d.asset.description}` : ""}) ---\n${d.text.slice(0, MAX_OTHER_CHARS)}`
    )
    .join("\n\n");

  return `--- PRIMARY DOCUMENT: ${primary.filename}${primary.description ? ` (${primary.description})` : ""} ---
${primaryText}

${others}`.trim();
}
