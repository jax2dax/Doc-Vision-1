const STATUS_VAR = {
  active: "var(--status-active)",
  idle: "var(--status-idle)",
  error: "var(--status-error)",
};

export function StatusDot({ status, className = "" }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: STATUS_VAR[status] ?? STATUS_VAR.idle }}
    />
  );
}

export function StatusPill({ status }) {
  const color = STATUS_VAR[status] ?? STATUS_VAR.idle;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium"
      style={{ color, borderColor: `${color}33`, backgroundColor: `${color}18` }}
    >
      <StatusDot status={status} />
      {status}
    </span>
  );
}