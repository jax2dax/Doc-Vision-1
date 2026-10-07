import "server-only";

// Model APIs regularly answer 429 / 503 ("high demand") for a few
// seconds, n8n nodes paper over that with "Retry On Fail". Same here.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const DELAYS_MS = [1000, 3000];

/** fetch() that retries transient failures, then returns the last response. */
export async function fetchWithRetry(url, init) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (!RETRYABLE.has(res.status) || attempt === DELAYS_MS.length) {
      return res;
    }
    await new Promise((r) => setTimeout(r, DELAYS_MS[attempt] + Math.random() * 500));
  }
}
