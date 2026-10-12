"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHECK_TYPES } from "@/lib/intellects/check-types";

const SEVERITY_TEXT = {
  critical: "text-destructive",
  major: "text-[var(--status-idle)]",
  minor: "text-foreground",
  observation: "text-muted-foreground",
};

const KIND_LABEL = {
  missing_element: "Missing element",
  inconsistency: "Inconsistency",
  cross_document: "Between documents",
  wording: "Wording",
  date_or_timeline: "Dates and timelines",
  citation_risk: "Audit risk",
};

export function ChecksPanel({ assets, catalog, equipped, onRun, onGoToIntellects }) {
  const typeNames = useMemo(() => Object.fromEntries(catalog.map((i) => [i.key, i.name])), [catalog]);
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
      <p className="max-w-xl text-sm text-muted-foreground">
        Checks need to know what kind of document they are looking at.{" "}
        <button onClick={onGoToIntellects} className="text-foreground underline underline-offset-4">
          Add a document type
        </button>{" "}
        first.
      </p>
    );
  }

  if (eligible.length === 0) {
    return (
      <p className="max-w-xl text-sm text-muted-foreground">
        {untyped.length > 0
          ? "None of your files has a document type yet. Set one on the Files tab, then come back."
          : "Upload a file and give it a document type, then come back."}
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground">Document</span>
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setAssetId(e.target.value)}
            className="h-10 border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {eligible.map((a) => (
              <option key={a.id} value={a.id}>
                {a.filename} ({typeNames[a.intellect_key]})
              </option>
            ))}
          </select>
        </label>

        <fieldset className="text-sm">
          <legend className="mb-1.5 text-foreground">Check</legend>
          <div className="flex flex-col gap-2">
            {CHECK_TYPES.map((t) => (
              <label key={t.key} className="flex cursor-pointer gap-2">
                <input
                  type="radio"
                  name="checkType"
                  className="mt-1 accent-[var(--primary)]"
                  checked={checkType === t.key}
                  onChange={() => setCheckType(t.key)}
                />
                <span>
                  <span className="text-foreground">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Button onClick={run} disabled={running}>
          {running && <Loader2 className="animate-spin" />}
          {running ? "Checking…" : "Run check"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {eligible.length > 1
            ? `Also compared with ${eligible.length - 1} other document${eligible.length - 1 === 1 ? "" : "s"}.`
            : "Add a second typed document to compare across documents."}
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }) {
  const order = ["critical", "major", "minor", "observation"];
  const findings = order.flatMap((sev) => result.findings.filter((f) => f.severity === sev));

  return (
    <div className="mt-8">
      <h3 className="font-display text-xl text-foreground">{result.document.filename}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Overall risk: <span className="font-medium capitalize text-foreground">{result.overallRisk}</span>
        {result.comparedWith.length > 0 && <> · compared with {result.comparedWith.map((c) => c.filename).join(", ")}</>}
      </p>
      <p className="mt-3 leading-relaxed text-foreground">{result.summary}</p>
      {result.truncated && (
        <p className="mt-2 text-xs text-[var(--status-idle)]">Very long document: only the first part was checked.</p>
      )}

      {findings.length === 0 ? (
        <p className="mt-6 border-y border-border py-6 text-sm text-muted-foreground">No findings.</p>
      ) : (
        <ol className="mt-6 divide-y divide-border border-y border-border">
          {findings.map((f) => (
            <li key={f.id} className="py-4">
              <p className="text-xs uppercase tracking-wider">
                <span className={`font-semibold ${SEVERITY_TEXT[f.severity]}`}>{f.severity}</span>
                <span className="text-muted-foreground"> · {KIND_LABEL[f.kind] ?? f.kind}</span>
              </p>
              <h4 className="mt-1 font-display text-lg text-foreground">{f.title}</h4>
              <Field label="Found">
                <span className="italic text-muted-foreground">{f.evidence}</span>
                <span className="text-xs text-muted-foreground"> ({f.document})</span>
              </Field>
              <Field label="How an auditor would write it">{f.licensor_citation}</Field>
              <Field label="Why it matters">{f.why_it_matters}</Field>
              <Field label="Fix">{f.recommended_fix}</Field>
            </li>
          ))}
        </ol>
      )}

      {result.strengths.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground">In order</h4>
          <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
            {result.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-foreground">
      <span className="mr-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </p>
  );
}
