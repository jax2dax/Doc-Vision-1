import { cn } from "@/lib/utils";

/**
 * Generic pill badge. Pass `style` with backgroundColor/color for
 * per-status dynamic coloring (workspace status, priority, etc.)
 * since those colors come from data, not the design system.
 */
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
