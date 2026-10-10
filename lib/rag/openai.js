import "server-only";
import { fetchWithRetry } from "./http.js";

// OpenAI chat client (Responses API). Same three functions as gemini.js
// so lib/rag/llm.js can swap or fall back between them.
//
// Model: gpt-5.6-luna by default (OpenAI's cheapest 5.6 tier, about 12x
// cheaper than terra). Override with OPENAI_CHAT_MODEL, or
// OPENAI_FAST_MODEL for the two quick steps (question analysis + search
// planning). OPENAI_REASONING_EFFORT (low | medium | high) is sent only
// when set.
const DEFAULT_MODEL = "gpt-5.6-luna";
const API_URL = "https://api.openai.com/v1/responses";

export function openaiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function modelFor(tier) {
  const fast = process.env.OPENAI_FAST_MODEL;
  return (tier === "fast" && fast) || process.env.OPENAI_CHAT_MODEL || DEFAULT_MODEL;
}

async function generate({ tier = "main", system, content, jsonSchema }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }
  const model = modelFor(tier);
  const effort = process.env.OPENAI_REASONING_EFFORT;

  const res = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      ...(system && { instructions: system }),
      input: [{ role: "user", content }],
      ...(effort && { reasoning: { effort } }),
      ...(jsonSchema && {
        text: { format: { type: "json_schema", name: "result", schema: jsonSchema, strict: false } },
      }),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`OpenAI ${model} ${res.status}: ${json.error?.message ?? "request failed"}`);
  }

  if (json.status === "incomplete") {
    throw new Error(`OpenAI ${model} stopped early (${json.incomplete_details?.reason ?? "incomplete"})`);
  }

  const text = (json.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .map((part) => {
      if (part.type === "refusal") throw new Error(`OpenAI ${model} refused: ${part.refusal}`);
      return part.type === "output_text" ? part.text : "";
    })
    .join("");

  if (!text) {
    throw new Error(`OpenAI ${model} returned no text`);
  }
  return text;
}

const textPart = (text) => [{ type: "input_text", text }];

export async function generateText({ tier, system, prompt }) {
  return generate({ tier, system, content: textPart(prompt) });
}

export async function generateJson({ tier, system, prompt, schema }) {
  const text = await generate({ tier, system, content: textPart(prompt), jsonSchema: schema });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`OpenAI returned non-JSON output: ${text.slice(0, 200)}`);
  }
}

/** Reads an image or scanned PDF into plain text (see gemini.js). */
export async function transcribeFile({ base64, mimeType, description }) {
  const hint = description ? `The uploader describes this file as: "${description}".\n\n` : "";
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const file =
    mimeType === "application/pdf"
      ? { type: "input_file", filename: "document.pdf", file_data: dataUrl }
      : { type: "input_image", image_url: dataUrl };

  return generate({
    content: [
      {
        type: "input_text",
        text: `${hint}Transcribe all text and data in this file as plain text. Keep reading order, headings and table rows (one row per line, cells separated by " | "). Do not summarise or add commentary. If there is no text, describe what the file shows in a few sentences.`,
      },
      file,
    ],
  });
}
