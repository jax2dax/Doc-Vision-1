"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceAvatar } from "@/components/platform/workspace-avatar";
import { StatusDot } from "@/components/platform/status-badge";
import { useWorkspaces } from "@/lib/workspaces-context";

/**
 * @param {boolean} collapsed  icon-only rail mode (desktop sidebar collapsed state)
 * @param {boolean} showDescription  show the subtitle line (used in the mobile sheet)
 * @param {() => void} [onSelect]  fired after navigating, used to close the mobile sheet
 */
export function WorkspaceList({ collapsed = false, showDescription = false, onSelect }) {
  const { workspaces, loading } = useWorkspaces();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-accent" />
        ))}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return !collapsed ? (
      <p className="px-3 py-2 text-xs text-muted-foreground">No workspaces yet — create one to get started.</p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {workspaces.map((ws) => {
        const href = `/platform/workspace/${ws.id}`;
        const isActive = pathname === href;

        return (
          <Link
            key={ws.id}
            href={href}
            onClick={onSelect}
            title={ws.name}
            className={`group relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
              isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
            } ${collapsed ? "justify-center" : ""}`}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 h-4.5 w-[3px] -translate-y-1/2 rounded-r-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
            )}
            <WorkspaceAvatar workspace={ws} size={collapsed ? 30 : 28} />
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate font-sans text-sm ${
                    isActive ? "font-semibold text-sidebar-foreground" : "text-sidebar-foreground/80"
                  }`}
                >
                  {ws.name}
                </span>
                {showDescription && ws.description && (
                  <span className="block truncate text-xs text-muted-foreground">{ws.description}</span>
                )}
              </span>
            )}
            {!collapsed && <StatusDot status={ws.status} />}
          </Link>
        );
      })}
    </div>
  );
}
