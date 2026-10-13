import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** A request that should be answered with an HTTP error (401 not signed in, 403 / 404 no access). */
export class AccessError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AccessError";
    this.status = status;
  }
}

/** Supabase client that reads and refreshes the signed-in user's session cookies. */
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a place that cannot set cookies (a Server Component). The proxy refreshes them instead.
        }
      },
    },
  });
}

/** The signed-in user, verified with Supabase. Throws a 401 AccessError if there is none. */
export async function requireUser() {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new AccessError("Please sign in.", 401);
  return data.user;
}
