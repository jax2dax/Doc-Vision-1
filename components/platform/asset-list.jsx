"use client";

import { useState } from "react";
import { FileImage, Trash2, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_META = {
  pending: { icon: Clock, label: "Queued", className: "text-muted-foreground" },
  processing: { icon: Loader2, label: "Extracting…", className: "text-primary [&_svg]:animate-spin" },
  ready: { icon: CheckCircle2, label: "Ready", className: "text-[var(--status-active)]" },
  error: { icon: AlertCircle, label: "Failed", className: "text-destructive" },
};

export function AssetList({ assets, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {assets.map((asset, i) => {
        const meta = STATUS_META[asset.status] ?? STATUS_META.pending;
        const StatusIcon = meta.icon;
        return (
          <div
            key={asset.id}
            className={`flex items-center gap-3 px-4 py-3 ${i < assets.length - 1 ? "border-b border-border/60" : ""}`}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <FileImage className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{asset.filename}</p>
              {asset.description ? (
                <p className="truncate text-xs text-muted-foreground">{asset.description}</p>
              ) : (
                asset.status === "error" &&
                asset.error_message && (
                  <p className="truncate text-xs text-destructive">{asset.error_message}</p>
                )
              )}
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${meta.className}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{meta.label}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
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
          </div>
        );
      })}
    </div>
  );
}