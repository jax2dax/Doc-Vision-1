"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LinkGoogleSheet({ google, typeOptions = [], onLink }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [intellectKey, setIntellectKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setUrl("");
    setDescription("");
    setIntellectKey("");
    setError(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (busy || !url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onLink({ url: url.trim(), description: description.trim(), intellectKey: intellectKey || null });
      setOpen(false);
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(google.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the address is selectable on screen anyway.
    }
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Or{" "}
        <button onClick={() => setOpen(true)} className="text-foreground underline underline-offset-4">
          link a Google Sheet
        </button>{" "}
        so the dates update when the sheet changes.
      </p>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (busy) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link a Google Sheet</DialogTitle>
            <DialogDescription>Read only. No client information in the sheet.</DialogDescription>
          </DialogHeader>

          {!google.configured ? (
            <p className="text-sm text-muted-foreground">
              Google Sheets is not set up on this server yet. Add the service account key as{" "}
              <span className="font-mono text-foreground">GOOGLE_SERVICE_ACCOUNT_JSON</span> in the environment settings,
              then restart.
            </p>
          ) : (
            <form onSubmit={submit}>
              <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  In Google Sheets, choose <span className="text-foreground">Share</span> and add this address as a{" "}
                  <span className="text-foreground">Viewer</span>:
                  <span className="mt-1 flex items-center gap-2">
                    <span className="select-all break-all font-mono text-xs text-foreground">{google.email}</span>
                    <button type="button" onClick={copyEmail} className="text-xs underline underline-offset-2">
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </span>
                </li>
                <li>Paste the sheet&apos;s web address below.</li>
              </ol>

              <Label htmlFor="sheet-url">Sheet link</Label>
              <Input
                id="sheet-url"
                className="mt-2"
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />

              {typeOptions.length > 0 && (
                <div className="mt-4">
                  <Label htmlFor="sheet-type">Document type</Label>
                  <select
                    id="sheet-type"
                    value={intellectKey}
                    onChange={(e) => setIntellectKey(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Not specified</option>
                    {typeOptions.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="sheet-desc">Description (optional)</Label>
                <Input
                  id="sheet-desc"
                  className="mt-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='e.g. "Delegation book, all staff"'
                />
              </div>

              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-[2]" disabled={busy || !url.trim()}>
                  {busy && <Loader2 className="animate-spin" />}
                  {busy ? "Reading the sheet…" : "Link sheet"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
