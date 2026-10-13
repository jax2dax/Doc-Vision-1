import { NextResponse } from "next/server";
import { AccessError } from "@/lib/auth/session";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { addMember, listMembers, removeMember } from "@/lib/auth/members";

/** Everyone with access, owner first. Visible to any member. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { workspace } = await requireWorkspace(id);
    return NextResponse.json({ members: await listMembers(workspace) });
  } catch (err) {
    return failure(err);
  }
}

/** Owner only: { email } */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { workspace } = await requireWorkspace(id, { ownerOnly: true });
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ member: await addMember(workspace, body.email) }, { status: 201 });
  } catch (err) {
    return failure(err);
  }
}

/** Owner can remove anyone. Members can remove themselves (leave). { userId } */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { workspace, user, role } = await requireWorkspace(id);
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId ?? "");

    if (userId === workspace.owner_id) throw new AccessError("The owner can't be removed.", 400);
    if (role !== "owner" && userId !== user.id) throw new AccessError("Only the workspace owner can remove other people.", 403);

    await removeMember(id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err);
  }
}
