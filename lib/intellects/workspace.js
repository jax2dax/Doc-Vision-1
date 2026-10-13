import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isKnownIntellect, resolveIntellects } from "./index.js";
import { fromForm, validateForm } from "./custom.js";

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---------- custom document types ----------

// If migration 0005 has not been run yet the app should keep working with
// the built-in types, so a missing table reads as "no custom types".
const isMissingTable = (error) =>
  ["PGRST205", "42P01"].includes(error?.code) || /schema cache|does not exist/i.test(error?.message ?? "");

/** Custom document types defined in a workspace, as full document type objects. */
export async function getCustomIntellects(workspaceId) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("custom_intellects")
    .select("key, definition")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(`Could not load custom document types: ${error.message}`);
  }
  return data.map((r) => fromForm(r.definition, r.key));
}

/** Creates a custom type from form input and adds it to the workspace. Returns the new document type. */
export async function createCustomIntellect(workspaceId, input) {
  const { form, errors } = validateForm(input);
  if (errors.length) throw new InputError(errors.join(" "));

  const key = `custom-${crypto.randomUUID().slice(0, 8)}`;
  const supabase = createServiceClient();
  const { error } = await supabase.from("custom_intellects").insert({ workspace_id: workspaceId, key, definition: form });
  if (error) throw new Error(`Could not save document type: ${error.message}`);

  await supabase.from("workspace_intellects").insert({ workspace_id: workspaceId, intellect_key: key });
  return fromForm(form, key);
}

/** Replaces a custom type's definition. Returns the updated type and how many files use it. */
export async function updateCustomIntellect(workspaceId, key, input) {
  const { form, errors } = validateForm(input);
  if (errors.length) throw new InputError(errors.join(" "));

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("custom_intellects")
    .update({ definition: form, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("key", key)
    .select("key");
  if (error) throw new Error(`Could not save document type: ${error.message}`);
  if (!data?.length) throw new InputError("That document type was not found.", 404);

  const { data: files } = await supabase
    .from("assets")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("intellect_key", key);
  return { type: fromForm(form, key), fileCount: files?.length ?? 0 };
}

/** Deletes a custom type. Files that used it keep their data but lose their type. */
export async function deleteCustomIntellect(workspaceId, key) {
  const supabase = createServiceClient();
  await supabase.from("assets").update({ intellect_key: null }).eq("workspace_id", workspaceId).eq("intellect_key", key);
  await supabase.from("workspace_intellects").delete().eq("workspace_id", workspaceId).eq("intellect_key", key);

  const { data: vectors } = await supabase
    .from("n8n_vectors")
    .select("id, metadata")
    .eq("metadata->>workspace_id", workspaceId)
    .eq("metadata->>intellect_key", key);
  for (const v of vectors ?? []) {
    await supabase.from("n8n_vectors").update({ metadata: { ...v.metadata, intellect_key: null } }).eq("id", v.id);
  }

  const { error } = await supabase.from("custom_intellects").delete().eq("workspace_id", workspaceId).eq("key", key);
  if (error) throw new Error(`Could not delete document type: ${error.message}`);
}

// ---------- equipped types ----------

/** Keys of the document types added to a workspace. */
export async function getEquippedKeys(workspaceId, custom) {
  const supabase = createServiceClient();
  const [{ data, error }, customTypes] = await Promise.all([
    supabase
      .from("workspace_intellects")
      .select("intellect_key")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    custom ?? getCustomIntellects(workspaceId),
  ]);
  if (error) throw new Error(`Could not load equipped intellects: ${error.message}`);
  // Keys of document types that no longer exist are ignored.
  return data.map((r) => r.intellect_key).filter((k) => isKnownIntellect(k, customTypes));
}

/** Full document type objects added to a workspace (built-in and custom). */
export async function getEquippedIntellects(workspaceId) {
  const custom = await getCustomIntellects(workspaceId);
  return resolveIntellects(await getEquippedKeys(workspaceId, custom), custom);
}

/** Resolves specific keys for a workspace, built-in or custom. */
export async function resolveWorkspaceIntellects(workspaceId, keys) {
  return resolveIntellects(keys, await getCustomIntellects(workspaceId));
}

/** Replaces the equipped set. Unknown keys are rejected, not ignored. */
export async function setEquippedKeys(workspaceId, keys) {
  const custom = await getCustomIntellects(workspaceId);
  const unique = [...new Set(keys)];
  const unknown = unique.filter((k) => !isKnownIntellect(k, custom));
  if (unknown.length) throw new Error(`Unknown intellect: ${unknown.join(", ")}`);

  const supabase = createServiceClient();
  const current = await getEquippedKeys(workspaceId, custom);

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
