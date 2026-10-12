"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_LABEL = {
  pending: { text: "Queued", className: "text-muted-foreground" },
  processing: { text: "Reading…", className: "text-muted-foreground" },
  ready: { text: "Ready", className: "text-[var(--status-active)]" },
  error: { text: "Failed", className: "text-destructive" },
};

export function AssetList({ assets, onDelete, typeOptions = [], onChangeType }) {
  const [deletingId, setDeletingId] = useState(null);

  if (assets.length === 0) {
    return <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">No files yet.</p>;
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {assets.map((asset) => {
        const status = STATUS_LABEL[asset.status] ?? STATUS_LABEL.pending;
        return (
          <li key={asset.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="truncate text-sm font-medium text-foreground">{asset.filename}</p>
              {asset.status === "error" && asset.error_message ? (
                <p className="text-xs text-destructive">{asset.error_message}</p>
              ) : (
                asset.description && <p className="truncate text-xs text-muted-foreground">{asset.description}</p>
              )}
            </div>

            {typeOptions.length > 0 && (
              <select
                aria-label={`Document type for ${asset.filename}`}
                value={typeOptions.some((t) => t.key === asset.intellect_key) ? asset.intellect_key : ""}
                onChange={(e) => onChangeType?.(asset.id, e.target.value || null)}
                className="h-8 max-w-[11rem] rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No document type</option>
                {typeOptions.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <span className={`w-16 text-xs ${status.className}`}>{status.text}</span>

            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${asset.filename}`}
              className="text-muted-foreground hover:text-destructive"
              disabled={deletingId === asset.id}
              onClick={async () => {
                setDeletingId(asset.id);
                try {
                  await onDelete(asset.id);
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
