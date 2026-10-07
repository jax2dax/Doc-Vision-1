import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "assets";

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // extracted_items rows are removed automatically via
  // `references public.assets(id) on delete cascade`, and its chunks in
  // n8n_vectors by the assets_delete_vectors trigger (0002.rag.sql),
  // that's what guarantees derived data can't outlive its source.
  const { error: deleteError } = await supabase.from("assets").delete().eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.storage.from(BUCKET).remove([asset.storage_path]);

  return NextResponse.json({ ok: true });
}