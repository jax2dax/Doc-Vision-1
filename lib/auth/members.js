import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { AccessError } from "./session.js";

// Workspace sharing. The owner is workspaces.owner_id; everyone else is a row
// in workspace_members. Teammates are added by email and must already have
// an account (sign-up is open, so they can create one in a minute).

async function findUserByEmail(email) {
  const supabase = createServiceClient();
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => u.email?.toLowerCase() === wanted);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function emailOf(userId) {
  const { data } = await createServiceClient().auth.admin.getUserById(userId);
  return data?.user?.email ?? "Unknown user";
}

/** Owner first, then members, each with their email. */
export async function listMembers(workspace) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const people = [{ userId: workspace.owner_id, role: "owner" }, ...data.map((m) => ({ userId: m.user_id, role: "member" }))];
  return Promise.all(people.map(async (p) => ({ ...p, email: await emailOf(p.userId) })));
}

export async function addMember(workspace, email) {
  const clean = String(email ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(clean)) throw new AccessError("Enter a valid email address.", 400);

  const user = await findUserByEmail(clean);
  if (!user) {
    throw new AccessError("No account uses that email yet. Ask them to create one on the sign-in page, then add them.", 404);
  }
  if (user.id === workspace.owner_id) throw new AccessError("That person already owns this workspace.", 409);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: user.id, role: "member" });
  if (error) {
    if (error.code === "23505") throw new AccessError("That person is already a member.", 409);
    throw new Error(error.message);
  }
  return { userId: user.id, email: user.email, role: "member" };
}

export async function removeMember(workspaceId, userId) {
  const { error } = await createServiceClient()
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
