"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, Gavel, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHECK_TYPES } from "@/lib/intellects/check-types";

const SEVERITY_STYLE = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  major: "border-[var(--status-idle)]/40 bg-[var(--status-idle)]/10 text-[var(--status-idle)]",
  minor: "border-border bg-secondary text-primary",
  observation: "border-border bg-muted text-muted-foreground",
};

const RISK_STYLE = {
  high: "text-destructive",
  moderate: "text-[var(--status-idle)]",
  low: "text-[var(--status-active)]",
};

const KIND_LABEL = {
  missing_element: "Missing element",
  inconsistency: "Inconsistency",
  cross_document: "Cross-document",
  wording: "Wording",
  date_or_timeline: "Dates and timelines",
  citation_risk: "Citation risk",
};

export function ChecksPanel({ assets, catalog, equipped, onRun, onGoToIntellects }) {
  const abbreviations = useMemo(() => Object.fromEntries(catalog.map((i) => [i.key, i.abbreviation])), [catalog]);
  const eligible = assets.filter((a) => a.status === "ready" && a.intellect_key && equipped.includes(a.intellect_key));
  const untyped = assets.filter((a) => a.status === "ready" && !(a.intellect_key && equipped.includes(a.intellect_key)));

  const [assetId, setAssetId] = useState("");
  const [checkType, setCheckType] = useState(CHECK_TYPES[0].key);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const selected = eligible.find((a) => a.id === assetId) ?? eligible[0] ?? null;

  async function run() {
    if (!selected) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      setResult(await onRun(selected.id, checkType));
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  if (equipped.length === 0) {
    return (
      <Empty
        icon={ShieldAlert}
        title="Equip an intellect first"
        body="Checks need to know what kind of document they are looking at. Equip the document types you keep in this workspace."
        action={<Button onClick={onGoToIntellects}>Open Intellects</Button>}
      />
    );
  }

  if (eligible.length === 0) {
    return (
      <Empty
        icon={ClipboardCheck}
        title="No typed documents yet"
        body={
          untyped.length > 0
            ? "Your files have no document type. On the Files tab, set each file's type (for example ISP), then come back to run a check."
            : "Upload a file and choose its document type, then come back to run a check."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Document</span>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => setAssetId(e.target.value)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {eligible.map((a) => (
                <option key={a.id} value={a.id}>
                  {abbreviations[a.intellect_key]} · {a.filename}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1.5 font-medium text-foreground">Check</legend>
            <div className="flex flex-col gap-2">
              {CHECK_TYPES.map((t) => (
                <label
                  key={t.key}
                  className={`flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition-colors ${
                    checkType === t.key ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkType"
                    className="mt-1 accent-[var(--primary)]"
                    checked={checkType === t.key}
                    onChange={() => setCheckType(t.key)}
                  />
                  <span>
                    <span className="block font-medium text-foreground">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {eligible.length > 1
              ? `Will also compare against ${eligible.length - 1} other typed document${eligible.length - 1 === 1 ? "" : "s"}.`
              : "Add another typed document to enable cross-checking."}
          </p>
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="animate-spin" /> : <Gavel />}
            {running ? "Reviewing…" : "Run check"}
          </Button>
        </div>
      </div>

      {running && (
        <p className="px-1 text-sm text-muted-foreground">
          Reading the whole document and its comparison documents. This usually takes 10 to 40 seconds.
        </p>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }) {
  const counts = result.findings.reduce((acc, f) => ({ ...acc, [f.severity]: (acc[f.severity] ?? 0) + 1 }), {});
  const ordered = ["critical", "major", "minor", "observation"].flatMap((sev) =>
    result.findings.filter((f) => f.severity === sev)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-display text-lg text-foreground">{result.document.filename}</span>
          <span className="text-sm text-muted-foreground">
            Overall risk:{" "}
            <strong className={`font-semibold capitalize ${RISK_STYLE[result.overallRisk] ?? ""}`}>
              {result.overallRisk}
            </strong>
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{result.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {["critical", "major", "minor", "observation"].map(
            (sev) =>
              counts[sev] > 0 && (
                <span key={sev} className={`rounded-full border px-2 py-0.5 font-medium ${SEVERITY_STYLE[sev]}`}>
                  {counts[sev]} {sev}
                </span>
              )
          )}
          {result.findings.length === 0 && <span className="text-muted-foreground">No findings</span>}
        </div>
        {result.comparedWith.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Compared with: {result.comparedWith.map((c) => `${c.type} (${c.filename})`).join(", ")}
          </p>
        )}
        {result.truncated && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--status-idle)]">
            <AlertTriangle className="h-3.5 w-3.5" /> Very long document: only the first part was reviewed.
          </p>
        )}
      </div>

      {ordered.map((f) => (
        <div key={f.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SEVERITY_STYLE[f.severity]}`}
            >
              {f.severity}
            </span>
            <span className="text-[11px] text-muted-foreground">{KIND_LABEL[f.kind] ?? f.kind}</span>
          </div>
          <h4 className="mt-2 font-display text-base text-foreground">{f.title}</h4>

          <Block label="Evidence">
            <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground">{f.evidence}</blockquote>
            <span className="text-xs text-muted-foreground">{f.document}</span>
          </Block>
          <Block label="How a licensor would cite it">{f.licensor_citation}</Block>
          <Block label="Why it matters">{f.why_it_matters}</Block>
          <Block label="Recommended fix">{f.recommended_fix}</Block>
        </div>
      ))}

      {result.strengths.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-base text-foreground">Done well</h4>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {result.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Block({ label, children }) {
  return (
    <div className="mt-3 flex flex-col gap-1 text-sm">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function Empty({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}
