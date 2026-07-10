"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PILLAR_CONFIG, SECTIONS } from "@/app/data";
import { fadeUp, staggerChildren, VIEWPORT_ONCE, EASE_INOUT } from "@/lib/motion";
import { questionCountFor } from "./stats";

export function PillarShowcase() {
  const [active, setActive] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cursor-aware border glow: one mousemove listener writing CSS vars
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <section id="pilares" className="py-32 max-lg:py-20 scroll-mt-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        variants={staggerChildren(0.1)}
      >
        <motion.h2
          variants={fadeUp}
          className="font-display font-bold text-white text-[clamp(28px,4vw,36px)] tracking-[-0.02em]"
        >
          Os 5 pilares da prontidão
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-3 max-w-[620px] text-[15px] leading-[1.7] text-[var(--text-m)]">
          Cada pilar tem peso próprio no índice final. A avaliação mede onde sua
          empresa está em cada um — e onde uma fraqueza pode travar todo o resto.
        </motion.p>

        {/* Desktop: expanding columns */}
        <motion.div
          ref={panelRef}
          variants={fadeUp}
          onMouseMove={onMouseMove}
          className="cursor-glow surface-panel mt-10 hidden md:flex h-[460px] overflow-hidden"
        >
          {SECTIONS.map((sec, i) => {
            const isActive = active === i;
            const config = PILLAR_CONFIG.find(p => p.id === sec.id);
            return (
              <motion.button
                key={sec.id}
                type="button"
                animate={{ flex: isActive ? 2.4 : 1 }}
                transition={{ duration: 0.45, ease: EASE_INOUT }}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="relative min-w-0 text-left p-7 flex flex-col"
                style={{ borderLeft: i > 0 ? "1px solid var(--line-1)" : "none" }}
                aria-expanded={isActive}
              >
                <span
                  className="font-display font-bold text-[13px]"
                  style={{ color: "var(--violet-400)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <AnimatePresence mode="wait" initial={false}>
                  {isActive ? (
                    <motion.span
                      key="open"
                      className="mt-6 flex flex-col flex-1 min-w-[260px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.15 } }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    >
                      <span className="font-display font-bold text-[22px] text-white tracking-[-0.02em]">
                        {sec.title}
                      </span>
                      <span className="mt-4 text-[13.5px] leading-[1.7] text-[var(--text-m)]">
                        {sec.desc}
                      </span>
                      <span className="mt-auto pt-6 flex gap-5 text-[12px] text-[var(--text-dim)]">
                        <span>peso {Math.round((config?.weight ?? 0) * 100)}%</span>
                        <span>{questionCountFor(sec.id)} perguntas</span>
                      </span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="closed"
                      className="mt-6 font-display font-bold text-[17px] text-[var(--text-m)] tracking-[-0.01em]"
                      style={{ writingMode: "vertical-rl" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.1 } }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    >
                      {sec.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Mobile: accordion */}
        <motion.div variants={fadeUp} className="surface-panel mt-10 md:hidden overflow-hidden">
          {SECTIONS.map((sec, i) => {
            const isActive = active === i;
            const config = PILLAR_CONFIG.find(p => p.id === sec.id);
            return (
              <div key={sec.id} style={{ borderTop: i > 0 ? "1px solid var(--line-1)" : "none" }}>
                <button
                  type="button"
                  className="w-full flex items-center gap-4 p-5 text-left"
                  onClick={() => setActive(isActive ? null : i)}
                  aria-expanded={isActive}
                >
                  <span className="font-display font-bold text-[13px]" style={{ color: "var(--violet-400)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display font-bold text-[17px] text-white">{sec.title}</span>
                  <motion.svg
                    animate={{ rotate: isActive ? 180 : 0 }}
                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                    stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6l5 5 5-5" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_INOUT }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pl-[52px]">
                        <p className="text-[13.5px] leading-[1.7] text-[var(--text-m)]">{sec.desc}</p>
                        <p className="mt-3 flex gap-5 text-[12px] text-[var(--text-dim)]">
                          <span>peso {Math.round((config?.weight ?? 0) * 100)}%</span>
                          <span>{questionCountFor(sec.id)} perguntas</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
