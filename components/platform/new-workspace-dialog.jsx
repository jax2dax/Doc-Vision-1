"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NewWorkspaceForm } from "@/components/platform/new-workspace-form";

export function NewWorkspaceDialog({ open, onOpenChange }) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
          <DialogDescription>Create a persistent space for your documents and data.</DialogDescription>
        </DialogHeader>
        <NewWorkspaceForm
          onCancel={() => onOpenChange(false)}
          onCreated={(workspace) => {
            onOpenChange(false);
            router.push(`/platform/workspace/${workspace.id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}