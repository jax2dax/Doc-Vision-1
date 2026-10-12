import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { generateJson, generateText } from "./llm.js";
import { similaritySearch } from "./vector-store.js";
import { getEquippedIntellects } from "@/lib/intellects/workspace";
import { buildKnowledgeBlock, buildKnowledgeDigest } from "@/lib/intellects";

// The n8n retrieval workflow, in-app. Node -> function:
//
//   Webhook2                         answerQuestion({ workspaceId, question })
//   Information Extractor (+Gemini)  extractQuestionInfo()
//   Select rows from a table         selectWorkspaceAssets()
//   Code in JavaScript1              buildPlannerPrompt()
//   Basic LLM Chain (+Gemini,        planSearches()
//     Structured Output Parser)
//   Prepare Asset Searches           prepareAssetSearches()
//   If -> Respond to Webhook3        early return (nothing to search)
//   PGVector Store2 (+Embeddings)    runSearches()
//   Build Retrieved Context          buildRetrievedContext()
//   Basic LLM Chain2 (+Gemini)       generateAnswer()
//   Code in JavaScript3              formatResponse()
//   Respond to Webhook               return value

const MAX_SEARCHES = 6;
const CHUNKS_PER_SEARCH = 4;
const MAX_CONTEXT_CHUNKS = 12;

/**
 * @param {{ workspaceId: string, question: string }} input
 * @returns {Promise<{
 *   status: "answered" | "no_files" | "not_relevant",
 *   answer: string,
 *   sources: object[],
 *   searches: object[],
 * }>}
 */
export async function answerQuestion({ workspaceId, question }) {
  // Extractor and the table read don't depend on each other.
  const [info, assets, intellects] = await Promise.all([
    extractQuestionInfo(question),
    selectWorkspaceAssets(workspaceId),
    getEquippedIntellects(workspaceId),
  ]);
  const typeNames = new Map(intellects.map((i) => [i.key, i.abbreviation]));

  if (assets.length === 0) {
    return {
      status: "no_files",
      answer: "This workspace has no processed files yet. Upload a file, then ask again.",
      sources: [],
      searches: [],
    };
  }

  const plan = await planSearches(buildPlannerPrompt({ question, info, assets, typeNames, intellects }));
  const searches = prepareAssetSearches({ plan, assets, info, question });

  // ---- If -> Respond to Webhook3 ----
  if (searches.length === 0) {
    return {
      status: "not_relevant",
      answer:
        plan.reply_without_files?.trim() ||
        "I couldn't find anything in this workspace's files that relates to that question.",
      sources: [],
      searches: [],
    };
  }

  const results = await runSearches({ workspaceId, searches });
  const context = buildRetrievedContext(results);

  if (context.length === 0) {
    return {
      status: "not_relevant",
      answer: "I searched this workspace's files but found nothing relevant to that question.",
      sources: [],
      searches: describeSearches(searches, assets),
    };
  }

  const answer = await generateAnswer({ question, info, context, intellects });
  return formatResponse({ answer, context, searches: describeSearches(searches, assets) });
}

// ---------- Information Extractor ----------

const QUESTION_INFO_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      description: "One sentence: what the user actually wants to know.",
    },
    answer_type: {
      type: "string",
      enum: ["fact", "list", "summary", "comparison", "calculation", "other"],
    },
    entities: {
      type: "array",
      items: { type: "string" },
      description: "Names of people, companies, products, places, document types, IDs mentioned.",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Terms and phrases likely to appear verbatim in a document that answers this.",
    },
    time_references: {
      type: "array",
      items: { type: "string" },
      description: "Dates, periods or relative times mentioned (e.g. 'Q3 2025', 'last week').",
    },
  },
  required: ["intent", "answer_type", "entities", "keywords", "time_references"],
};

async function extractQuestionInfo(question) {
  return generateJson({
    tier: "fast",
    system:
      "You analyse questions a user asks about their own uploaded documents. Extract structured information that will be used to search those documents. Only extract what is in the question; never invent entities.",
    prompt: `Question: ${question}`,
    schema: QUESTION_INFO_SCHEMA,
  });
}

