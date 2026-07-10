"use client";

import { motion } from "motion/react";
import type { CriticalPathGate, NextLevelTarget } from "@/app/resultAnalysis";
import { fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";

/** The three capability shifts that unblock the next readiness level. */
export function CriticalPathSection({ gates, nextLevel }: {
  gates: CriticalPathGate[];
  nextLevel: NextLevelTarget;
}) {
  return (
    <motion.section
      id="caminho-critico"
      className="scroll-mt-28"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.1)}
      aria-labelledby="caminho-critico"
    >
      <SectionHeading number="02" title="Caminho crítico" aside="O que precisa mudar primeiro" />

      <motion.div
        variants={fadeUp}
        className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)] px-5 py-4"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]">Próximo patamar</p>
          <p className="font-display font-bold text-white text-[17px] mt-0.5">
            {nextLevel.label ?? "Prontidão avançada consolidada"}
          </p>
        </div>
        {nextLevel.threshold !== null && (
          <p className="text-[13px] leading-[1.6] text-[var(--text-m)] max-w-[520px]">
            <span className="font-display font-bold text-white">+{nextLevel.scoreDelta} pontos</span>{" "}
            é a referência quantitativa; os gates abaixo mostram as mudanças de capacidade que realmente importam.
          </p>
        )}
      </motion.div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {gates.map((gate, index) => (
          <motion.article
            key={gate.id}
            variants={fadeUp}
            className="rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)] p-5 flex flex-col"
            style={gate.isBlocker ? { borderColor: "color-mix(in srgb, var(--tier-emerging-mark) 45%, transparent)" } : undefined}
          >
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="font-display font-bold text-[13px]" style={{ color: "var(--violet-400)" }}>
                0{index + 1}
              </span>
              <span className="text-[13px] font-semibold text-white">{gate.pillarTitle}</span>
              {gate.isBlocker && (
                <span
                  className="ml-auto text-[10px] font-bold uppercase tracking-[0.05em] px-2 py-[2px] rounded-[6px]"
                  style={{ background: "var(--tier-emerging-bg)", color: "var(--tier-emerging-text)" }}
                >
                  Gate ativo
                </span>
              )}
            </div>

            <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--text-dim)]">{gate.question}</p>

            <div className="mt-4 flex flex-col gap-2">
              <div className="rounded-[8px] border border-[var(--line-1)] px-3 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-p)]">Estado atual</p>
                <p className="text-[13px] font-medium text-[var(--text-m)] mt-0.5">{gate.currentState}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--violet-400)" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="self-center rotate-90">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
              <div className="rounded-[8px] px-3 py-2" style={{ background: "rgba(142,45,226,0.08)", border: "1px solid var(--line-brand)" }}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: "rgba(182,154,248,0.7)" }}>Próxima capacidade</p>
                <p className="text-[13px] font-semibold text-white mt-0.5">{gate.targetState}</p>
              </div>
            </div>

            <p className="mt-4 text-[12.5px] leading-[1.6] text-[var(--text-m)]">{gate.reason}</p>
            <p className="mt-3 pt-3 text-[12px] leading-[1.55] text-[var(--text-dim)]" style={{ borderTop: "1px solid var(--line-1)" }}>
              <span className="font-semibold text-[var(--text-m)]">Dependência:</span> {gate.dependency}
            </p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
