"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/lib/workspaces-context";

export function NewWorkspaceForm({ onCreated, onCancel }) {
  const { createWorkspace } = useWorkspaces();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const workspace = await createWorkspace({ name, description });
      setName("");
      setDescription("");
      onCreated?.(workspace);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-name">Name</Label>
        <Input
          id="ws-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="e.g. Client Records"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-desc">Description</Label>
        <Input
          id="ws-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this workspace for?"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2.5 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button className="flex-[2]" onClick={handleCreate} disabled={!name.trim() || submitting} type="button">
          {submitting ? "Creating…" : "Create Workspace"}
        </Button>
      </div>
    </div>
  );
}
