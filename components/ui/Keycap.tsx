import { cn } from "@/lib/utils";

/**
 * Physical-key chip shown beside quiz options and keyboard hints.
 * `pressed` renders the depressed state (digit-key feedback).
 * `selected` renders the brand-gradient selected state.
 */
export function Keycap({ label, selected, pressed, className }: {
  label: React.ReactNode;
  selected?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center flex-shrink-0",
        "w-6 h-6 rounded-[6px] text-[12px] font-bold",
        "transition-all duration-[90ms]",
        selected
          ? "bg-[image:var(--grad)] text-white border border-transparent"
          : "border border-[var(--line-2)] bg-[var(--surface-2)] text-[var(--text-dim)]",
        pressed && "translate-y-[1px]",
        className,
      )}
      style={{
        boxShadow: selected
          ? undefined
          : pressed
            ? "inset 0 0 0 rgba(255,255,255,0)"
            : "inset 0 -1.5px 0 rgba(255,255,255,0.10)",
        fontFamily: "'Typo Grotesk', sans-serif",
      }}
    >
      {label}
    </span>
  );
}
