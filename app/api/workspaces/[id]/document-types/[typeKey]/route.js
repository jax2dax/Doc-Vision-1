import { NextResponse } from "next/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { deleteCustomIntellect, updateCustomIntellect } from "@/lib/intellects/workspace";

// Only custom types can be changed here. Built-in ones live in code.
const isCustomKey = (key) => /^custom-[0-9a-f]{8}$/.test(key);

/** Replaces a custom document type: { form: {...} } */
export async function PUT(request, { params }) {
  try {
    const { id, typeKey } = await params;
    await requireWorkspace(id);
    if (!isCustomKey(typeKey)) {
      return NextResponse.json({ error: "Built-in document types can't be edited. Copy one instead." }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const { fileCount } = await updateCustomIntellect(id, typeKey, body.form);
    return NextResponse.json({ ok: true, fileCount });
  } catch (err) {
    return failure(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, typeKey } = await params;
    await requireWorkspace(id);
    if (!isCustomKey(typeKey)) {
      return NextResponse.json({ error: "Built-in document types can't be deleted." }, { status: 400 });
    }
    await deleteCustomIntellect(id, typeKey);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err);
  }
}
