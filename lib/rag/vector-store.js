import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { embedDocuments, embedQuery, embeddingModelName } from "./embeddings.js";

// The "Postgres PGVector Store" node, against the same `n8n_vectors`
// table n8n used. Similarity search goes through the
// match_n8n_vectors() RPC from supabase/migrations/0002.rag.sql.
const TABLE = "n8n_vectors";
const INSERT_BATCH = 50; // 1536 floats per row, keep request bodies modest

/**
 * Insert mode: embeds and stores chunks with their metadata.
 * @param {{ text: string, metadata: object }[]} docs
 */
export async function insertDocuments(docs) {
  if (docs.length === 0) return 0;

  const supabase = createServiceClient();
  const embeddings = await embedDocuments(docs.map((d) => d.text));
  const model = embeddingModelName();

  const rows = docs.map((doc, i) => ({
    text: doc.text,
    metadata: { ...doc.metadata, embedding_model: model },
    embedding: embeddings[i],
  }));

  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const { error } = await supabase.from(TABLE).insert(rows.slice(i, i + INSERT_BATCH));
    if (error) {
      throw new Error(`Could not store vectors: ${error.message}`);
    }
  }
  return rows.length;
}

/**
 * Retrieve mode: top-k chunks for `query`, restricted by `filter`
 * (a metadata subset match, always include workspace_id).
 */
export async function similaritySearch({ query, filter, k = 4 }) {
  if (!filter?.workspace_id) {
    throw new Error("similaritySearch requires a workspace_id filter");
  }

  const supabase = createServiceClient();
  const queryEmbedding = await embedQuery(query);

  const { data, error } = await supabase.rpc("match_n8n_vectors", {
    query_embedding: queryEmbedding,
    match_count: k,
    filter,
  });
  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }
  return data;
}

/** Removes every chunk of an asset (used to clean up a failed ingest). */
export async function deleteAssetDocuments(assetId) {
  const supabase = createServiceClient();
  await supabase.from(TABLE).delete().eq("metadata->>asset_id", assetId);
}
