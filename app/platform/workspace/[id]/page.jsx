"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Users, Sparkles } from "lucide-react";
import { useWorkspaceDetail } from "@/hooks/use-workspace-detail";
import { WorkspaceAvatar } from "@/components/platform/workspace-avatar";
import { StatusPill } from "@/components/platform/status-badge";
import { StatTile } from "@/components/platform/stat-tile";
import { FileUploadDropzone } from "@/components/platform/file-upload-dropzone";
import { AssetList } from "@/components/platform/asset-list";
import { WorkspaceChat } from "@/components/platform/workspace-chat";
import { IntellectsPanel } from "@/components/platform/intellects-panel";
import { ChecksPanel } from "@/components/platform/checks-panel";
import { DeadlinesPanel, urgentDeadlineCount } from "@/components/platform/deadlines-panel";

const TABS = ["overview", "chat", "files", "deadlines", "intellects", "checks", "activity"];
const TAB_LABELS = { deadlines: "due dates" };

export default function WorkspaceDetailPage() {
  const { id } = useParams();
  const {
    workspace,
    assets,
    catalog,
    equipped,
    loading,
    error,
    uploadAsset,
    deleteAsset,
    askQuestion,
    dates,
    datesError,
    rescanDates,
    updateEquipped,
    setAssetType,
    runCheck,
  } = useWorkspaceDetail(id);
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

  const readyFiles = assets.filter((a) => a.status === "ready").length;
  const urgent = urgentDeadlineCount(dates);
  const typeOptions = catalog.filter((i) => equipped.includes(i.key));

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
            {TAB_LABELS[tab] ?? tab}
            {tab === "deadlines" && urgent > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 font-mono text-[10px] text-white">
                {urgent}
              </span>
            )}
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
            {urgent > 0 && (
              <button
                onClick={() => setActiveTab("deadlines")}
                className="flex items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/15"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 font-medium">
                  {urgent} deadline{urgent === 1 ? " is" : "s are"} overdue or due within 7 days.
                </span>
                <span className="underline underline-offset-2">View</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile label="Files" value={assets.length} color="#0ea5e9" />
              <StatTile label="Files ready" value={readyFiles} color="#8b5cf6" />
              <StatTile label="Intellects equipped" value={equipped.length} color="#22c55e" />
              <StatTile label="Urgent deadlines" value={urgent} color={urgent > 0 ? "#ef4444" : "#f59e0b"} />
            </div>

            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">About: </span>
                {workspace.description || "No description yet."} This workspace currently holds{" "}
                {assets.length} file{assets.length === 1 ? "" : "s"}, with {readyFiles} fully processed and
                searchable by chat.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold text-foreground">Quick upload</h3>
              </div>
              <FileUploadDropzone onUpload={uploadAsset} typeOptions={typeOptions} />
            </div>
          </div>
        )}

        {activeTab === "chat" && <WorkspaceChat onAsk={askQuestion} hasReadyFiles={readyFiles > 0} />}

        {activeTab === "files" && (
          <div className="flex flex-col gap-4">
            <FileUploadDropzone onUpload={uploadAsset} typeOptions={typeOptions} />
            <AssetList assets={assets} onDelete={deleteAsset} typeOptions={typeOptions} onChangeType={setAssetType} />
          </div>
        )}

        {activeTab === "deadlines" && (
          <DeadlinesPanel dates={dates} assets={assets} catalog={catalog} error={datesError} onRescan={rescanDates} />
        )}

        {activeTab === "intellects" && (
          <IntellectsPanel catalog={catalog} equipped={equipped} onChange={updateEquipped} />
        )}

        {activeTab === "checks" && (
          <ChecksPanel
            assets={assets}
            catalog={catalog}
            equipped={equipped}
            onRun={runCheck}
            onGoToIntellects={() => setActiveTab("intellects")}
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