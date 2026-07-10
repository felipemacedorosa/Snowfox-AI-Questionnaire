"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Ticker } from "@/components/ui/Ticker";
import { EASE_IN, EASE_OUT } from "@/lib/motion";
import type { Tier } from "@/components/ui/Badge";

/** Slides under the navbar once the hero score scrolls out of view. */
export function StickyScoreBar({ visible, score, levelShort, tier, onPdf }: {
  visible: boolean;
  score: number;
  levelShort: string;
  tier: Tier;
  onPdf: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: 0, transition: { duration: 0.3, ease: EASE_OUT } }}
          exit={{ y: "-100%", transition: { duration: 0.24, ease: EASE_IN } }}
          className="fixed left-0 right-0 top-16 z-[150] h-12"
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--line-1)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div className="mx-auto flex h-12 max-w-results items-center justify-between gap-4 px-6">
            <p className="flex items-baseline gap-2 min-w-0">
              <span className="font-display font-bold text-white text-[17px] leading-none">
                <Ticker value={score} />
              </span>
              <span className="text-[12.5px] font-medium truncate" style={{ color: `var(--tier-${tier}-text)` }}>
                {levelShort}
              </span>
            </p>
            <span className="flex items-center gap-2.5 flex-shrink-0">
              <Button variant="ghost" size="md" onClick={onPdf}>
                Baixar PDF
              </Button>
              <a
                href="https://snowfox-ai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[12px] h-[34px] px-4 text-[12.5px] font-semibold text-white bg-[image:var(--grad)] transition-[filter] hover:brightness-110 no-underline"
              >
                Falar com especialista
              </a>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
