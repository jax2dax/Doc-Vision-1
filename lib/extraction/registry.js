import "server-only";
import { geminiProvider } from "./gemini.js";

// Add new providers here (e.g. an openai.js implementing the same
// contract) and register them below. This is the ONLY file that
// needs to change to add a provider — nothing else in the app
// references gemini.js or openai.js directly.
const PROVIDERS = {
  gemini: geminiProvider,
  // openai: openaiProvider,
};

export const DEFAULT_EXTRACTION_PROVIDER = "gemini";

/** @returns {import("./types.js").ExtractionProvider} */
export function getExtractionProvider(key = DEFAULT_EXTRACTION_PROVIDER) {
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(`Unknown extraction provider "${key}". Available: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return provider;
}