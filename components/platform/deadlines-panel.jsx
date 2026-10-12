"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deadlineStatus, describeInterval, todayString } from "@/lib/deadlines/status";

const ROW_STYLE = {
  overdue: "border-l-[3px] border-l-destructive bg-destructive/10",
  red: "border-l-[3px] border-l-destructive bg-destructive/10",
  amber: "border-l-[3px] border-l-[var(--status-idle)]",
  ok: "border-l-[3px] border-l-transparent",
};

const STATUS_TEXT = {
  overdue: "font-semibold text-destructive",
  red: "font-semibold text-destructive",
  amber: "font-medium text-[var(--status-idle)]",
  ok: "text-muted-foreground",
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
};

const fmt = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

/** Deadlines that are overdue or due within a week. Used for the tab badge and overview. */
export function urgentDeadlineCount(dates) {
  const today = todayString();
  return dates.filter((d) => d.deadline_date && ["overdue", "red"].includes(deadlineStatus(d.deadline_date, today).level))
    .length;
}

export function DeadlinesPanel({ dates, assets, catalog, error, onRescan }) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [filter, setFilter] = useState("all");

  const today = todayString();
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const typeName = useMemo(() => Object.fromEntries(catalog.map((i) => [i.key, i.name])), [catalog]);
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
  const allDates = dates.filter((d) => d.date_value && !d.deadline_date);

  const shown = deadlines.filter((d) => {
    if (filter === "urgent") return d.status.level === "overdue" || d.status.level === "red";
    if (filter === "soon") return d.status.level !== "ok";
    return true;
  });

  const count = (levels) => deadlines.filter((d) => levels.includes(d.status.level)).length;
  const readyFiles = assets.filter((a) => a.status === "ready").length;

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

  const filters = [
    ["all", `All (${deadlines.length})`],
    ["soon", `Within 30 days or overdue (${count(["overdue", "red", "amber"])})`],
    ["urgent", `Within 7 days or overdue (${count(["overdue", "red"])})`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 text-sm">
          {filters.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 transition-colors ${
                filter === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={rescan} disabled={scanning || readyFiles === 0}>
          {scanning ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {scanning ? "Reading files…" : "Re-read dates"}
        </Button>
      </div>

      {(error || scanError) && <p className="text-sm text-destructive">{error || scanError}</p>}

      {deadlines.length === 0 && missing.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
          {readyFiles === 0
            ? "No files yet. Upload a document and its dates will be listed here."
            : "No due dates found. Files uploaded before this tab existed need Re-read dates, and each file needs a document type so the renewal rules apply."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[44rem]">
            <div className="grid grid-cols-[9rem_7.5rem_1fr_16rem] gap-x-4 border-b border-foreground/30 px-3 pb-2 text-xs uppercase tracking-wider text-muted-foreground">
              <span>Status</span>
              <span>Due</span>
              <span>Item</span>
              <span>Document</span>
            </div>

            {shown.map((d) => {
              const asset = assetById[d.asset_id];
              const rule = d.deadline_rule ? ruleEvery[`${asset?.intellect_key}:${d.deadline_rule}`] : null;
              const urgent = d.status.level === "overdue" || d.status.level === "red";
              return (
                <div key={d.id} className={`border-b border-border px-3 py-3 ${ROW_STYLE[d.status.level]}`}>
                  <div className="grid grid-cols-[9rem_7.5rem_1fr_16rem] items-baseline gap-x-4 text-sm">
                    <span className={`flex items-center gap-1.5 ${STATUS_TEXT[d.status.level]}`}>
                      {urgent && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
                      {d.status.text}
                    </span>
                    <span className="text-foreground">{fmt(d.deadline_date)}</span>
                    <span className="text-foreground">{d.label}</span>
                    <span className="min-w-0 text-muted-foreground">
                      <span className="block truncate">{asset?.filename ?? "Unknown document"}</span>
                      {asset?.intellect_key && typeName[asset.intellect_key] && (
                        <span className="block truncate text-xs">{typeName[asset.intellect_key]}</span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.deadline_basis === "stated"
                      ? "Date stated in the document."
                      : `Required by the document type${rule ? `: at least every ${rule}` : ""}${
                          d.date_value ? `, counted from ${fmt(d.date_value)}` : ""
                        }.`}
                    {d.page ? ` Page ${d.page}.` : ""}
                  </p>
                  {d.note && <p className="mt-1 text-xs text-[var(--status-idle)]">{d.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Could not calculate</h3>
          <ul className="divide-y divide-border border-y border-border text-sm">
            {missing.map((d) => (
              <li key={d.id} className="py-2.5">
                <span className="text-foreground">{assetById[d.asset_id]?.filename ?? "Unknown document"}</span>
                <span className="text-muted-foreground">: {d.label}. </span>
                <span className="text-muted-foreground">{d.note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {allDates.length > 0 && (
        <details>
          <summary className="cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground">
            Other dates found in the documents ({allDates.length})
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-foreground/30">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">What</th>
                  <th className="py-2 pr-3 font-medium">Kind</th>
                  <th className="py-2 font-medium">Document</th>
                </tr>
              </thead>
              <tbody>
                {[...allDates]
                  .sort((a, b) => a.date_value.localeCompare(b.date_value))
                  .map((d) => (
                    <tr key={d.id} className="border-b border-border align-top">
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
