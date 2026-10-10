import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/** Reassembles a document from its stored chunks (header and overlap removed). */
export async function loadDocumentText(assetId, maxChars = 120_000) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("n8n_vectors")
    .select("text, metadata")
    .eq("metadata->>asset_id", assetId);
  if (error) throw new Error(`Could not read document text: ${error.message}`);

  const chunks = [...data].sort((a, b) => (a.metadata?.chunk_index ?? 0) - (b.metadata?.chunk_index ?? 0));

  let out = "";
  let prevBody = "";
  let prevPage = null;
  for (const chunk of chunks) {
    // Chunks start with a "Document: ...\nDescription: ...\n\n" header added at upload.
    const headerEnd = chunk.text.indexOf("\n\n");
    const full = headerEnd === -1 ? chunk.text : chunk.text.slice(headerEnd + 2);
    let body = full;

    // Chunks overlap by up to 200 chars: drop the repeated start.
    for (let n = Math.min(250, prevBody.length, body.length); n >= 20; n--) {
      if (prevBody.endsWith(body.slice(0, n))) {
        body = body.slice(n);
        break;
      }
    }
    prevBody = full;

    const page = chunk.metadata?.loc?.pageNumber ?? null;
    if (page && page !== prevPage) out += `\n[page ${page}]\n`;
    prevPage = page;
    out += `${body}\n`;
  }
  return out.trim().slice(0, maxChars);
}

