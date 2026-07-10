"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "text-white font-semibold bg-[image:var(--grad)] " +
    "shadow-[0_8px_32px_rgba(110,40,220,0.28)] " +
    "hover:brightness-110 active:brightness-95",
  secondary:
    "font-semibold text-[var(--text-m)] border border-[var(--line-2)] bg-[var(--surface-2)] " +
    "hover:border-[var(--line-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-h)]",
  ghost:
    "font-medium text-[var(--text-m)] " +
    "hover:text-[var(--text-h)] hover:bg-[var(--surface-3)]",
};

const SIZE_CLASSES: Record<Size, string> = {
  lg: "h-12 px-7 text-[14px]",
  md: "h-[38px] px-4 text-[13px]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button({ variant = "primary", size = "lg", className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] select-none",
        "transition-[background,border-color,color,filter,transform] duration-150",
        "active:scale-[0.985]",
        "disabled:opacity-40 disabled:pointer-events-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
