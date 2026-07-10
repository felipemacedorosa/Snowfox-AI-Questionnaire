"use client";

import { useEffect } from "react";

/**
 * Quiz keyboard map:
 * - 1–9: select/toggle option at DISPLAY index (never `opt.value` — some
 *   questions order their values 3/2/1).
 * - Enter: advance when the step is complete. Skipped when an option button is
 *   focused (native click handles it) or inside a textarea (Ctrl/Cmd+Enter).
 * - ↑/↓: roving focus across option buttons; Space toggles natively.
 * - Backspace / ArrowLeft (outside inputs): go back.
 */
export function useQuizKeyboard({ enabled, optionCount, onDigit, onEnter, onBack }: {
  enabled: boolean;
  optionCount: number;
  onDigit: (displayIndex: number) => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || (e.ctrlKey && e.key !== "Enter") || (e.metaKey && e.key !== "Enter")) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onEnter();
        }
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1;
        if (index < optionCount) {
          e.preventDefault();
          onDigit(index);
        }
        return;
      }

      if (e.key === "Enter") {
        // Focused option/nav buttons keep their native Enter → click.
        if (target?.closest("button")) return;
        e.preventDefault();
        onEnter();
        return;
      }

      if (e.key === "Backspace" || e.key === "ArrowLeft") {
        e.preventDefault();
        onBack();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const options = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-option-btn]"));
        if (options.length === 0) return;
        e.preventDefault();
        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = current === -1
          ? (delta === 1 ? 0 : options.length - 1)
          : Math.min(options.length - 1, Math.max(0, current + delta));
        options[next]?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, optionCount, onDigit, onEnter, onBack]);
}
