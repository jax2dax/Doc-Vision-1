"use client";

import { useState } from "react";
import { Check, Link2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const STRICTNESS_STYLE = {
  strict: "bg-destructive/10 text-destructive",
  moderate: "bg-secondary text-primary",
  flexible: "bg-muted text-muted-foreground",
};

export function IntellectsPanel({ catalog, equipped, onChange }) {
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState(null);

  async function toggle(key) {
    setBusyKey(key);
    setError(null);
    try {
      const next = equipped.includes(key) ? equipped.filter((k) => k !== key) : [...equipped, key];
      await onChange(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  }

  const names = Object.fromEntries(catalog.map((i) => [i.key, i.abbreviation]));

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {catalog.length === 0 ? (
        <div className="h-24 animate-pulse rounded-xl bg-accent" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {catalog.map((i) => {
            const on = equipped.includes(i.key);
            const busy = busyKey === i.key;
            return (
              <div
                key={i.key}
                className={`flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors ${
                  on ? "border-primary/50" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                        {i.abbreviation}
                      </span>
                      <h4 className="font-display text-lg leading-tight text-foreground">{i.name}</h4>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${STRICTNESS_STYLE[i.strictness]}`}>
                        {i.strictness} strictness
                      </span>
                      <span>{i.commonCitationCount} known citation patterns</span>
                      <span>v{i.version}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={on ? "secondary" : "default"}
                    disabled={busy}
                    onClick={() => toggle(i.key)}
                    className="flex-shrink-0"
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" />
                    ) : on ? (
                      <Check />
                    ) : (
                      <Plus />
                    )}
                    {on ? "Equipped" : "Equip"}
                  </Button>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{i.summary}</p>

                {i.crossChecksWith.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                    Cross-checks with {i.crossChecksWith.map((k) => names[k] ?? k).join(", ")}
                    {i.crossChecksWith.some((k) => !equipped.includes(k)) && on && (
                      <span className="text-primary"> (equip it to enable)</span>
                    )}
                  </p>
                )}

                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none hover:text-foreground">
                    What it requires ({i.requiredElements.length} elements)
                  </summary>
                  <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                    {i.requiredElements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
