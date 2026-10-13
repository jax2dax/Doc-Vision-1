import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { claimLegacyWorkspaces, failure, listUserWorkspaces } from "@/lib/auth/access";

/** Workspaces the signed-in user owns or belongs to. */
export async function GET() {
  try {
    const user = await requireUser();
    await claimLegacyWorkspaces(user);
    return NextResponse.json({ workspaces: await listUserWorkspaces(user) });
  } catch (err) {
    return failure(err);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim().slice(0, 120);
    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        owner_id: user.id,
        name,
        description: String(body.description ?? "").trim().slice(0, 500) || null,
        color: body.color ?? "#7c3aed",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ workspace: data }, { status: 201 });
  } catch (err) {
    return failure(err);
  }
}
