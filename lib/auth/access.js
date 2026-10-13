import "server-only";
import { NextResponse } from "next/server";
import { createServiceClient, LEGACY_OWNER_ID } from "@/lib/supabase/server";
import { AccessError, requireUser } from "./session.js";

// Every route that touches a workspace, or anything inside one, goes through
// these checks. The server talks to the database with the service role (which
// skips the database's own row security), so THIS is what keeps one user's
// workspaces away from another's.
//
//   owner   workspaces.owner_id = the user. Can delete the workspace and manage members.
//   member  a row in workspace_members. Full access to files, dates and chat.
//
// Someone with no access gets a 404, not a 403, so workspace ids can't be probed.

/**
 * @param {string} workspaceId
 * @param {{ ownerOnly?: boolean }} [options]
 * @returns {Promise<{ user: object, workspace: object, role: "owner" | "member" }>}
 */
export async function requireWorkspace(workspaceId, { ownerOnly = false } = {}) {
  const user = await requireUser();
  const supabase = createServiceClient();

  const { data: workspace, error } = await supabase.from("workspaces").select("*").eq("id", workspaceId).maybeSingle();
  if (error && error.code !== "22P02") throw new Error(error.message); // 22P02 = not a valid uuid
  if (!workspace) throw new AccessError("Workspace not found", 404);

  let role = workspace.owner_id === user.id ? "owner" : null;
  if (!role) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (member) role = "member";
  }

  if (!role) throw new AccessError("Workspace not found", 404);
  if (ownerOnly && role !== "owner") throw new AccessError("Only the workspace owner can do that.", 403);
  return { user, workspace, role };
}

/** Same check, starting from a file id. */
export async function requireAsset(assetId, options) {
  const supabase = createServiceClient();
  const { data: asset, error } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
  if (error && error.code !== "22P02") throw new Error(error.message);
  if (!asset) {
    await requireUser(); // not signed in is still a 401, not a 404
    throw new AccessError("File not found", 404);
  }
  const ctx = await requireWorkspace(asset.workspace_id, options);
  return { ...ctx, asset };
}

/** Workspaces the user owns or belongs to. */
export async function listUserWorkspaces(user) {
  const supabase = createServiceClient();
  const { data: memberships } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id);
  const memberIds = (memberships ?? []).map((m) => m.workspace_id);

  let query = supabase.from("workspaces").select("*, assets(count)").order("created_at", { ascending: false });
  query = memberIds.length ? query.or(`owner_id.eq.${user.id},id.in.(${memberIds.join(",")})`) : query.eq("owner_id", user.id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map((w) => ({
    ...w,
    fileCount: w.assets?.[0]?.count ?? 0,
    role: w.owner_id === user.id ? "owner" : "member",
    assets: undefined,
  }));
}

/**
 * Workspaces created before logins existed belong to a placeholder owner.
 * The first person to sign in takes them over. If LEGACY_OWNER_EMAIL is set,
 * only that email can, which is the safe choice if sign-up is open to anyone
 * and the app is already published.
 */
export async function claimLegacyWorkspaces(user) {
  const only = process.env.LEGACY_OWNER_EMAIL?.trim().toLowerCase();
  if (only && user.email?.toLowerCase() !== only) return 0;

  const supabase = createServiceClient();
  const { data } = await supabase.from("workspaces").update({ owner_id: user.id }).eq("owner_id", LEGACY_OWNER_ID).select("id");
  return data?.length ?? 0;
}

/** Turns anything thrown inside a route into a JSON error response. */
export function failure(err) {
  if (err instanceof AccessError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: err?.message ?? "Something went wrong" }, { status: err?.status ?? 500 });
}
