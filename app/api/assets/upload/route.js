import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";
import { ingestUpload } from "@/lib/rag/ingest";
import { getEquippedKeys } from "@/lib/intellects/workspace";
import { spreadsheetKind } from "@/lib/rag/spreadsheet";

// Load + embed runs inside the request; big PDFs need the headroom.
export const maxDuration = 300;

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const ACCEPTED_LABEL = "PDF, Excel (.xlsx), CSV, PNG, JPEG, WebP";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB, PDFs run bigger than the image-only V1 cap did

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const workspaceId = formData.get("workspaceId");
  const description = formData.get("description") ?? "";
  const intellectKey = formData.get("intellectKey") || null;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.type) && !spreadsheetKind(file.name, file.type)) {
    return NextResponse.json(
      { error: `Unsupported file "${file.name}". Accepted: ${ACCEPTED_LABEL}. Old .xls files: save as .xlsx first.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", DEFAULT_USER_ID)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    if (intellectKey && !(await getEquippedKeys(workspaceId)).includes(intellectKey)) {
      return NextResponse.json({ error: "That document type is not equipped in this workspace" }, { status: 400 });
    }
    const { asset, chunkCount, error } = await ingestUpload({ file, workspaceId, description, intellectKey });
    // 207 = asset row saved but ingestion failed (the row carries error_message)
    return NextResponse.json(
      error ? { asset, error: `Ingestion failed: ${error}` } : { asset, chunkCount },
      { status: error ? 207 : 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
