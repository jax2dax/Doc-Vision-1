import { NextResponse } from "next/server";
import { failure, requireWorkspace } from "@/lib/auth/access";
import { linkSheet } from "@/lib/connectors/sync";
import { getEquippedKeys } from "@/lib/intellects/workspace";

// Downloads the sheet, reads it, indexes it and finds its dates.
export const maxDuration = 300;

/** Links a Google Sheet: { url, description?, intellectKey? } */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await requireWorkspace(id);
    const body = await request.json().catch(() => ({}));

    const intellectKey = body.intellectKey || null;
    if (intellectKey && !(await getEquippedKeys(id)).includes(intellectKey)) {
      return NextResponse.json({ error: "That document type is not added to this workspace" }, { status: 400 });
    }
    const { asset, error } = await linkSheet({
      workspaceId: id,
      url: body.url,
      description: String(body.description ?? "").slice(0, 500),
      intellectKey,
    });
    return NextResponse.json(error ? { asset, error: `Reading the sheet failed: ${error}` } : { asset }, { status: error ? 207 : 201 });
  } catch (err) {
    return failure(err);
  }
}
