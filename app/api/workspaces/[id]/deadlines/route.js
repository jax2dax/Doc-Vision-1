import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { extractDatesForAsset } from "@/lib/deadlines/extract";

// One model call per document when rescanning.
export const maxDuration = 300;

/** All dates found in the workspace's documents. Urgency is worked out in the browser, against the viewer's today. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);

    const supabase = createServiceClient();
    const { data: dates, error } = await supabase
      .from("document_dates")
      .select("*")
      .eq("workspace_id", id)
      .order("deadline_date", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ dates });
  } catch (err) {
    return failure(err);
  }
}

/** Re-reads dates: { assetId } for one document, or no body for every ready document. */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);
    const body = await request.json().catch(() => ({}));

    const supabase = createServiceClient();
    let query = supabase.from("assets").select("id, filename").eq("workspace_id", id).eq("status", "ready");
    if (body.assetId) query = query.eq("id", body.assetId);
    const { data: assets, error } = await query;
    if (error) throw new Error(error.message);

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
  } catch (err) {
    return failure(err);
  }
}
