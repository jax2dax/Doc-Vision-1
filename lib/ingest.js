import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getExtractionProvider } from "@/lib/extraction/registry";

const BUCKET = "assets";

/**
 * Ingests a single asset: downloads it from Storage, runs it through
 * the chosen extraction provider, and writes the resulting facts into
 * extracted_items with full provenance (asset_id, workspace_id, provider).
 *
 * This function is the single seam between "an asset exists" and
 * "the workspace knows things about it." V1 calls this synchronously
 * right after upload. When V1.3 needs a background worker (for PDFs,
 * batch spreadsheets, or connection syncs), point the worker at this
 * exact function — don't duplicate the logic.
 *
 * @param {string} assetId
 * @param {{ provider?: string }} [options]
 */
export async function ingestAsset(assetId, options = {}) {
  const supabase = createServiceClient();
  const providerKey = options.provider ?? undefined;

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();

  if (assetError || !asset) {
    throw new Error(`Asset ${assetId} not found: ${assetError?.message}`);
  }

  await supabase.from("assets").update({ status: "processing" }).eq("id", assetId);

  try {
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(asset.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error(`Could not download asset from storage: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

    const provider = getExtractionProvider(providerKey);
    const { facts } = await provider.extract({
      imageBase64,
      mimeType: asset.mime_type,
      description: asset.description ?? undefined,
    });

    if (facts.length > 0) {
      const rows = facts.map((fact) => ({
        workspace_id: asset.workspace_id,
        asset_id: asset.id,
        kind: "fact",
        data: fact.data ?? {},
        content: fact.content,
        extraction_provider: provider.key,
      }));

      const { error: insertError } = await supabase.from("extracted_items").insert(rows);
      if (insertError) {
        throw new Error(`Could not store extracted items: ${insertError.message}`);
      }
    }

    await supabase
      .from("assets")
      .update({ status: "ready", error_message: null })
      .eq("id", assetId);

    return { factCount: facts.length };
  } catch (err) {
    await supabase
      .from("assets")
      .update({ status: "error", error_message: String(err.message ?? err) })
      .eq("id", assetId);
    throw err;
  }
}