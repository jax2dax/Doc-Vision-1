"use client";

import { LogOut } from "lucide-react";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

export function MobileTopbar() {
  async function signOut() {
    await createBrowserAuthClient().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="flex h-13 flex-shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3">
      <span className="font-display text-base font-bold text-sidebar-foreground">
        <span className="font-brand">Doc-Vision-<span style={{ color: "var(--primary)" }}>1</span></span>
      </span>
      <button onClick={signOut} aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
