import { NextResponse } from "next/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { getEquippedKeys, setEquippedKeys } from "@/lib/intellects/workspace";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);
    return NextResponse.json({ equipped: await getEquippedKeys(id) });
  } catch (err) {
    return failure(err);
  }
}

/** Replaces the equipped set: { equipped: ["delegation-book", "training-record"] } */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.equipped)) {
      return NextResponse.json({ error: "equipped must be an array of intellect keys" }, { status: 400 });
    }
    try {
      return NextResponse.json({ equipped: await setEquippedKeys(id, body.equipped) });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (err) {
    return failure(err);
  }
}
