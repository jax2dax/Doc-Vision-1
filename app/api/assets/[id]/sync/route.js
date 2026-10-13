import { NextResponse } from "next/server";
import { failure, requireAsset } from "@/lib/auth/access";
import { syncAsset } from "@/lib/connectors/sync";

export const maxDuration = 300;

/** Re-reads a linked Google Sheet. { force: true } re-reads even if Google says it did not change. */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await requireAsset(id);
    const body = await request.json().catch(() => ({}));
    const { changed } = await syncAsset(id, { force: Boolean(body.force) });
    return NextResponse.json({ changed });
  } catch (err) {
    return failure(err);
  }
}
