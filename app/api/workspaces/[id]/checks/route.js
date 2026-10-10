import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";
import { runCheck, CheckError } from "@/lib/intellects/checks";

// Reads a whole document plus its comparison documents, then one large model call.
export const maxDuration = 120;

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.assetId || !body.checkType) {
    return NextResponse.json({ error: "assetId and checkType are required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", id)
    .eq("owner_id", DEFAULT_USER_ID)
    .maybeSingle();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const result = await runCheck({ workspaceId: id, assetId: body.assetId, checkType: body.checkType });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof CheckError ? err.status : 502;
    return NextResponse.json({ error: err.message }, { status });
  }
}
