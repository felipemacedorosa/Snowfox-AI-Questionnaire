"use client";

import { motion } from "motion/react";
import type { ExecutiveSummary } from "@/app/resultInsights";
import { fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";

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
      id="resumo"
      className="surface-panel p-9 max-md:p-6 scroll-mt-28"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.08)}
      aria-labelledby="resumo"
    >
      <div className="mb-6">
        <SectionHeading number="01" title="Resumo executivo" aside="Uma leitura para decisão" />
      </div>

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
        <Block title="Solução recomendada">
          <div
            className="rounded-[10px] p-4"
            style={{ background: "rgba(142,45,226,0.08)", border: "1px solid var(--line-brand)" }}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2">
              <p className="font-display font-bold text-white text-[16px] tracking-[-0.01em]">Data Foundation</p>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.05em] px-2.5 py-[3px] rounded-[6px] text-white bg-[image:var(--grad)]">
                Começar agora · Sem pré-requisitos
              </span>
            </div>
            {summary.immediateRecommendation.map((sentence, i) => (
              <p key={i} className="text-[13.5px] leading-[1.7] text-[var(--text-m)] mb-1.5 last:mb-0">{sentence}</p>
            ))}
          </div>
        </Block>
      </div>
    </motion.section>
  );
}
