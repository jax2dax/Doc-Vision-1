import { cn } from "@/lib/utils";

function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Badge };