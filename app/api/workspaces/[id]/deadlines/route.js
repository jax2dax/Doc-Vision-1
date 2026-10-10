import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";
import { extractDatesForAsset } from "@/lib/deadlines/extract";

// One model call per document when rescanning.
export const maxDuration = 300;

async function ownsWorkspace(id) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", id)
    .eq("owner_id", DEFAULT_USER_ID)
    .maybeSingle();
  return Boolean(data);
}

/** All dates found in the workspace's documents. Urgency is worked out in the browser, against the viewer's today. */
export async function GET(request, { params }) {
  const { id } = await params;
  if (!(await ownsWorkspace(id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const supabase = createServiceClient();
  const { data: dates, error } = await supabase
    .from("document_dates")
    .select("*")
    .eq("workspace_id", id)
    .order("deadline_date", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ dates });
}

/** Re-reads dates: { assetId } for one document, or no body for every ready document. */
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!(await ownsWorkspace(id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const supabase = createServiceClient();
  let query = supabase.from("assets").select("id, filename").eq("workspace_id", id).eq("status", "ready");
  if (body.assetId) query = query.eq("id", body.assetId);
  const { data: assets, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const failed = [];
  let scanned = 0;
  for (const asset of assets) {
    try {
      await extractDatesForAsset(asset.id);
      scanned++;
    } catch (err) {
      failed.push({ filename: asset.filename, error: err.message });
    }
  }
  return NextResponse.json({ scanned, failed }, { status: failed.length && !scanned ? 502 : 200 });
}
