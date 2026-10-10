import "server-only";

// Model APIs regularly answer 429 / 503 ("high demand") for a few
// seconds. n8n nodes paper over that with "Retry On Fail". Same here.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const DELAYS_MS = [1000, 3000];
// Free-tier quotas reset per minute. Gemini says how long to wait; honour
// it once if it is short enough to sit inside a web request.
const MAX_QUOTA_WAIT_MS = 45_000;

/** fetch() that retries transient failures, then returns the last response. */
export async function fetchWithRetry(url, init) {
  let quotaWaited = false;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);

    if (res.status === 429 && !quotaWaited) {
      const wait = await retryAfterMs(res);
      if (wait !== null && wait <= MAX_QUOTA_WAIT_MS) {
        quotaWaited = true;
        await sleep(wait + 500);
        continue;
      }
    }

    if (!RETRYABLE.has(res.status) || attempt >= DELAYS_MS.length) {
      return res;
    }
    await sleep(DELAYS_MS[attempt] + Math.random() * 500);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retryAfterMs(res) {
  const header = Number(res.headers.get("retry-after"));
  if (header > 0) return header * 1000;
  try {
    const body = await res.clone().text();
    const match = body.match(/retry in ([\d.]+)s/i);
    return match ? Number(match[1]) * 1000 : null;
  } catch {
    return null;
  }
}
