export function MobileTopbar() {
  return (
    <div className="flex h-13 flex-shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3">
      <span className="font-display text-base font-bold text-sidebar-foreground">
        <span className="font-brand">Doc-Vision-<span style={{ color: "var(--primary)" }}>1</span></span>
      </span>
    </div>
  );
}