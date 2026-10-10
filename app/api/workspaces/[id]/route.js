import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";
import { getEquippedKeys } from "@/lib/intellects/workspace";

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .eq("owner_id", DEFAULT_USER_ID)
    .single();

  if (workspaceError || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: assets, error: assetsError } = await supabase
    .from("assets")
    .select("*")
    .eq("workspace_id", id)
    .order("created_at", { ascending: false });

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  let equippedIntellects = [];
  try {
    equippedIntellects = await getEquippedKeys(id);
  } catch {
    // Migration 0003 not applied yet: the app still works without intellects.
  }

  return NextResponse.json({ workspace, assets, equippedIntellects });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: assets } = await supabase.from("assets").select("storage_path").eq("workspace_id", id);
  if (assets?.length) {
    await supabase.storage.from("assets").remove(assets.map((a) => a.storage_path));
  }

  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", id)
    .eq("owner_id", DEFAULT_USER_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}