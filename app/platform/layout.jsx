"use client";

import { useState } from "react";
import { WorkspacesProvider } from "@/lib/workspaces-context";
import { Sidebar } from "@/components/platform/sidebar";
import { MobileTopbar } from "@/components/platform/mobile-topbar";
import { MobileBottomNav } from "@/components/platform/mobile-bottom-nav";
import { MobileWorkspaceSheet } from "@/components/platform/mobile-workspace-sheet";
import { useIsMobile } from "@/hooks/use-media-query";

export default function PlatformLayout({ children }) {
  const isMobile = useIsMobile();
  const [showWorkspaceSheet, setShowWorkspaceSheet] = useState(false);

  return (
    <WorkspacesProvider>
      {isMobile ? (
        <div className="flex h-dvh flex-col overflow-hidden bg-background">
          <MobileTopbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
          <MobileBottomNav onOpenWorkspaces={() => setShowWorkspaceSheet(true)} />
          <MobileWorkspaceSheet open={showWorkspaceSheet} onOpenChange={setShowWorkspaceSheet} />
        </div>
      ) : (
        <div className="flex h-dvh overflow-hidden bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      )}
    </WorkspacesProvider>
  );
}