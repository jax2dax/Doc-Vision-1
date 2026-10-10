import "server-only";
import * as gemini from "./gemini.js";
import * as openai from "./openai.js";

// The one place the rest of the app talks to a language model.
//
// LLM_PROVIDER=openai (default when OPENAI_API_KEY is set) or gemini.
// The other provider is used as a fallback if the first one fails and
// its key is configured, so a quota or outage on one does not take the
// app down.

function order() {
  const geminiReady = Boolean(process.env.GEMINI_API_KEY);
  const openaiReady = openai.openaiConfigured();
  const preferred = process.env.LLM_PROVIDER || (openaiReady ? "openai" : "gemini");

  const all = { openai: { name: "openai", impl: openai, ready: openaiReady }, gemini: { name: "gemini", impl: gemini, ready: geminiReady } };
  const first = all[preferred] ?? all.openai;
  const second = first.name === "openai" ? all.gemini : all.openai;
  return [first, second].filter((p, i) => i === 0 || p.ready);
}

async function withFallback(fn, args) {
  const failures = [];
  for (const provider of order()) {
    try {
      return await provider.impl[fn](args);
    } catch (err) {
      failures.push(err.message);
    }
  }
  throw new Error(failures.join(" | "));
}

export const generateText = (args) => withFallback("generateText", args);
export const generateJson = (args) => withFallback("generateJson", args);
export const transcribeFile = (args) => withFallback("transcribeFile", args);
