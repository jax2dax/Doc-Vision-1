"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Users, Clock, Sparkles } from "lucide-react";
import { useWorkspaceDetail } from "@/hooks/use-workspace-detail";
import { WorkspaceAvatar } from "@/components/platform/workspace-avatar";
import { StatusPill } from "@/components/platform/status-badge";
import { StatTile } from "@/components/platform/stat-tile";
import { FileUploadDropzone } from "@/components/platform/file-upload-dropzone";
import { AssetList } from "@/components/platform/asset-list";

const TABS = ["overview", "files", "tasks", "activity"];

export default function WorkspaceDetailPage() {
  const { id } = useParams();
  const { workspace, assets, loading, error, uploadAsset, deleteAsset } = useWorkspaceDetail(id);
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-accent" />
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-accent" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-sm text-destructive">{error ?? "Workspace not found."}</p>
      </div>
    );
  }

  const readyFacts = assets.filter((a) => a.status === "ready").length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <WorkspaceAvatar workspace={workspace} size={34} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold text-foreground sm:text-xl">
              {workspace.name}
            </h1>
            {workspace.description && (
              <p className="truncate text-sm text-muted-foreground">{workspace.description}</p>
            )}
          </div>
          <StatusPill status={workspace.status} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-shrink-0 items-center gap-0 overflow-x-auto border-b border-border px-4 sm:px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm capitalize transition-colors sm:px-4 ${
              activeTab === tab
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab === "files" && assets.length > 0 && (
              <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-primary">
                {assets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile label="Files" value={assets.length} color="#0ea5e9" />
              <StatTile label="Extracted facts ready" value={readyFacts} color="#8b5cf6" />
              <StatTile label="Members" value={1} color="#22c55e" />
              <StatTile label="Status" value={workspace.status} color="#f59e0b" />
            </div>

            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">About — </span>
                {workspace.description || "No description yet."} This workspace currently holds{" "}
                {assets.length} file{assets.length === 1 ? "" : "s"}, with {readyFacts} fully processed and
                searchable by chat.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold text-foreground">Quick upload</h3>
              </div>
              <FileUploadDropzone onUpload={uploadAsset} />
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="flex flex-col gap-4">
            <FileUploadDropzone onUpload={uploadAsset} />
            <AssetList assets={assets} onDelete={deleteAsset} />
          </div>
        )}

        {activeTab === "tasks" && (
          <EmptyTabState
            icon={Clock}
            title="Tasks are coming in V1.5"
            description="This tab is wired up and ready — task creation lands once the core ingest → chat loop is fully proven."
          />
        )}

        {activeTab === "activity" && (
          <EmptyTabState
            icon={Users}
            title="Activity log is coming in V1.6"
            description="Once collaboration ships, every upload, edit, and chat turn will show up here."
          />
        )}
      </div>
    </div>
  );
}

function EmptyTabState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}