import "server-only";

/**
 * Forwards a file upload to the n8n workflow that currently owns
 * ingestion end to end: it inserts the `assets` row itself (via its
 * own Postgres node) and writes vectors into `n8n_vectors`.
 *
 * This is a deliberate, contained swap, same seam as
 * lib/extraction/registry.js, just one level up the pipeline. When
 * you're ready to bring ingestion back in-house, this is the only
 * file the upload route needs to stop calling.
 */
export async function forwardUploadToN8n({ file, workspaceId, description }) {
  const webhookUrl = process.env.N8N_UPLOAD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("Missing N8N_UPLOAD_WEBHOOK_URL in .env.local");
  }

  const formData = new FormData();
  // "data" matches the field name n8n's file input expects (mirrors
  // the Form Trigger's own file field convention: data[0].filename / .mimetype)
  formData.append("data", file, file.name);
  formData.append("workspace_id", workspaceId);
  formData.append("description", description ?? "");

  const res = await fetch(webhookUrl, {
    method: "POST",
    body: formData,
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`n8n returned ${res.status}: ${raw.slice(0, 300)}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    // n8n workflows don't always return JSON from the last node,
    // that's fine, the upload still succeeded on n8n's end.
    return { raw };
  }
}