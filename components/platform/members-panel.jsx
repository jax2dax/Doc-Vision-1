"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MembersPanel({ members, role, userId, onAdd, onRemove }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState(null);

  async function add(e) {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(email.trim());
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(memberId) {
    setRemoving(memberId);
    setError(null);
    try {
      await onRemove(memberId);
      if (memberId === userId) window.location.assign("/platform/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-sm text-muted-foreground">
        Everyone listed can see this workspace&apos;s files and due dates, ask questions, upload and delete files. Only the
        owner can add or remove people, or delete the workspace.
      </p>

      <ul className="divide-y divide-border border-y border-border">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="min-w-0 truncate text-foreground">
              {m.email}
              {m.userId === userId && <span className="text-muted-foreground"> (you)</span>}
            </span>
            <span className="flex flex-shrink-0 items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{m.role}</span>
              {m.role !== "owner" && (role === "owner" || m.userId === userId) && (
                <button
                  onClick={() => remove(m.userId)}
                  disabled={removing === m.userId}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
                >
                  {m.userId === userId ? "Leave" : "Remove"}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {role === "owner" && (
        <form onSubmit={add} className="mt-5 flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            aria-label="Teammate's email"
          />
          <Button type="submit" disabled={busy || !email.trim()}>
            {busy && <Loader2 className="animate-spin" />}
            Add
          </Button>
        </form>
      )}
      {role === "owner" && (
        <p className="mt-2 text-xs text-muted-foreground">They need an account first. Ask them to create one on the sign-in page.</p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
