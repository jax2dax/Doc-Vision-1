"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PanelLeft, Plus, Home, Search, LogOut } from "lucide-react";
import { createBrowserAuthClient } from "@/lib/supabase/browser";
import { WorkspaceList } from "@/components/platform/workspace-list";
import { NewWorkspaceDialog } from "@/components/platform/new-workspace-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/platform/home" },
  { icon: Search, label: "Search", href: "#" },
];

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    createBrowserAuthClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data?.user?.email ?? null))
      .catch(() => {});
  }, []);

  async function signOut() {
    await createBrowserAuthClient().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <aside
      className="flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out"
      style={{ width: open ? 240 : 60 }}
    >
      {/* Logo + collapse toggle */}
      <div className={`flex items-center gap-2.5 border-b border-sidebar-border px-4 py-3.5 ${!open && "justify-center px-2"}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="Toggle sidebar"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted transition-colors hover:bg-accent"
        >
          <PanelLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        {open && (
          <span className="whitespace-nowrap font-display text-[17px] font-bold tracking-tight text-sidebar-foreground">
            <span className="font-brand">Doc-Vision-<span style={{ color: "var(--primary)" }}>1</span></span>
          </span>
        )}
      </div>

      {/* Primary nav */}
      <div className="flex flex-col gap-0.5 border-b border-sidebar-border p-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${
              !open && "justify-center px-0"
            }`}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {open && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* Workspaces */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className={`flex items-center px-3 py-3 ${open ? "justify-between" : "justify-center"}`}>
          {open && (
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Workspaces
            </span>
          )}
          <button
            onClick={() => setShowNewDialog(true)}
            title="New workspace"
            className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary transition-colors hover:border-primary hover:bg-primary/10"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <WorkspaceList collapsed={!open} />
        </div>
      </div>

      {/* Footer: theme toggle + user (auth stubbed for V1) */}
      <div className={`flex items-center gap-2.5 border-t border-sidebar-border px-3 py-3 ${!open && "justify-center px-2"}`}>
        <div
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)" }}
        >
          U
        </div>
        {open && (
          <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-sidebar-foreground">
            {email ?? "Account"}
          </span>
        )}
        <button
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
          className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
        <ThemeToggle className="flex-shrink-0" />
      </div>

      <NewWorkspaceDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </aside>
  );
}