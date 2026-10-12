"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useWorkspaces } from "@/lib/workspaces-context";
import { NewWorkspaceDialog } from "@/components/platform/new-workspace-dialog";
import { Button } from "@/components/ui/button";

export default function PlatformHomePage() {
  const { workspaces, loading, error } = useWorkspaces();
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One per home or area. Each holds its own files and due dates.
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4" />
          New workspace
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="h-24 animate-pulse bg-accent" />
      ) : workspaces.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
          No workspaces yet.{" "}
          <button onClick={() => setShowNewDialog(true)} className="text-foreground underline underline-offset-4">
            Create the first one
          </button>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link
                href={`/platform/workspace/${ws.id}`}
                className="flex items-baseline justify-between gap-4 px-1 py-4 transition-colors hover:bg-accent/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg text-foreground">{ws.name}</span>
                  {ws.description && <span className="block truncate text-sm text-muted-foreground">{ws.description}</span>}
                </span>
                <span className="flex-shrink-0 text-sm text-muted-foreground">
                  {ws.fileCount} file{ws.fileCount === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NewWorkspaceDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
}
