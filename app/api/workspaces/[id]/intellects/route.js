import { NextResponse } from "next/server";
import { createServiceClient, DEFAULT_USER_ID } from "@/lib/supabase/server";
import { getEquippedKeys, setEquippedKeys } from "@/lib/intellects/workspace";

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

export async function GET(request, { params }) {
  const { id } = await params;
  if (!(await ownsWorkspace(id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  try {
    return NextResponse.json({ equipped: await getEquippedKeys(id) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Replaces the equipped set: { equipped: ["delegation-book", "training-record"] } */
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.equipped)) {
    return NextResponse.json({ error: "equipped must be an array of intellect keys" }, { status: 400 });
  }
  if (!(await ownsWorkspace(id))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  try {
    return NextResponse.json({ equipped: await setEquippedKeys(id, body.equipped) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
