import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { forwardUploadToN8n } from "@/lib/n8n";

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB — PDFs run bigger than the image-only V1 cap did

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const workspaceId = formData.get("workspaceId");
  const description = formData.get("description") ?? "";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Accepted: ${ACCEPTED_MIME_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
  }

  // n8n's workflow owns ingestion right now: it inserts the `assets`
  // row itself and writes vectors into `n8n_vectors`. We don't touch
  // Supabase Storage or write our own `assets` row here — that would
  // create a duplicate.
  try {
    await forwardUploadToN8n({ file, workspaceId, description });
  } catch (err) {
    return NextResponse.json({ error: `n8n ingestion failed: ${err.message}` }, { status: 502 });
  }

  // Shortcut for now: n8n's response doesn't hand back the asset id it
  // just inserted, so we look up the row it created and flip it to
  // "ready" ourselves. Fine for single-file, low-concurrency testing;
  // revisit once n8n can call back with the asset id directly.
  const supabase = createServiceClient();
  const { data: assetRow } = await supabase
    .from("assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("filename", file.name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetRow) {
    await supabase.from("assets").update({ status: "ready" }).eq("id", assetRow.id);
  }

  return NextResponse.json({ asset: assetRow ?? null }, { status: 201 });
}