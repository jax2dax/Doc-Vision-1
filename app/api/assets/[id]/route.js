import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { failure, requireAsset } from "@/lib/auth/access";
import { getEquippedKeys } from "@/lib/intellects/workspace";
import { extractDatesForAsset } from "@/lib/deadlines/extract";

const BUCKET = "assets";

// PATCH re-reads dates after a type change: one model call.
export const maxDuration = 120;

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { asset } = await requireAsset(id);
    const supabase = createServiceClient();

    // extracted_items rows are removed automatically via
    // `references public.assets(id) on delete cascade`, and its chunks in
    // n8n_vectors by the assets_delete_vectors trigger (0002.rag.sql),
    // that's what guarantees derived data can't outlive its source.
    const { error: deleteError } = await supabase.from("assets").delete().eq("id", id);
    if (deleteError) throw new Error(deleteError.message);

    await supabase.storage.from(BUCKET).remove([asset.storage_path]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err);
  }
}

/** Changes a file's document type: { intellectKey: "delegation-book" | null } */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { asset } = await requireAsset(id);
    const body = await request.json().catch(() => ({}));
    const intellectKey = body.intellectKey || null;
    const supabase = createServiceClient();

    if (intellectKey && !(await getEquippedKeys(asset.workspace_id)).includes(intellectKey)) {
      return NextResponse.json({ error: "That document type is not equipped in this workspace" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("assets")
      .update({ intellect_key: intellectKey })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Keep the stored chunks' metadata in step with the file.
    const { data: vectors } = await supabase.from("n8n_vectors").select("id, metadata").eq("metadata->>asset_id", id);
    for (const v of vectors ?? []) {
      await supabase.from("n8n_vectors").update({ metadata: { ...v.metadata, intellect_key: intellectKey } }).eq("id", v.id);
    }

    // The document type decides which deadline rules apply, so re-read its dates.
    try {
      await extractDatesForAsset(id);
    } catch (err) {
      console.error(`Date extraction failed after type change: ${err.message}`);
    }

    return NextResponse.json({ asset: data });
  } catch (err) {
    return failure(err);
  }
}
