"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeInterval } from "@/lib/deadlines/status";

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

  const names = Object.fromEntries(catalog.map((i) => [i.key, i.name]));

  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Pick the kinds of document this workspace holds. Each kind tells the app what the document contains, which
        dates it carries and how often it must be renewed. Do not upload client information.
      </p>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {catalog.length === 0 ? (
        <div className="h-24 animate-pulse bg-accent" />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {catalog.map((i) => {
            const on = equipped.includes(i.key);
            return (
              <li key={i.key} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-tight text-foreground">{i.name}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{i.summary}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={on ? "outline" : "default"}
                    disabled={busyKey === i.key}
                    onClick={() => toggle(i.key)}
                    className="flex-shrink-0"
                  >
                    {busyKey === i.key && <Loader2 className="animate-spin" />}
                    {on ? "Remove" : "Add"}
                  </Button>
                </div>

                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
                    Dates and rules
                  </summary>
                  <dl className="mt-3 grid max-w-2xl gap-x-6 gap-y-2 sm:grid-cols-[11rem_1fr]">
                    {i.dates.map((d) => (
                      <div key={d.name} className="contents">
                        <dt className="text-foreground">{d.name}</dt>
                        <dd className="text-muted-foreground">{d.meaning}</dd>
                      </div>
                    ))}
                    {i.deadlineRules.map((r) => (
                      <div key={r.key} className="contents">
                        <dt className="text-foreground">{r.label}</dt>
                        <dd className="text-muted-foreground">Renew at least every {describeInterval(r.every)}.</dd>
                      </div>
                    ))}
                    {i.crossChecksWith.length > 0 && (
                      <div className="contents">
                        <dt className="text-foreground">Works with</dt>
                        <dd className="text-muted-foreground">
                          {i.crossChecksWith.map((k) => names[k] ?? k).join(", ")}
                        </dd>
                      </div>
                    )}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
