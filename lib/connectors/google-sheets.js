import "server-only";
import { createSign } from "node:crypto";
import { fetchWithRetry } from "@/lib/rag/http.js";

// Reads Google Sheets (and .xlsx files stored in Drive) as a service account:
// a robot identity that can only see files someone has shared with its email
// address. Read only. No user login involved.
//
// Env: GOOGLE_SERVICE_ACCOUNT_JSON = the key file's contents, either the raw
// JSON on one line or the same JSON base64 encoded (easier for Vercel).

const API = "https://www.googleapis.com/drive/v3";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const SHEET_MIME = "application/vnd.google-apps.spreadsheet";
export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class GoogleError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const key = JSON.parse(text);
    if (!key.client_email || !key.private_key) throw new Error("missing fields");
    return { ...key, private_key: key.private_key.replace(/\\n/g, "\n") };
  } catch {
    throw new GoogleError(
      "GOOGLE_SERVICE_ACCOUNT_JSON in .env.local is not valid. Paste the whole key file on one line (or base64 encode it).",
      500
    );
  }
}

export function googleConfigured() {
  try {
    return Boolean(credentials());
  } catch {
    return false;
  }
}

/** The email address people must share their sheet with. */
export function serviceAccountEmail() {
  try {
    return credentials()?.client_email ?? null;
  } catch {
    return null;
  }
}

// ---------- sign in ----------

let cachedToken = null;

const b64url = (input) => Buffer.from(input).toString("base64url");

async function accessToken() {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;

  const key = credentials();
  if (!key) {
    throw new GoogleError("Google Sheets is not set up yet. Add GOOGLE_SERVICE_ACCOUNT_JSON to .env.local.", 503);
  }

  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    b64url(
      JSON.stringify({
        iss: key.client_email,
        scope: SCOPE,
        aud: key.token_uri || "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    ),
  ].join(".");
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");

  const res = await fetchWithRetry(
    key.token_uri || "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
    },
    { timeoutMs: 20_000 }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GoogleError(`Google sign-in failed: ${json.error_description ?? json.error ?? res.status}`, 502);
  }
  cachedToken = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

// ---------- files ----------

/** Pulls the file id out of a Sheets/Drive link, or accepts a bare id. */
export function parseSheetId(input) {
  const text = String(input ?? "").trim();
  const fromUrl = text.match(/\/(?:spreadsheets|file)\/d\/([a-zA-Z0-9_-]{15,})/) ?? text.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (fromUrl) return fromUrl[1];
  return /^[a-zA-Z0-9_-]{25,}$/.test(text) ? text : null;
}

async function drive(path, params = {}) {
  const url = new URL(`${API}${path}`);
  url.searchParams.set("supportsAllDrives", "true");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetchWithRetry(
    url,
    { headers: { Authorization: `Bearer ${await accessToken()}` } },
    { timeoutMs: 60_000 }
  );
  if (res.ok) return res;

  const body = await res.json().catch(() => ({}));
  const reason = body.error?.errors?.[0]?.reason ?? "";
  const email = serviceAccountEmail();

  if (res.status === 404 || res.status === 403) {
    if (reason === "exportSizeLimitExceeded" || /too large/i.test(body.error?.message ?? "")) {
      throw new GoogleError("That sheet is too large for Google to export (over 10 MB). Split it into smaller sheets.", 413);
    }
    if (reason === "rateLimitExceeded" || reason === "userRateLimitExceeded") {
      throw new GoogleError("Google is rate limiting requests. Try again in a minute.", 429);
    }
    throw new GoogleError(
      `Can't open that sheet. In Google Sheets choose Share, add ${email ?? "the service account email"} as a Viewer, then try again.`,
      404
    );
  }
  if (res.status === 504) throw new GoogleError("Google took too long to respond. Try again.", 504);
  throw new GoogleError(`Google returned ${res.status}: ${body.error?.message ?? "request failed"}`, 502);
}

/** Name, type and last-modified time of a file. */
export async function getSheetMeta(fileId) {
  const res = await drive(`/files/${fileId}`, { fields: "id,name,mimeType,modifiedTime,trashed" });
  const meta = await res.json();
  if (meta.trashed) throw new GoogleError("That file is in the trash in Google Drive.", 404);
  if (meta.mimeType !== SHEET_MIME && meta.mimeType !== XLSX_MIME) {
    throw new GoogleError("That link is not a Google Sheet or an Excel (.xlsx) file in Drive.", 400);
  }
  return meta;
}

/** The file's contents as an .xlsx workbook. */
export async function downloadSheetAsXlsx(meta) {
  const res =
    meta.mimeType === SHEET_MIME
      ? await drive(`/files/${meta.id}/export`, { mimeType: XLSX_MIME })
      : await drive(`/files/${meta.id}`, { alt: "media" });
  return new Uint8Array(await res.arrayBuffer());
}
