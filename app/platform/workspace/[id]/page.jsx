"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useWorkspaceDetail } from "@/hooks/use-workspace-detail";
import { FileUploadDropzone } from "@/components/platform/file-upload-dropzone";
import { AssetList } from "@/components/platform/asset-list";
import { LinkGoogleSheet } from "@/components/platform/link-google-sheet";
import { MembersPanel } from "@/components/platform/members-panel";
import { WorkspaceChat } from "@/components/platform/workspace-chat";
import { IntellectsPanel } from "@/components/platform/intellects-panel";
import { DeadlinesPanel, urgentDeadlineCount } from "@/components/platform/deadlines-panel";
import { deadlineStatus, todayString } from "@/lib/deadlines/status";

const TABS = ["overview", "chat", "files", "deadlines", "intellects", "members"];
const TAB_LABELS = { deadlines: "due dates", intellects: "document types" };

const fmt = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

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
    google,
    linkGoogleSheet,
    syncAsset,
    role,
    userId,
    members,
    addMember,
    removeMember,
  } = useWorkspaceDetail(id);
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-7 w-48 animate-pulse bg-accent" />
        <div className="mt-4 h-24 animate-pulse bg-accent" />
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

  const today = todayString();
  const upcoming = dates
    .filter((d) => d.deadline_date)
    .map((d) => ({ ...d, status: deadlineStatus(d.deadline_date, today) }))
    .sort((a, b) => a.status.days - b.status.days)
    .slice(0, 6);
  const assetName = Object.fromEntries(assets.map((a) => [a.id, a.filename]));

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 pb-3 pt-5 sm:px-6">
        <h1 className="truncate font-display text-2xl text-foreground">{workspace.name}</h1>
        {workspace.description && <p className="truncate text-sm text-muted-foreground">{workspace.description}</p>}
      </header>

      <nav className="flex flex-shrink-0 items-center overflow-x-auto border-b border-border px-4 sm:px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm capitalize transition-colors ${
              activeTab === tab
                ? "border-foreground font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[tab] ?? tab}
            {tab === "deadlines" && urgent > 0 && (
              <span className="ml-1.5 bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">{urgent}</span>
            )}
            {tab === "files" && assets.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">{assets.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {activeTab === "overview" && (
          <div className="flex max-w-3xl flex-col gap-8">
            {urgent > 0 && (
              <button
                onClick={() => setActiveTab("deadlines")}
                className="flex items-center gap-3 border-l-[3px] border-destructive bg-destructive/10 px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/15"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 font-medium">
                  {urgent} due date{urgent === 1 ? " is" : "s are"} overdue or within 7 days.
                </span>
                <span className="underline underline-offset-2">View</span>
              </button>
            )}

            <section>
              <h2 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Next due</h2>
              {upcoming.length === 0 ? (
                <p className="border-y border-border py-6 text-sm text-muted-foreground">
                  {readyFiles === 0
                    ? "Nothing yet. Upload a file and its due dates will show here."
                    : "No due dates found in the uploaded files."}
                </p>
              ) : (
                <ul className="divide-y divide-border border-y border-border text-sm">
                  {upcoming.map((d) => {
                    const hot = d.status.level === "overdue" || d.status.level === "red";
                    return (
                      <li key={d.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 py-2.5">
                        <span className={`w-36 ${hot ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                          {d.status.text}
                        </span>
                        <span className="w-28 text-foreground">{fmt(d.deadline_date)}</span>
                        <span className="min-w-0 flex-1 text-foreground">
                          {d.label}
                          <span className="text-muted-foreground"> · {assetName[d.asset_id]}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {dates.filter((d) => d.deadline_date).length > upcoming.length && (
                <button
                  onClick={() => setActiveTab("deadlines")}
                  className="mt-2 text-sm text-foreground underline underline-offset-4"
                >
                  See all due dates
                </button>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Add a file</h2>
              <FileUploadDropzone onUpload={uploadAsset} typeOptions={typeOptions} />
              <p className="mt-2 text-xs text-muted-foreground">
                {assets.length} file{assets.length === 1 ? "" : "s"}, {readyFiles} ready. {equipped.length} document type
                {equipped.length === 1 ? "" : "s"} added.
              </p>
            </section>
          </div>
        )}

        {activeTab === "chat" && <WorkspaceChat onAsk={askQuestion} hasReadyFiles={readyFiles > 0} />}

        {activeTab === "files" && (
          <div className="flex max-w-4xl flex-col gap-5">
            <FileUploadDropzone onUpload={uploadAsset} typeOptions={typeOptions} />
            <LinkGoogleSheet google={google} typeOptions={typeOptions} onLink={linkGoogleSheet} />
            <AssetList
              assets={assets}
              onDelete={deleteAsset}
              typeOptions={typeOptions}
              onChangeType={setAssetType}
              onSync={syncAsset}
            />
          </div>
        )}

        {activeTab === "deadlines" && (
          <DeadlinesPanel dates={dates} assets={assets} catalog={catalog} error={datesError} onRescan={rescanDates} />
        )}

        {activeTab === "members" && (
          <MembersPanel members={members} role={role} userId={userId} onAdd={addMember} onRemove={removeMember} />
        )}

        {activeTab === "intellects" && (
          <IntellectsPanel catalog={catalog} equipped={equipped} onChange={updateEquipped} />
        )}
      </div>
    </div>
  );
}
