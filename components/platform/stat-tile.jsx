export function StatTile({ label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-bold leading-none sm:text-[28px]" style={{ color }}>
        {value}
      </div>
    </div>
  );
}