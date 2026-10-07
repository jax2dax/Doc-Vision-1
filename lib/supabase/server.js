import "server-only";
import { createClient } from "@supabase/supabase-js";

// V1 decision: API routes talk to Supabase with the service role key,
// server-side only. RLS policies exist in the schema (0001_init.sql)
// but aren't the active gate yet since there's no login flow in V1,
// see DEFAULT_USER_ID below. When auth ships, swap this file's export
// for a per-request client built from the user's session and RLS
// takes over automatically; nothing else in the app needs to change.

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: fetchWithClearErrors(url) },
  });
}

// supabase-js surfaces network failures as a bare "TypeError: fetch
// failed". The usual cause is a paused free-tier project (its DNS
// record disappears), so say that instead.
function fetchWithClearErrors(url) {
  const host = new URL(url).host;
  return async (input, init) => {
    try {
      return await fetch(input, init);
    } catch (err) {
      const code = err.cause?.code;
      const hint =
        code === "ENOTFOUND"
          ? "the hostname doesn't resolve. The project is probably paused or deleted. Restore it from the Supabase dashboard."
          : `${err.cause?.message ?? err.message}`;
      throw new Error(`Can't reach Supabase at ${host}: ${hint}`, { cause: err });
    }
  };
}

// V1 has no login yet. Every workspace is owned by this fixed id so
// the schema/RLS shape is correct from day one. Replace with
// `session.user.id` the moment auth ships, search the codebase for
// this constant to find every spot that needs updating.
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";