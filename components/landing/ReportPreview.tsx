"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { getPillarTier, getReadinessLevel, LEVEL_META, PILLAR_CONFIG } from "@/app/data";
import { Ticker } from "@/components/ui/Ticker";
import { TierBadge, type Tier } from "@/components/ui/Badge";
import { fadeUp, staggerChildren, VIEWPORT_ONCE, EASE_OUT } from "@/lib/motion";
import { PILLAR_SHORT } from "./stats";

const SAMPLE_SCORE = 74;
const SAMPLE_PILLARS = [78, 71, 64, 80, 74];
/** Widths of the "redacted" summary lines — content shape without lorem. */
const REDACTED_WIDTHS = ["92%", "78%", "85%", "58%"];

const DELIVERABLES = [
  "Resumo executivo da situação atual",
  "Roadmap de 3 trimestres priorizado",
  "Detalhamento dos 5 pilares",
  "Lacunas, oportunidades e pontos fortes",
  "PDF exportável para compartilhar",
];

export function ReportPreview() {
  const mockRef = useRef<HTMLDivElement>(null);
  const inView = useInView(mockRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const revealed = inView || !!reduced;

  const level = getReadinessLevel(SAMPLE_SCORE);
  const tier = (LEVEL_META[level]?.key ?? "high") as Tier;

  return (
    <section id="relatorio" className="py-32 max-lg:py-20 scroll-mt-20">
      <div className="grid gap-14 lg:grid-cols-[45fr_55fr] lg:items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={staggerChildren(0.08)}
        >
          <motion.h2
            variants={fadeUp}
            className="font-display font-bold text-white text-[clamp(28px,4vw,36px)] tracking-[-0.02em]"
          >
            O que você recebe
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-[15px] leading-[1.7] text-[var(--text-m)]">
            Não é uma nota solta. É um diagnóstico executivo completo, gerado a
            partir das suas respostas e pronto para levar à diretoria.
          </motion.p>
          <motion.ul variants={staggerChildren(0.06)} className="mt-8 flex flex-col gap-3.5">
            {DELIVERABLES.map(item => (
              <motion.li key={item} variants={fadeUp} className="flex items-center gap-3 text-[14px] text-[var(--text-b)]">
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  stroke="var(--violet-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true" className="flex-shrink-0"
                >
                  <path d="M3 8.5l3.5 3.5L13 5" />
                </svg>
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Mock mini-report */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={fadeUp}
          className="relative justify-self-center w-full max-w-[440px]"
        >
          <div
            ref={mockRef}
            className="rounded-[12px] border border-[var(--line-2)] p-7"
            style={{ background: "var(--surface-1)" }}
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]">
                  Índice de prontidão
                </p>
                <p className="font-display font-black text-white leading-none mt-1.5" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>
                  <Ticker value={revealed ? SAMPLE_SCORE : 0} />
                  <span className="text-[15px] font-medium text-[var(--text-dim)] ml-1">/100</span>
                </p>
              </div>
              <TierBadge tier={tier}>{level.replace("Prontidão ", "")}</TierBadge>
            </div>

            <div className="mt-7 flex flex-col gap-4">
              {PILLAR_CONFIG.map((p, i) => {
                const value = SAMPLE_PILLARS[i];
                const pillarTier = getPillarTier(value).key;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-[var(--text-m)]">{PILLAR_SHORT[p.id]}</span>
                      <span className="font-display font-bold text-white">{value}</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `var(--tier-${pillarTier}-mark)` }}
                        initial={{ width: "0%" }}
                        animate={revealed ? { width: `${value}%` } : {}}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: EASE_OUT }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Redacted summary lines */}
            <div className="mt-7 pt-6 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--line-1)" }} aria-hidden="true">
              {REDACTED_WIDTHS.map((width, i) => (
                <motion.div
                  key={i}
                  className="h-[4px] rounded-full bg-[var(--line-2)]"
                  style={{ width }}
                  initial={{ opacity: 0 }}
                  animate={revealed ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.05 }}
                />
              ))}
            </div>
          </div>

          {/* Offset stat chips — restrained layering */}
          <motion.div
            className="absolute -right-3 -top-3 rounded-[10px] border border-[var(--line-2)] px-4 py-2.5"
            style={{ background: "var(--surface-1)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 1.0, ease: EASE_OUT }}
          >
            <p className="text-[10.5px] uppercase tracking-[0.06em] font-semibold text-[var(--text-dim)]">Roadmap</p>
            <p className="text-[13px] font-semibold text-white">3 trimestres</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
