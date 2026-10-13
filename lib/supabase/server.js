import "server-only";
import { createClient } from "@supabase/supabase-js";

// API routes talk to Supabase with the service role key, server-side only,
// which skips row level security. Access control therefore lives in
// lib/auth/access.js: every route checks the signed-in user's access to the
// workspace before touching its data.

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

// Workspaces created before logins existed are owned by this placeholder id.
// claimLegacyWorkspaces() in lib/auth/access.js hands them to a real user.
export const LEGACY_OWNER_ID = "00000000-0000-0000-0000-000000000001";
