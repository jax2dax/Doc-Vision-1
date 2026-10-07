"use client";

import Link from "next/link";
import { Home, LayoutGrid, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MobileBottomNav({ onOpenWorkspaces }) {
  return (
    <nav className="flex flex-shrink-0 items-stretch border-t border-sidebar-border bg-sidebar">
      <Link
        href="/platform/home"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground"
      >
        <Home className="h-[18px] w-[18px]" />
        <span className="font-mono text-[9px]">Home</span>
      </Link>

      <button
        onClick={onOpenWorkspaces}
        className="flex flex-1 flex-col items-center justify-center gap-1 border-t-2 py-2.5"
        style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
      >
        <LayoutGrid className="h-[18px] w-[18px]" />
        <span className="font-mono text-[9px]">Workspaces</span>
      </button>

      <button className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground">
        <Search className="h-[18px] w-[18px]" />
        <span className="font-mono text-[9px]">Search</span>
      </button>

      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5">
        <ThemeToggle />
      </div>
    </nav>
  );
}
