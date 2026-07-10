import { cn } from "@/lib/utils";

/**
 * `glass` — container for a whole view region (quiz stage, results panel).
 * `flat` — nested card inside a glass region; never stack glass on glass.
 */
export function Card({
  variant = "flat",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "glass" | "flat" }) {
  return (
    <div
      className={cn(
        variant === "glass"
          ? "surface-panel"
          : "rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
