import "server-only";
import { fetchWithRetry } from "./http.js";

// The "Embeddings OpenAI" node. Both the upload and the retrieval side
// MUST use the same provider + model, or similarity search returns
// garbage, that's why this lives in one file both sides import.
//
// EMBEDDINGS_PROVIDER:
//   "openai" (default), text-embedding-3-small, 1536 dims. Same as the
//                        n8n node, so vectors n8n already wrote still match.
//   "gemini"          , gemini-embedding-001 truncated to 1536 dims so it
//                        fits the same column. Switching providers means
//                        re-uploading every file: old vectors won't match.
export const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100;

const PROVIDERS = {
  openai: {
    model: "text-embedding-3-small",
    async embed(texts) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "Missing OPENAI_API_KEY in .env.local (or set EMBEDDINGS_PROVIDER=gemini and re-upload your files)"
        );
      }
      const res = await fetchWithRetry("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: this.model, input: texts }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`OpenAI embeddings ${res.status}: ${json.error?.message ?? "request failed"}`);
      }
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    },
  },

  gemini: {
    model: "gemini-embedding-001",
    async embed(texts, taskType) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY in .env.local");
      }
      const res = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:batchEmbedContents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            requests: texts.map((text) => ({
              model: `models/${this.model}`,
              content: { parts: [{ text }] },
              taskType,
              outputDimensionality: EMBEDDING_DIMENSIONS,
            })),
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`Gemini embeddings ${res.status}: ${json.error?.message ?? "request failed"}`);
      }
      return json.embeddings.map((e) => e.values);
    },
  },
};

function getProvider() {
  const key = process.env.EMBEDDINGS_PROVIDER || "openai";
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(`Unknown EMBEDDINGS_PROVIDER "${key}". Available: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return provider;
}

/** Name recorded in each chunk's metadata, so mixed-model tables are diagnosable. */
export function embeddingModelName() {
  return getProvider().model;
}

/** Embeds document chunks (upload side). */
export async function embedDocuments(texts) {
  const provider = getProvider();
  const vectors = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    vectors.push(...(await provider.embed(texts.slice(i, i + BATCH_SIZE), "RETRIEVAL_DOCUMENT")));
  }
  return vectors;
}

/** Embeds a search query (retrieval side). */
export async function embedQuery(text) {
  const [vector] = await getProvider().embed([text], "RETRIEVAL_QUERY");
  return vector;
}
