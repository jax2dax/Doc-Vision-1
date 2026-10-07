"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { WorkspaceList } from "@/components/platform/workspace-list";
import { NewWorkspaceDialog } from "@/components/platform/new-workspace-dialog";

export function MobileWorkspaceSheet({ open, onOpenChange }) {
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Workspaces</SheetTitle>
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                setShowNewDialog(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </SheetHeader>
          <div className="overflow-y-auto">
            <WorkspaceList showDescription onSelect={() => onOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Reuses the same dialog component — on mobile it just renders centered,
          which is fine since it's a short two-field form, not worth a second
          bespoke mobile-only modal. */}
      <NewWorkspaceDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </>
  );
}