// ---------- Select rows from a table ----------

async function selectWorkspaceAssets(workspaceId) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, filename, description, mime_type, intellect_key, created_at")
    .eq("workspace_id", workspaceId)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load workspace files: ${error.message}`);
  }
  return data;
}

// ---------- Code in JavaScript1 ----------

function buildPlannerPrompt({ question, info, assets, typeNames, intellects }) {
  const fileList = assets
    .map(
      (a) =>
        `- id: ${a.id}\n  filename: ${a.filename}\n  document type: ${typeNames.get(a.intellect_key) ?? "unspecified"}\n  description: ${a.description || "(none)"}\n  uploaded: ${a.created_at.slice(0, 10)}`
    )
    .join("\n");

  return `User question: ${question}

What the question is after:
- intent: ${info.intent}
- answer type: ${info.answer_type}
- entities: ${info.entities.join(", ") || "(none)"}
- keywords: ${info.keywords.join(", ") || "(none)"}
- time references: ${info.time_references.join(", ") || "(none)"}

Files in this workspace:
${fileList}${
    intellects.length
      ? `\n\nDocument types this workspace understands (use them to decide which files and which parts of them matter):\n${buildKnowledgeDigest(intellects)}`
      : ""
  }`;
}

// ---------- Basic LLM Chain + Structured Output Parser ----------

const SEARCH_PLAN_SCHEMA = {
  type: "object",
  properties: {
    needs_files: {
      type: "boolean",
      description: "False only for greetings or questions about the assistant itself.",
    },
    reasoning: {
      type: "string",
      description: "One or two sentences on which files are relevant and why.",
    },
    searches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_id: {
            type: ["string", "null"],
            description: "id of the file to search, or null to search every file in the workspace.",
          },
          query: {
            type: "string",
            description: "Search text, phrased like the passage that would contain the answer.",
          },
        },
        required: ["asset_id", "query"],
      },
    },
    reply_without_files: {
      type: "string",
      description: "Short reply to use only when needs_files is false. Empty string otherwise.",
    },
  },
  required: ["needs_files", "reasoning", "searches", "reply_without_files"],
};

async function planSearches(prompt) {
  return generateJson({
    tier: "fast",
    system: `You plan searches over a user's uploaded files to answer their question. A semantic vector search runs each query against chunks of ~1000 characters.

Rules:
- Pick the files whose filename or description make them likely to hold the answer. If unsure which file, use asset_id null (searches everything).
- Write 1-${MAX_SEARCHES} queries. Phrase each like the text that would appear in the document (e.g. "Invoice total amount due" rather than "how much do I owe?"). Use separate queries for separate sub-questions or entities.
- Only use asset ids from the list. Never invent ids.
- Set needs_files to false only for greetings, thanks, or questions about you; then put a brief reply in reply_without_files. Any question about the user's data needs files, even if the files look unrelated, search anyway.`,
    prompt,
    schema: SEARCH_PLAN_SCHEMA,
  });
}

// ---------- Prepare Asset Searches ----------

