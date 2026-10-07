export function MobileTopbar() {
  return (
    <div className="flex h-13 flex-shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3">
      <span className="font-display text-base font-bold text-sidebar-foreground">
        Arc<span style={{ color: "var(--primary)" }}>space</span>
      </span>
    </div>
  );
}