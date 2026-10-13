import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth/session";

/** Where the link in the confirmation email lands. Turns the one-time code into a session. */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/platform/home`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
