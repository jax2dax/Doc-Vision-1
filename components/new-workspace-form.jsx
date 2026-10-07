"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ACCEPTED = "image/png,image/jpeg,image/webp";

export function FileUploadDropzone({ onUpload }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function pickFile(file) {
    if (!file) return;
    setPendingFile(file);
    setError(null);
  }

  async function handleConfirm() {
    if (!pendingFile) return;
    setSubmitting(true);
    setError(null);
    try {
      await onUpload(pendingFile, description);
      setPendingFile(null);
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingFile) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
            <UploadCloud className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{pendingFile.name}</p>
            <p className="text-xs text-muted-foreground">{(pendingFile.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
        <Label htmlFor="asset-desc">Description (optional, but helps the AI a lot)</Label>
        <Input
          id="asset-desc"
          className="mt-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='e.g. "staff appointment schedule, not the client list"'
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setPendingFile(null);
              setError(null);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button className="flex-[2]" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Uploading & extracting…" : "Upload & Extract"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        pickFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <UploadCloud className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">Drop an image here, or click to browse</p>
      <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP — up to 15MB (V1 accepts images only)</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />
    </div>
  );
}
