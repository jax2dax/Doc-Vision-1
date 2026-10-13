import { NextResponse } from "next/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { listIntellectSummaries } from "@/lib/intellects";
import { createCustomIntellect, getCustomIntellects } from "@/lib/intellects/workspace";

/** Built-in document types plus the ones this workspace defined. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);
    return NextResponse.json({ catalog: listIntellectSummaries(await getCustomIntellects(id)) });
  } catch (err) {
    return failure(err);
  }
}

/** Creates a custom document type: { form: {...} } */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);
    const body = await request.json().catch(() => ({}));
    const type = await createCustomIntellect(id, body.form);
    return NextResponse.json({ key: type.key }, { status: 201 });
  } catch (err) {
    return failure(err);
  }
}
