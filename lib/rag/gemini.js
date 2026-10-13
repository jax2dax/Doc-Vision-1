import "server-only";
import { fetchWithRetry } from "./http.js";

// Plays the role of the "Google Gemini Chat Model" nodes. Plain REST,
// no SDK, the surface we need is two calls (text out, JSON out).
//
// Two tiers, like the separate Gemini model nodes in the workflow:
//   fast, Information Extractor + search planner
//   main, final answer, document checks, file transcription
//
// Each tier is an ordered list. If a model is out of quota (free tier is
// capped per model per day), overloaded, or retired, the next one is
// tried automatically. Override with GEMINI_MODEL / GEMINI_FAST_MODEL as
// a comma separated list, e.g. GEMINI_MODEL=gemini-2.5-flash,gemini-3.5-flash
const MODEL_CHAINS = {
  fast: () =>
    chain(process.env.GEMINI_FAST_MODEL, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]),
  main: () =>
    chain(process.env.GEMINI_MODEL, ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]),
};
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Statuses that mean "this model can't serve you right now, try another".
const FALLBACK_STATUSES = new Set([404, 429, 500, 502, 503, 504]);

function chain(override, defaults) {
  const custom = (override ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return [...new Set([...custom, ...defaults])];
}

async function generate({ tier = "main", system, parts, generationConfig }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env.local");
  }

  let json;
  const failures = [];
  for (const model of MODEL_CHAINS[tier]()) {
    const res = await fetchWithRetry(`${API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        ...(system && { systemInstruction: { parts: [{ text: system }] } }),
        contents: [{ role: "user", parts }],
        generationConfig,
      }),
    }, { timeoutMs: tier === "fast" ? 25_000 : 60_000 });

    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      json = body;
      break;
    }

    const message = body.error?.message?.split("\n")[0] ?? "request failed";
    failures.push(`${model} ${res.status}: ${message}`);
    if (!FALLBACK_STATUSES.has(res.status)) break;
  }

  if (!json) {
    throw new Error(`Gemini unavailable. ${failures.join(" | ")}`);
  }

  const candidate = json.candidates?.[0];
  const text = candidate?.content?.parts
    ?.filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");

  if (!text) {
    const reason = json.promptFeedback?.blockReason ?? candidate?.finishReason ?? "empty response";
    throw new Error(`Gemini returned no text (${reason})`);
  }
  return text;
}

/** Free-text completion, the "Basic LLM Chain" without a parser. */
export async function generateText({ tier, system, prompt, temperature = 0.2 }) {
  return generate({ tier, system, parts: [{ text: prompt }], generationConfig: { temperature } });
}

/**
 * JSON completion constrained to `schema`, the "Information Extractor"
 * and "Basic LLM Chain + Structured Output Parser" nodes.
 */
export async function generateJson({ tier, system, prompt, schema, temperature = 0 }) {
  const text = await generate({
    tier,
    system,
    parts: [{ text: prompt }],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  });

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 200)}`);
  }
}

/**
 * Transcribes an image or scanned PDF to plain text. Used by the loader
 * when a file has no extractable text layer, the n8n Default Data
 * Loader would just produce zero chunks there.
 */
export async function transcribeFile({ base64, mimeType, description }) {
  const hint = description ? `The uploader describes this file as: "${description}".\n\n` : "";
  return generate({
    parts: [
      {
        text: `${hint}Transcribe all text and data in this file as plain text. Keep reading order, headings and table rows (one row per line, cells separated by " | "). Do not summarise or add commentary. If there is no text, describe what the file shows in a few sentences.`,
      },
      { inlineData: { mimeType, data: base64 } },
    ],
    generationConfig: { temperature: 0 },
  });
}
