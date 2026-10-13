import { NextResponse } from "next/server";
import { failure } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";
import { googleConfigured, serviceAccountEmail } from "@/lib/connectors/google-sheets";

/** Whether Google Sheets is set up, and which email people must share their sheet with. Signed-in users only. */
export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ configured: googleConfigured(), email: serviceAccountEmail() });
  } catch (err) {
    return failure(err);
  }
}
