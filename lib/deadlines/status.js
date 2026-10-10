// Date math and urgency levels. No server-only imports: used by both the
// extraction code on the server and the Due dates tab in the browser.

/** Days at or below which a deadline is shown as red. */
export const RED_WITHIN_DAYS = 7;
/** Days at or below which a deadline is shown as amber. */
export const AMBER_WITHIN_DAYS = 30;

const MS_PER_DAY = 86_400_000;

/** "YYYY-MM-DD" -> UTC midnight timestamp (no timezone drift). */
function utc(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Today as "YYYY-MM-DD" in the viewer's local time. */
export function todayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole days from `today` until `dateStr` (negative = overdue). */
export function daysUntil(dateStr, today = todayString()) {
  return Math.round((utc(dateStr) - utc(today)) / MS_PER_DAY);
}

/**
 * Adds months/days to a "YYYY-MM-DD" date. Month math clamps to the end of
 * the month (Jan 31 + 1 month = Feb 28), never rolls into the next one.
 */
export function addInterval(dateStr, { months = 0, days = 0 } = {}) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = m - 1 + months;
  const year = y + Math.floor(target / 12);
  const month = ((target % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const out = new Date(Date.UTC(year, month, Math.min(d, lastDay) + days));
  return out.toISOString().slice(0, 10);
}

/** Valid real calendar date in YYYY-MM-DD form? */
export function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d && y >= 1990 && y <= 2100;
}

/** @returns {{ level: "overdue" | "red" | "amber" | "ok", days: number, text: string }} */
export function deadlineStatus(dateStr, today = todayString()) {
  const days = daysUntil(dateStr, today);
  if (days < 0) {
    const n = Math.abs(days);
    return { level: "overdue", days, text: `Overdue by ${n} day${n === 1 ? "" : "s"}` };
  }
  const text = days === 0 ? "Due today" : days === 1 ? "Due in 1 day" : `Due in ${days} days`;
  if (days <= RED_WITHIN_DAYS) return { level: "red", days, text };
  if (days <= AMBER_WITHIN_DAYS) return { level: "amber", days, text };
  return { level: "ok", days, text };
}

export function describeInterval({ months, days } = {}) {
  if (months) return months % 12 === 0 ? `${months / 12} year${months === 12 ? "" : "s"}` : `${months} months`;
  if (days) return `${days} days`;
  return "";
}
