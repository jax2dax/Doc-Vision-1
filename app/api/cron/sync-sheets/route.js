import { NextResponse } from "next/server";
import { syncAll } from "@/lib/connectors/sync";

export const maxDuration = 300;

/**
 * Scheduled sync (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
 * Without CRON_SECRET set, nobody can call this, which is deliberate: it is a
 * public URL and each call spends model credits.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await syncAll());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
