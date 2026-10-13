"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_LABEL = {
  pending: { text: "Queued", className: "text-muted-foreground" },
  processing: { text: "Reading…", className: "text-muted-foreground" },
  ready: { text: "Ready", className: "text-[var(--status-active)]" },
  error: { text: "Failed", className: "text-destructive" },
};

function ago(iso) {
  if (!iso) return "not yet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

export function AssetList({ assets, onDelete, typeOptions = [], onChangeType, onSync }) {
  const [deletingId, setDeletingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [syncError, setSyncError] = useState(null);

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
              {asset.source === "google_sheets" && (
                <p className="text-xs text-muted-foreground">
                  Google Sheet, checked {ago(asset.last_synced_at)}
                  {asset.sync_error && <span className="text-destructive"> · {asset.sync_error}</span>}
                </p>
              )}
              {syncError?.id === asset.id && <p className="text-xs text-destructive">{syncError.message}</p>}
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

            {asset.source === "google_sheets" && onSync && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Sync ${asset.filename} from Google`}
                title="Check Google for changes"
                className="text-muted-foreground"
                disabled={syncingId === asset.id}
                onClick={async () => {
                  setSyncingId(asset.id);
                  setSyncError(null);
                  try {
                    await onSync(asset.id);
                  } catch (err) {
                    setSyncError({ id: asset.id, message: err.message });
                  } finally {
                    setSyncingId(null);
                  }
                }}
              >
                {syncingId === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            )}

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
