import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { loadAndSplit } from "./loader.js";
import { insertDocuments, deleteAssetDocuments } from "./vector-store.js";

const BUCKET = "assets";

/**
 * The n8n upload workflow, in-app:
 *
 *   Insert rows in a table  ->  assets row (+ original file to Storage)
 *   Default Data Loader     ->  loadAndSplit()
 *   Embeddings + PGVector   ->  insertDocuments()
 *   Respond to Webhook      ->  return value
 *
 * Never throws after the assets row exists: failures land on the row
 * (status "error" + error_message) so the UI can show them, and the
 * caller gets `{ asset, error }`.
 *
 * @param {{ file: File, workspaceId: string, description?: string }} input
 */
export async function ingestUpload({ file, workspaceId, description }) {
  const supabase = createServiceClient();
  const assetId = crypto.randomUUID();
  const storagePath = `${workspaceId}/${assetId}/${file.name.replace(/[^\w.\-]+/g, "_")}`;

  // ---- Insert rows in a table ----
  const { data: asset, error: insertError } = await supabase
    .from("assets")
    .insert({
      id: assetId,
      workspace_id: workspaceId,
      filename: file.name,
      description: description?.trim() || null,
      mime_type: file.type,
      storage_path: storagePath,
      status: "processing",
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Could not create asset: ${insertError.message}`);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: file.type });
    if (uploadError) {
      throw new Error(`Could not store original file: ${uploadError.message}`);
    }

    // ---- Default Data Loader ----
    const chunks = await loadAndSplit({ bytes, mimeType: file.type, description: asset.description });
    if (chunks.length === 0) {
      throw new Error("No readable text found in this file");
    }

    // ---- Embeddings + PGVector Store (insert) ----
    const chunkCount = await insertDocuments(
      chunks.map((chunk, i) => ({
        text: chunk.text,
        metadata: {
          workspace_id: workspaceId,
          asset_id: assetId,
          filename: file.name,
          description: asset.description,
          chunk_index: i,
          ...(chunk.pageNumber && { loc: { pageNumber: chunk.pageNumber } }),
        },
      }))
    );

    const { data: ready } = await supabase
      .from("assets")
      .update({ status: "ready", error_message: null })
      .eq("id", assetId)
      .select()
      .single();

    return { asset: ready ?? { ...asset, status: "ready" }, chunkCount };
  } catch (err) {
    const message = String(err.message ?? err);
    // Don't leave half an asset searchable.
    await deleteAssetDocuments(assetId).catch(() => {});
    const { data: failed } = await supabase
      .from("assets")
      .update({ status: "error", error_message: message })
      .eq("id", assetId)
      .select()
      .single();

    return { asset: failed ?? { ...asset, status: "error", error_message: message }, error: message };
  }
}
