import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { ingestUpload } from "@/lib/rag/ingest";
import { downloadSheetAsXlsx, getSheetMeta, parseSheetId, XLSX_MIME, GoogleError } from "./google-sheets.js";

const BUCKET = "assets";
const SOURCE = "google_sheets";

const needsMigration = (error) => /external_id|source|last_synced_at|schema cache/i.test(error?.message ?? "");
const MIGRATION_HINT = "Run supabase/migrations/0006.google_sheets.sql in the Supabase SQL Editor first.";

async function importSheet({ workspaceId, meta, description, intellectKey }) {
  const bytes = await downloadSheetAsXlsx(meta);
  // The name has no extension on purpose: the content type tells the reader it is a workbook.
  const file = new File([bytes], meta.name, { type: XLSX_MIME });
  return ingestUpload({
    file,
    workspaceId,
    description,
    intellectKey,
    source: { kind: SOURCE, externalId: meta.id, modified: meta.modifiedTime },
  });
}

async function removeAsset(supabase, id) {
  const { data } = await supabase.from("assets").select("storage_path").eq("id", id).maybeSingle();
  // Vectors and dates go with the row (trigger and cascade).
  await supabase.from("assets").delete().eq("id", id);
  if (data?.storage_path) await supabase.storage.from(BUCKET).remove([data.storage_path]);
}

/** Links a sheet to a workspace and reads it once. */
export async function linkSheet({ workspaceId, url, description = "", intellectKey = null }) {
  const fileId = parseSheetId(url);
  if (!fileId) throw new GoogleError("That doesn't look like a Google Sheets link. Paste the address from your browser.", 400);

  const supabase = createServiceClient();
  const { data: existing, error: lookupError } = await supabase
    .from("assets")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("external_id", fileId)
    .maybeSingle();
  if (lookupError) throw new Error(needsMigration(lookupError) ? MIGRATION_HINT : lookupError.message);
  if (existing) throw new GoogleError("That sheet is already linked in this workspace.", 409);

  const meta = await getSheetMeta(fileId);
  return importSheet({ workspaceId, meta, description, intellectKey });
}

/**
 * Re-reads a linked sheet if it changed in Google (or `force`).
 * The new copy is built first and only then replaces the old one, so a
 * failed sync never leaves the workspace without its data.
 *
 * @returns {Promise<{ changed: boolean, asset?: object }>}
 */
export async function syncAsset(assetId, { force = false } = {}) {
  const supabase = createServiceClient();
  const { data: old, error } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
  if (error) throw new Error(needsMigration(error) ? MIGRATION_HINT : error.message);
  if (!old) throw new GoogleError("File not found.", 404);
  if (old.source !== SOURCE || !old.external_id) throw new GoogleError("This file was uploaded by hand, so there is nothing to sync.", 400);

  try {
    const meta = await getSheetMeta(old.external_id);
    const unchanged = old.external_modified && new Date(old.external_modified).getTime() === new Date(meta.modifiedTime).getTime();

    if (unchanged && !force) {
      await supabase.from("assets").update({ last_synced_at: new Date().toISOString(), sync_error: null }).eq("id", old.id);
      return { changed: false };
    }

    const result = await importSheet({
      workspaceId: old.workspace_id,
      meta,
      description: old.description,
      intellectKey: old.intellect_key,
    });

    if (result.error) {
      await removeAsset(supabase, result.asset.id);
      throw new Error(result.error);
    }
    await removeAsset(supabase, old.id);
    return { changed: true, asset: result.asset };
  } catch (err) {
    await supabase.from("assets").update({ sync_error: err.message.slice(0, 500) }).eq("id", old.id);
    throw err;
  }
}

/** Syncs every linked sheet. Used by the scheduled job. */
export async function syncAll() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("assets").select("id, filename").eq("source", SOURCE).eq("status", "ready");
  if (error) throw new Error(needsMigration(error) ? MIGRATION_HINT : error.message);

  const summary = { checked: data.length, updated: 0, unchanged: 0, failed: [] };
  for (const asset of data) {
    try {
      const { changed } = await syncAsset(asset.id);
      if (changed) summary.updated++;
      else summary.unchanged++;
    } catch (err) {
      summary.failed.push({ filename: asset.filename, error: err.message });
    }
  }
  return summary;
}
