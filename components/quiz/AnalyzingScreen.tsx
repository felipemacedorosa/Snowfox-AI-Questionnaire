"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SECTIONS } from "@/app/data";
import { EASE_OUT } from "@/lib/motion";

const STEP_MS = 350;
const HOLD_MS = 400;
const FADE_MS = 300;

/** Honest theater: ~2.3s pillar-by-pillar check-in, then hands off to results. */
export function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      onDone();
      return;
    }
    const total = SECTIONS.length * STEP_MS + HOLD_MS + FADE_MS;
    const id = setTimeout(onDone, total);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced) return null;

  const totalBeforeFade = SECTIONS.length * STEP_MS + HOLD_MS;

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center"
      style={{ minHeight: "calc(100dvh - 64px)" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: FADE_MS / 1000, delay: totalBeforeFade / 1000 }}
      role="status"
      aria-label="Calculando seu índice de prontidão"
    >
      <p className="text-[14px] text-[var(--text-m)]">Calculando seu índice de prontidão…</p>

      <div className="mt-9 flex flex-col gap-3.5 items-start">
        {SECTIONS.map((sec, i) => (
          <motion.div
            key={sec.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: (i * STEP_MS) / 1000, ease: EASE_OUT }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <motion.path
                d="M3 8.5l3.5 3.5L13 5"
                stroke="var(--violet-300)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2, delay: (i * STEP_MS + 120) / 1000 }}
              />
            </svg>
            <span className="text-[13.5px] font-medium text-[var(--text-b)]">{sec.title}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-9 w-56 h-[2px] rounded-full bg-[var(--line-1)] overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-full origin-left"
          style={{ background: "var(--violet-500)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: (SECTIONS.length * STEP_MS) / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
