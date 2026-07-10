"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PILLAR_CONFIG, SECTIONS } from "@/app/data";
import { Button } from "@/components/ui/Button";
import { EASE_OUT } from "@/lib/motion";
import { questionCountFor } from "@/components/landing/stats";

/** Chapter break between pillars. Instantly skippable — Enter or click. */
export function PillarIntro({ sectionIndex, onBegin }: {
  sectionIndex: number;
  onBegin: () => void;
}) {
  const section = SECTIONS[sectionIndex];
  const config = PILLAR_CONFIG.find(p => p.id === section.id);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="relative w-full">
      {/* Ghost numeral behind the text block */}
      <motion.span
        aria-hidden="true"
        className="absolute -top-16 -left-4 font-display font-black leading-none select-none pointer-events-none"
        style={{ fontSize: 140, color: "rgba(255,255,255,0.08)", letterSpacing: "-0.04em" }}
        initial={reduced ? false : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        {String(section.pillar).padStart(2, "0")}
      </motion.span>

      <div className="relative">
        <motion.p
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "rgba(182,154,248,0.65)" }}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          Pilar {section.pillar} de {SECTIONS.length}
        </motion.p>

        <motion.div
          aria-hidden="true"
          className="mt-4 h-px w-24 origin-left"
          style={{ background: "var(--violet-500)" }}
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
        />

        <motion.h2
          className="font-display font-bold text-white mt-5"
          style={{ fontSize: "clamp(30px,4.5vw,40px)", letterSpacing: "-0.025em", lineHeight: 1.15 }}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT }}
        >
          {section.title}
        </motion.h2>

        <motion.p
          className="mt-4 max-w-[540px] text-[14.5px] leading-[1.7] text-[var(--text-m)]"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: EASE_OUT }}
        >
          {section.desc}
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center gap-4"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: EASE_OUT }}
        >
          <Button ref={buttonRef} onClick={onBegin}>
            Começar
            <span className="text-[11px] font-normal opacity-70" aria-hidden="true">↵</span>
          </Button>
          <span className="flex gap-4 text-[12px] text-[var(--text-dim)]">
            <span>peso no índice: {Math.round((config?.weight ?? 0) * 100)}%</span>
            <span>{questionCountFor(section.id)} perguntas</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}
