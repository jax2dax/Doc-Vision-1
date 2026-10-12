"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
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

const ACCEPTED =
  ".pdf,.xlsx,.csv,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function FileUploadDropzone({ onUpload, typeOptions = [] }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [description, setDescription] = useState("");
  const [intellectKey, setIntellectKey] = useState("");
  const [uploadingName, setUploadingName] = useState(null);
  const [error, setError] = useState(null);

  function pickFile(file) {
    if (!file || uploadingName) return;
    setError(null);
    setDescription("");
    setIntellectKey("");
    setPendingFile(file);
  }

  function closeDialog() {
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    const file = pendingFile;
    if (!file) return;
    setPendingFile(null);
    setError(null);
    setUploadingName(file.name);
    try {
      await onUpload(file, description.trim(), intellectKey || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = Boolean(uploadingName);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 border border-dashed px-4 py-8 text-center transition-colors ${
          busy ? "cursor-default" : "cursor-pointer"
        } ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
      >
        {busy ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="max-w-full truncate text-sm font-medium text-foreground">Processing {uploadingName}…</p>
            <p className="text-xs text-muted-foreground">Reading and indexing the file. This can take a minute.</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drop a file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">Excel, CSV, PDF or image, up to 20MB. No client information.</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <Dialog open={Boolean(pendingFile)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add file</DialogTitle>
            <DialogDescription>
              Do not upload client information. A short description helps when you ask questions later.
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{pendingFile?.name}</p>
              <p className="text-xs text-muted-foreground">
                {pendingFile && (pendingFile.size / 1024 / 1024 >= 1
                  ? `${(pendingFile.size / 1024 / 1024).toFixed(1)} MB`
                  : `${Math.max(1, Math.round(pendingFile.size / 1024))} KB`)}
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              upload();
            }}
          >
            {typeOptions.length > 0 && (
              <div className="mb-4">
                <Label htmlFor="asset-type">Document type</Label>
                <select
                  id="asset-type"
                  value={intellectKey}
                  onChange={(e) => setIntellectKey(e.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Not specified</option>
                  {typeOptions.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name} ({t.abbreviation})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Lets checks and chat treat this file as that kind of document.
                </p>
              </div>
            )}
            <Label htmlFor="asset-desc">Description</Label>
            <Input
              id="asset-desc"
              className="mt-2"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g. "Delegation book, all staff, 2026"'
            />
            <DialogFooter>
              <Button type="button" variant="outline" className="flex-1" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="flex-[2]">
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
