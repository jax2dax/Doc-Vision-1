import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { getEquippedKeys } from "@/lib/intellects/workspace";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { workspace, role, user } = await requireWorkspace(id);
    const supabase = createServiceClient();

    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });
    if (assetsError) throw new Error(assetsError.message);

    let equippedIntellects = [];
    try {
      equippedIntellects = await getEquippedKeys(id);
    } catch {
      // Migration 0003 not applied yet: the app still works without document types.
    }

    return NextResponse.json({ workspace, assets, equippedIntellects, role, userId: user.id });
  } catch (err) {
    return failure(err);
  }
}

/** Owner only. Deletes the workspace, its files and everything derived from them. */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id, { ownerOnly: true });
    const supabase = createServiceClient();

    const { data: assets } = await supabase.from("assets").select("storage_path").eq("workspace_id", id);
    if (assets?.length) {
      await supabase.storage.from("assets").remove(assets.map((a) => a.storage_path));
    }

    const { error } = await supabase.from("workspaces").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err);
  }
}
