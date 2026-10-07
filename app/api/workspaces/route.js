import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*, assets(count)")
    .eq("owner_id", DEFAULT_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workspaces = data.map((w) => ({
    ...w,
    fileCount: w.assets?.[0]?.count ?? 0,
    assets: undefined,
  }));

  return NextResponse.json({ workspaces });
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_id: DEFAULT_USER_ID,
      name,
      description: (body.description ?? "").trim() || null,
      color: body.color ?? "#7c3aed",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workspace: data }, { status: 201 });
}