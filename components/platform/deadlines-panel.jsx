"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CalendarX2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deadlineStatus, describeInterval, todayString } from "@/lib/deadlines/status";

const LEVEL_STYLE = {
  overdue: "border-destructive/50 bg-destructive/10",
  red: "border-destructive/50 bg-destructive/10",
  amber: "border-[var(--status-idle)]/50 bg-[var(--status-idle)]/10",
  ok: "border-border bg-card",
};

const PILL_STYLE = {
  overdue: "bg-destructive text-white",
  red: "bg-destructive text-white",
  amber: "bg-[var(--status-idle)] text-black",
  ok: "bg-secondary text-primary",
};

const KIND_LABEL = {
  effective: "Effective",
  signed: "Signed",
  last_review: "Last review",
  review_due: "Review due",
  expiry: "Expires",
  completion: "Completed",
  event: "Event",
  other: "Other",
  derived: "Calculated",
  missing: "Missing",
};

const fmt = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

/** Counts of deadlines that need attention now (overdue or within a week). Used for the tab badge. */
export function urgentDeadlineCount(dates) {
  const today = todayString();
  return dates.filter((d) => d.deadline_date && ["overdue", "red"].includes(deadlineStatus(d.deadline_date, today).level))
    .length;
}

export function DeadlinesPanel({ dates, assets, catalog, error, onRescan }) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  const today = todayString();
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const typeName = useMemo(() => Object.fromEntries(catalog.map((i) => [i.key, i.abbreviation])), [catalog]);
  const ruleEvery = useMemo(() => {
    const map = {};
    for (const i of catalog) for (const r of i.deadlineRules ?? []) map[`${i.key}:${r.key}`] = describeInterval(r.every);
    return map;
  }, [catalog]);

  const deadlines = dates
    .filter((d) => d.deadline_date)
    .map((d) => ({ ...d, status: deadlineStatus(d.deadline_date, today) }))
    .sort((a, b) => a.status.days - b.status.days);
  const missing = dates.filter((d) => d.kind === "missing");
  const allDates = dates.filter((d) => d.date_value && d.kind !== "derived");

  const counts = {
    overdue: deadlines.filter((d) => d.status.level === "overdue").length,
    red: deadlines.filter((d) => d.status.level === "red").length,
    amber: deadlines.filter((d) => d.status.level === "amber").length,
  };

  async function rescan() {
    setScanning(true);
    setScanError(null);
    try {
      await onRescan();
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  }

  const readyFiles = assets.filter((a) => a.status === "ready").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Chip tone="red" n={counts.overdue} label="overdue" />
          <Chip tone="red" n={counts.red} label="due within 7 days" />
          <Chip tone="amber" n={counts.amber} label="due within 30 days" />
        </div>
        <Button variant="outline" size="sm" onClick={rescan} disabled={scanning || readyFiles === 0}>
          {scanning ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {scanning ? "Scanning…" : "Rescan dates"}
        </Button>
      </div>

      {(error || scanError) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || scanError}
        </div>
      )}

      {deadlines.length === 0 && missing.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <CalendarClock className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No deadlines found</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {readyFiles === 0
                ? "Upload documents and their dates and deadlines will appear here automatically."
                : "Nothing with a due date was found. If these files were uploaded before this tab existed, use Rescan dates. Set each file's document type so renewal rules apply."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deadlines.map((d) => {
            const asset = assetById[d.asset_id];
            const rule = d.deadline_rule ? ruleEvery[`${asset?.intellect_key}:${d.deadline_rule}`] : null;
            const urgent = d.status.level === "overdue" || d.status.level === "red";
            return (
              <div key={d.id} className={`rounded-xl border p-4 ${LEVEL_STYLE[d.status.level]}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {urgent && <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive" />}
                      <h4 className="font-display text-base text-foreground">{d.label}</h4>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {asset ? (
                        <>
                          {asset.intellect_key && typeName[asset.intellect_key] && (
                            <span className="mr-1.5 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                              {typeName[asset.intellect_key]}
                            </span>
                          )}
                          {asset.filename}
                          {d.page ? `, p. ${d.page}` : ""}
                        </>
                      ) : (
                        "Unknown document"
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_STYLE[d.status.level]}`}>
                      {d.status.text}
                    </span>
                    <p className="mt-1 text-sm font-medium text-foreground">{fmt(d.deadline_date)}</p>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {d.deadline_basis === "stated"
                    ? "Stated in the document"
                    : `Required by the document type${rule ? `: at least every ${rule}` : ""}${
                        d.date_value ? `, counted from ${fmt(d.date_value)}` : ""
                      }`}
                </p>
                {d.note && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--status-idle)]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    {d.note}
                  </p>
                )}
                {d.quote && <p className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">{d.quote}</p>}
              </div>
            );
          })}

          {missing.map((d) => (
            <div key={d.id} className="rounded-xl border border-[var(--status-idle)]/50 bg-[var(--status-idle)]/10 p-4">
              <div className="flex items-center gap-2">
                <CalendarX2 className="h-4 w-4 flex-shrink-0 text-[var(--status-idle)]" />
                <h4 className="font-display text-base text-foreground">{d.label}: no date to count from</h4>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{assetById[d.asset_id]?.filename ?? "Unknown document"}</p>
              <p className="mt-2 text-xs text-muted-foreground">{d.note}</p>
            </div>
          ))}
        </div>
      )}

      {allDates.length > 0 && (
        <details className="rounded-xl border border-border bg-card px-5 py-4">
          <summary className="cursor-pointer select-none font-display text-base text-foreground">
            All dates found ({allDates.length})
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">What</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 font-medium">Document</th>
                </tr>
              </thead>
              <tbody>
                {[...allDates]
                  .sort((a, b) => a.date_value.localeCompare(b.date_value))
                  .map((d) => (
                    <tr key={d.id} className="border-t border-border/60 align-top">
                      <td className="whitespace-nowrap py-2 pr-3 text-foreground">{fmt(d.date_value)}</td>
                      <td className="py-2 pr-3 text-foreground">{d.label}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{KIND_LABEL[d.kind] ?? d.kind}</td>
                      <td className="py-2 text-muted-foreground">
                        {assetById[d.asset_id]?.filename ?? "Unknown"}
                        {d.page ? `, p. ${d.page}` : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

function Chip({ tone, n, label }) {
  const on = n > 0;
  const style =
    on && tone === "red"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : on
        ? "border-[var(--status-idle)]/50 bg-[var(--status-idle)]/10 text-[var(--status-idle)]"
        : "border-border text-muted-foreground";
  return (
    <span className={`rounded-full border px-2.5 py-1 font-medium ${style}`}>
      {n} {label}
    </span>
  );
}