function prepareAssetSearches({ plan, assets, info, question }) {
  if (!plan.needs_files) return [];

  const knownIds = new Set(assets.map((a) => a.id));
  const seen = new Set();
  const searches = [];

  const planned = plan.searches?.length
    ? plan.searches
    : // Planner said files are needed but gave no queries: fall back to the
      // raw question plus extracted keywords across the whole workspace.
      [{ asset_id: null, query: [question, ...info.keywords].join(" ") }];

  for (const s of planned) {
    const query = s.query?.trim();
    if (!query) continue;
    // A hallucinated id would silently match nothing, widen to all files instead.
    const assetId = s.asset_id && knownIds.has(s.asset_id) ? s.asset_id : null;
    const key = `${assetId}|${query.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    searches.push({ assetId, query });
    if (searches.length === MAX_SEARCHES) break;
  }
  return searches;
}

// ---------- Postgres PGVector Store2 (retrieve) ----------

async function runSearches({ workspaceId, searches }) {
  const perSearch = await Promise.all(
    searches.map(({ assetId, query }) =>
      similaritySearch({
        query,
        k: CHUNKS_PER_SEARCH,
        filter: { workspace_id: workspaceId, ...(assetId && { asset_id: assetId }) },
      })
    )
  );
  return perSearch.flat();
}

// ---------- Build Retrieved Context ----------

function buildRetrievedContext(results) {
  const best = new Map();
  for (const row of results) {
    const prev = best.get(row.id);
    if (!prev || row.similarity > prev.similarity) best.set(row.id, row);
  }

  return [...best.values()]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map((row, i) => ({
      ref: i + 1,
      text: row.text,
      similarity: row.similarity,
      assetId: row.metadata?.asset_id ?? null,
      filename: row.metadata?.filename ?? "Unknown file",
      page: row.metadata?.loc?.pageNumber ?? null,
      sheet: row.metadata?.sheet ?? null,
    }));
}

// ---------- Basic LLM Chain2 ----------

async function generateAnswer({ question, info, context, intellects }) {
  const knowledge = buildKnowledgeBlock(intellects);
  const contextBlock = context
    .map((c) => `[${c.ref}] ${c.filename}${c.sheet ? `, sheet ${c.sheet}` : ""}${c.page ? `, page ${c.page}` : ""}\n${c.text}`)
    .join("\n\n---\n\n");

  return generateText({
    system: `You help group home staff find information in the home's trackers, logs, meeting minutes, training and delegation records, policies and protocols, using ONLY the numbered excerpts below.

- Cite every claim with the excerpt number in square brackets, e.g. [2] or [1][3]. Square brackets are only for excerpt numbers: never write document type abbreviations or any other text inside them.
- If the excerpts don't contain the answer, say so plainly and mention what they do cover. Never fill gaps from general knowledge.
- Each excerpt starts with its document name and description. Use the description to understand scope: if a document is described as a roster, list or schedule for something and a person or item is absent from it, say they are not listed in that document, and name the document. Do not say the information is missing when the document's scope answers the question.
- Be direct. Lead with the answer, then supporting detail. Use short bullet lists for multiple items.
- Quote exact figures, doses, timeframes and steps as written. Never paraphrase a number or a step order.
- If excerpts conflict (for example two versions of a protocol), say so and name both documents.
- You support documentation lookup. Do not give advice beyond what the documents state.
- Expected answer type: ${info.answer_type}.${
      knowledge
        ? `\n\nYou also hold expert knowledge of the document types in this workspace (below). Use it to explain what a document is for, why a value matters, the risk if it changes, how strict the information is, and how a licensor would view or cite it. Expert knowledge explains and contextualises. Every fact about the uploaded documents themselves must still come from the excerpts and be cited. When you rely on expert knowledge rather than an excerpt, do not attach an excerpt number to it.\n\n${knowledge}`
        : ""
    }`,
    prompt: `Excerpts:\n\n${contextBlock}\n\nQuestion: ${question}`,
  });
}

// ---------- Code in JavaScript3 ----------

function formatResponse({ answer, context, searches }) {
  const cited = new Set([...answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
  const sources = context
    .filter((c) => cited.has(c.ref))
    .map((c) => ({
      ref: c.ref,
      assetId: c.assetId,
      filename: c.filename,
      page: c.page,
      sheet: c.sheet,
      similarity: Number(c.similarity.toFixed(3)),
      excerpt: c.text.length > 280 ? `${c.text.slice(0, 280)}…` : c.text,
    }));

  return { status: "answered", answer: answer.trim(), sources, searches };
}

function describeSearches(searches, assets) {
  const names = new Map(assets.map((a) => [a.id, a.filename]));
  return searches.map((s) => ({
    query: s.query,
    assetId: s.assetId,
    filename: s.assetId ? names.get(s.assetId) : null,
  }));
}
