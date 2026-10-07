"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { useWorkspaces } from "@/lib/workspaces-context";
import { WorkspaceAvatar } from "@/components/platform/workspace-avatar";
import { StatusPill } from "@/components/platform/status-badge";
import { NewWorkspaceDialog } from "@/components/platform/new-workspace-dialog";
import { Button } from "@/components/ui/button";

export default function PlatformHomePage() {
  const { workspaces, loading, error } = useWorkspaces();
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Your Workspaces</h1>
          <p className="text-sm text-muted-foreground">Protocols and documents for each clinic or department, organised and searchable.</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Create your first workspace</p>
            <p className="text-sm text-muted-foreground">Upload protocols and documents, then ask questions about them.</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/platform/workspace/${ws.id}`}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <WorkspaceAvatar workspace={ws} size={36} />
                <StatusPill status={ws.status} />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-foreground">{ws.name}</p>
                {ws.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{ws.description}</p>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {ws.fileCount} file{ws.fileCount === 1 ? "" : "s"}
              </div>
            </Link>
          ))}

          <button
            onClick={() => setShowNewDialog(true)}
            className="flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">New Workspace</span>
          </button>
        </div>
      )}

      {/* mobile-only floating create button since the header one is hidden below sm: */}
      <Button
        onClick={() => setShowNewDialog(true)}
        size="icon"
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg sm:hidden"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <NewWorkspaceDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
}