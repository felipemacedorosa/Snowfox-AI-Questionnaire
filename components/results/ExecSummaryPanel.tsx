"use client";

import { motion } from "motion/react";
import type { ExecutiveSummary } from "@/app/resultInsights";
import { fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="py-6 first:pt-0 last:pb-0" style={{ borderBottom: "1px solid var(--line-1)" }}>
      <h3 className="font-display font-bold text-[15px] text-white tracking-[-0.01em] mb-2.5">{title}</h3>
      {children}
    </motion.div>
  );
}

/** Document-grade typography inside a dashboard panel — content, not decoration. */
export function ExecSummaryPanel({ summary }: { summary: ExecutiveSummary }) {
  return (
    <motion.section
      className="surface-panel p-9 max-md:p-6"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.08)}
      aria-labelledby="exec-summary-title"
    >
      <motion.h2
        id="exec-summary-title"
        variants={fadeUp}
        className="font-display font-bold text-white text-[24px] tracking-[-0.02em] mb-6"
      >
        Resumo executivo
      </motion.h2>

      <div className="[&>div:last-child]:border-b-0">
        <Block title="Situação Atual">
          {summary.currentSituation.map((sentence, i) => (
            <p key={i} className="text-[13.5px] leading-[1.7] text-[var(--text-m)] mb-1.5 last:mb-0">{sentence}</p>
          ))}
        </Block>
        <Block title="Principais Riscos">
          <ul className="flex flex-col gap-2.5">
            {summary.risks.map((risk, i) => (
              <li
                key={i}
                className="text-[13.5px] leading-[1.6] text-[var(--text-m)] pl-3.5"
                style={{ borderLeft: "2px solid var(--violet-500)" }}
              >
                {risk}
              </li>
            ))}
          </ul>
        </Block>
        <Block title="Onde Está a Maior Oportunidade">
          {summary.opportunity.map((sentence, i) => (
            <p key={i} className="text-[13.5px] leading-[1.7] text-[var(--text-m)] mb-1.5 last:mb-0">{sentence}</p>
          ))}
        </Block>
        <Block title="Recomendação Imediata">
          {summary.immediateRecommendation.map((sentence, i) => (
            <p key={i} className="text-[13.5px] leading-[1.7] text-[var(--text-m)] mb-1.5 last:mb-0">{sentence}</p>
          ))}
        </Block>
      </div>
    </motion.section>
  );
}
