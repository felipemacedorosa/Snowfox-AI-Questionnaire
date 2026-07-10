import { cn } from "@/lib/utils";

export type Tier = "low" | "emerging" | "moderate" | "high" | "advanced";

/** Tier chip: bg/border/text from the tier tokens. Marks only — never large surfaces. */
export function TierBadge({ tier, className, children }: {
  tier: Tier;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-[3px] rounded-[7px]",
        "text-[11px] font-bold tracking-[0.04em]",
        className,
      )}
      style={{
        background: `var(--tier-${tier}-bg)`,
        border: `1px solid color-mix(in srgb, var(--tier-${tier}-mark) 40%, transparent)`,
        color: `var(--tier-${tier}-text)`,
      }}
    >
      {children}
    </span>
  );
}

/** Neutral micro-tag (pillar name on insight cards, meta chips). */
export function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-[3px] rounded-[6px]",
        "text-[10.5px] font-semibold tracking-[0.05em] uppercase",
        "border border-[var(--line-2)] bg-[var(--surface-2)] text-[var(--text-dim)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
