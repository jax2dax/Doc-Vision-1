import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isKnownIntellect, resolveIntellects } from "./index.js";

/** Keys of the intellects equipped in a workspace. */
export async function getEquippedKeys(workspaceId) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("workspace_intellects")
    .select("intellect_key")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load equipped intellects: ${error.message}`);
  return data.map((r) => r.intellect_key);
}

/** Full intellect objects equipped in a workspace. */
export async function getEquippedIntellects(workspaceId) {
  return resolveIntellects(await getEquippedKeys(workspaceId));
}

/** Replaces the equipped set. Unknown keys are rejected, not ignored. */
export async function setEquippedKeys(workspaceId, keys) {
  const unique = [...new Set(keys)];
  const unknown = unique.filter((k) => !isKnownIntellect(k));
  if (unknown.length) throw new Error(`Unknown intellect: ${unknown.join(", ")}`);

  const supabase = createServiceClient();
  const current = await getEquippedKeys(workspaceId);

  const toAdd = unique.filter((k) => !current.includes(k));
  const toRemove = current.filter((k) => !unique.includes(k));

  if (toAdd.length) {
    const { error } = await supabase
      .from("workspace_intellects")
      .insert(toAdd.map((intellect_key) => ({ workspace_id: workspaceId, intellect_key })));
    if (error) throw new Error(`Could not equip intellect: ${error.message}`);
  }
  if (toRemove.length) {
    const { error } = await supabase
      .from("workspace_intellects")
      .delete()
      .eq("workspace_id", workspaceId)
      .in("intellect_key", toRemove);
    if (error) throw new Error(`Could not remove intellect: ${error.message}`);
  }
  return unique;
}
