"use client";

import { motion } from "motion/react";
import type { OpportunityStatus, OpportunityTrack } from "@/app/resultAnalysis";
import type { Tier } from "@/components/ui/Badge";
import { fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";

const STATUS_TIER: Record<Exclude<OpportunityStatus, "recommended">, Tier> = {
  priority: "moderate",
  ready: "high",
  prepare: "emerging",
  defer: "low",
  maintain: "advanced",
};

function StatusChip({ track }: { track: OpportunityTrack }) {
  if (track.status === "recommended") {
    return (
      <span className="text-[10.5px] font-bold uppercase tracking-[0.05em] px-2.5 py-[3px] rounded-[6px] text-white bg-[image:var(--grad)]">
        {track.statusLabel}
      </span>
    );
  }
  const tier = STATUS_TIER[track.status];
  return (
    <span
      className="text-[10.5px] font-bold uppercase tracking-[0.05em] px-2.5 py-[3px] rounded-[6px]"
      style={{ background: `var(--tier-${tier}-bg)`, color: `var(--tier-${tier}-text)` }}
    >
      {track.statusLabel}
    </span>
  );
}

/** The three Snowfox solution tracks, gated by observed prerequisites. */
export function OpportunityLibrary({ tracks }: { tracks: OpportunityTrack[] }) {
  return (
    <motion.section
      id="oportunidades"
      className="scroll-mt-28"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.1)}
      aria-labelledby="oportunidades"
    >
      <SectionHeading number="05" title="Biblioteca de oportunidades" aside="Hipóteses para validar" />
      <motion.p variants={fadeUp} className="mt-3 mb-6 max-w-[720px] text-[13.5px] leading-[1.65] text-[var(--text-m)]">
        <span className="font-semibold text-white">Data Foundation é a solução recomendada e pode começar
        imediatamente, independentemente do nível atual de prontidão.</span>{" "}
        Automation Agents e Predictive Agents continuam condicionados às capacidades
        necessárias para operar com segurança e valor.
      </motion.p>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {tracks.map((track, index) => {
          const isRecommended = track.status === "recommended";
          return (
            <motion.article
              key={track.id}
              variants={fadeUp}
              className="rounded-[12px] border bg-[var(--surface-2)] p-5 flex flex-col"
              style={{ borderColor: isRecommended ? "var(--line-brand)" : "var(--line-1)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-baseline gap-2.5">
                    <span aria-hidden="true" className="font-display font-bold text-[12px]" style={{ color: "var(--violet-400)" }}>
                      0{index + 1}
                    </span>
                    <span className="font-display font-bold text-white text-[17px] tracking-[-0.01em]">{track.title}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--text-dim)]">{track.subtitle}</p>
                </div>
                <StatusChip track={track} />
              </div>

              <p className="mt-4 text-[13px] leading-[1.65] text-[var(--text-m)]">{track.summary}</p>

              <div className="mt-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-p)] mb-2">Exemplos</p>
                <ul className="flex flex-col gap-1.5">
                  {track.examples.map(example => (
                    <li key={example} className="text-[12.5px] leading-[1.5] text-[var(--text-m)] pl-3" style={{ borderLeft: "2px solid var(--line-2)" }}>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>

              {track.prerequisites.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-p)] mb-2">
                    Pré-requisitos observados
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {track.prerequisites.map(item => (
                      <li key={item.label} className="flex items-center gap-2 text-[12.5px]" style={{ color: item.met ? "var(--text-b)" : "var(--text-p)" }}>
                        {item.met ? (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--tier-high-mark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
                            <path d="M3 8.5l3.5 3.5L13 5" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="var(--text-p)" strokeWidth="1.8" aria-hidden="true" className="flex-shrink-0">
                            <circle cx="8" cy="8" r="6" />
                          </svg>
                        )}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isRecommended && (
                <p className="mt-4 rounded-[8px] px-3 py-2.5 text-[12.5px] leading-[1.5]" style={{ background: "rgba(142,45,226,0.08)", border: "1px solid var(--line-brand)", color: "var(--text-b)" }}>
                  <span className="font-semibold text-white">Entrada imediata</span> — sem requisitos prévios
                  de maturidade, tecnologia ou governança.
                </p>
              )}

              <p className="mt-4 pt-4 text-[12.5px] leading-[1.6] text-[var(--text-m)]" style={{ borderTop: "1px solid var(--line-1)" }}>
                <span className="font-semibold text-white">Primeiro movimento:</span> {track.startAction}
              </p>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
