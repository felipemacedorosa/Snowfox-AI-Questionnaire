"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Ticker } from "@/components/ui/Ticker";
import { fadeUp, VIEWPORT_ONCE } from "@/lib/motion";
import { AVG_MINUTES, PILLAR_COUNT, ROADMAP_QUARTERS, SCORED_QUESTION_COUNT } from "./stats";

const STATS = [
  { value: SCORED_QUESTION_COUNT, label: "perguntas objetivas" },
  { value: PILLAR_COUNT, label: "pilares avaliados" },
  { value: ROADMAP_QUARTERS, label: "trimestres de roadmap" },
  { value: AVG_MINUTES, label: "minutos em média" },
];

export function CredibilityStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const revealed = inView || !!reduced;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={fadeUp}
      className="grid grid-cols-2 md:grid-cols-4 gap-y-8 py-9"
      style={{ borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)" }}
    >
      {STATS.map(stat => (
        <div key={stat.label} className="px-2">
          <p className="font-display font-bold text-white text-[28px] leading-none">
            <Ticker value={revealed ? stat.value : 0} />
          </p>
          <p className="mt-2 text-[12px] text-[var(--text-dim)]">{stat.label}</p>
        </div>
      ))}
    </motion.div>
  );
}
