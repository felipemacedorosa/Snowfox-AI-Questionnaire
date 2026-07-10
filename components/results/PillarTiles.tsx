"use client";

import { motion } from "motion/react";
import { getPillarTier, PillarScore } from "@/app/data";
import { EASE_OUT, fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { PILLAR_SHORT } from "@/components/landing/stats";

/** Text twin of the radar: every value readable without color. */
export function PillarTiles({ scores }: { scores: PillarScore[] }) {
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.07)}
    >
      {scores.map(p => {
        const tier = getPillarTier(p.score);
        return (
          <motion.div
            key={p.id}
            variants={fadeUp}
            className="rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)] p-4"
          >
            <p className="text-[12px] text-[var(--text-m)]">{PILLAR_SHORT[p.id] ?? p.title}</p>
            <p className="mt-1.5 font-display font-bold text-white text-[28px] leading-none">{p.score}</p>
            <div className="mt-3 h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `var(--tier-${tier.key}-mark)` }}
                initial={{ width: "0%" }}
                whileInView={{ width: `${p.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: `var(--tier-${tier.key}-text)` }}>
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: `var(--tier-${tier.key}-mark)` }}
              />
              {tier.label}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
