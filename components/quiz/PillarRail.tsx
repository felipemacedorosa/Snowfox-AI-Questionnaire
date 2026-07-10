"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { SECTIONS } from "@/app/data";
import { SPRING_POP } from "@/lib/motion";
import type { PillarProgress } from "@/lib/flow";

/**
 * Desktop: vertical rail of 5 numbered nodes; the track above the active node
 * fills with intra-pillar progress. Mobile: slim top segments + text status.
 * Done nodes are clickable to revisit that pillar.
 */
export function PillarRail({ perPillar, activeSection, currentLabel, onJumpTo }: {
  perPillar: PillarProgress[];
  activeSection: number;
  /** e.g. "Dados · 3 de 8" — announced politely for screen readers. */
  currentLabel: string;
  onJumpTo: (sectionIndex: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  function nodeState(i: number): "done" | "active" | "upcoming" {
    const p = perPillar[i];
    if (i === activeSection) return "active";
    if (p.total > 0 && p.answered >= p.total) return "done";
    return i < activeSection ? "done" : "upcoming";
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">{currentLabel}</span>

      {/* Desktop vertical rail */}
      <div className="hidden lg:flex flex-col items-center sticky top-28 self-start" aria-hidden="true">
        {SECTIONS.map((sec, i) => {
          const state = nodeState(i);
          const progress = perPillar[i].total > 0 ? perPillar[i].answered / perPillar[i].total : 0;
          const clickable = state === "done";
          return (
            <div key={sec.id} className="flex flex-col items-center">
              {i > 0 && (
                <div className="w-[2px] h-12 bg-[var(--line-1)] overflow-hidden">
                  <motion.div
                    className="w-full origin-top"
                    style={{ background: "var(--violet-500)" }}
                    animate={{
                      height:
                        i < activeSection ? "100%"
                        : i === activeSection ? `${Math.round(progress * 100)}%`
                        : "0%",
                    }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
              <div className="relative">
                <motion.button
                  type="button"
                  tabIndex={clickable ? 0 : -1}
                  disabled={!clickable}
                  onClick={() => clickable && onJumpTo(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center justify-center w-7 h-7 rounded-full font-display font-bold text-[12px]"
                  animate={
                    state === "active"
                      ? { scale: 1.1, borderColor: "var(--line-brand)", backgroundColor: "rgba(142,45,226,0.14)" }
                      : state === "done"
                        ? { scale: 1, borderColor: "rgba(109,40,217,0)", backgroundColor: "#6D28D9" }
                        : { scale: 1, borderColor: "var(--line-2)", backgroundColor: "rgba(255,255,255,0)" }
                  }
                  transition={SPRING_POP}
                  style={{
                    border: "1px solid var(--line-2)",
                    color: state === "upcoming" ? "var(--text-dim)" : "#fff",
                    cursor: clickable ? "pointer" : "default",
                  }}
                >
                  {state === "done" ? (
                    <motion.svg
                      width="12" height="12" viewBox="0 0 16 16" fill="none"
                      stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={SPRING_POP}
                    >
                      <motion.path
                        d="M3 8.5l3.5 3.5L13 5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.svg>
                  ) : (
                    sec.pillar
                  )}
                </motion.button>

                {hovered === i && (
                  <div
                    className="absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-[8px] text-[11.5px] font-medium text-[var(--text-b)] z-20"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--line-3)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
                    }}
                  >
                    {sec.title} — {perPillar[i].answered} de {perPillar[i].total}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden mb-5" aria-hidden="true">
        <div className="flex gap-[5px] mb-2.5">
          {SECTIONS.map((sec, i) => {
            const progress = perPillar[i].total > 0 ? perPillar[i].answered / perPillar[i].total : 0;
            return (
              <div key={sec.id} className="flex-1 h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full origin-left"
                  style={{ background: "var(--violet-500)" }}
                  animate={{ width: i < activeSection ? "100%" : i === activeSection ? `${Math.round(progress * 100)}%` : "0%" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[12px] text-[var(--text-dim)]">{currentLabel}</p>
      </div>
    </>
  );
}
