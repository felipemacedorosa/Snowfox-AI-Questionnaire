"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getPillarTier, PillarScore } from "@/app/data";
import { PILLAR_TITLES, type QuestionEvidence } from "@/app/resultAnalysis";
import type { InsightPillarId } from "@/app/resultInsights";
import { EASE_OUT, fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";

function KindMark({ kind }: { kind: QuestionEvidence["kind"] }) {
  if (kind === "strength") {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--tier-high-mark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8.5l3.5 3.5L13 5" />
      </svg>
    );
  }
  if (kind === "risk") {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--tier-low-mark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2L15 14H1L8 2z" /><path d="M8 6.5v3.5" /><circle cx="8" cy="12" r="0.4" />
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="var(--tier-emerging-mark)" strokeWidth="1.8" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

function EvidenceRow({ item }: { item: QuestionEvidence }) {
  return (
    <article className="rounded-[10px] border border-[var(--line-1)] bg-[var(--surface-2)] px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <KindMark kind={item.kind} />
        {item.normalizedScore !== null && (
          <span className="font-display font-bold text-[13px] text-white">{item.normalizedScore}%</span>
        )}
        <span className="text-[11.5px] leading-[1.5] text-[var(--text-p)] truncate">{item.question}</span>
      </div>
      <p className="mt-2 text-[13.5px] font-semibold text-[var(--text-b)] leading-[1.5]">{item.answer}</p>
      {item.targetState && item.kind !== "strength" && (
        <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: "var(--violet-300)" }}>
          Próxima capacidade: {item.targetState}
        </p>
      )}
    </article>
  );
}

function EvidenceColumn({ title, items, empty }: { title: string; items: QuestionEvidence[]; empty: string }) {
  return (
    <div className="min-w-0">
      <h4 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-dim)] mb-3">
        {title}
        <span className="text-[11px] font-bold px-1.5 py-[1px] rounded-[5px] bg-[var(--surface-3)] text-[var(--text-m)] normal-case tracking-normal">
          {items.length}
        </span>
      </h4>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-[var(--text-p)]">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map(item => <EvidenceRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

/** Per-pillar reading built from the user's actual answers. */
export function PillarDeepDive({ pillarScores, evidence, initialPillarId }: {
  pillarScores: PillarScore[];
  evidence: QuestionEvidence[];
  initialPillarId: InsightPillarId;
}) {
  const [activeId, setActiveId] = useState<InsightPillarId>(initialPillarId);
  const activeScore = pillarScores.find(pillar => pillar.id === activeId)?.score ?? 0;
  const tier = getPillarTier(activeScore);
  const activeEvidence = evidence.filter(item => item.pillar === activeId);
  const strengths = activeEvidence
    .filter(item => item.kind === "strength")
    .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0))
    .slice(0, 3);
  const gaps = activeEvidence
    .filter(item => item.kind === "gap" || item.kind === "risk")
    .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100))
    .slice(0, 4);
  const context = activeEvidence.filter(item => item.kind === "context");

  return (
    <motion.section
      id="dimensoes"
      className="scroll-mt-28"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.08)}
      aria-labelledby="dimensoes"
    >
      <SectionHeading number="04" title="Diagnóstico por dimensão" aside="Das respostas às capacidades" />

      <motion.div variants={fadeUp} className="mt-6 grid lg:grid-cols-[240px_1fr] gap-5">
        {/* Pillar tabs */}
        <div
          className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0"
          role="tablist"
          aria-label="Dimensões do diagnóstico"
        >
          {pillarScores.map((pillar, index) => {
            const id = pillar.id as InsightPillarId;
            const isActive = id === activeId;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(id)}
                className="flex items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors flex-shrink-0 lg:flex-shrink"
                style={{
                  borderColor: isActive ? "var(--line-brand)" : "var(--line-1)",
                  background: isActive ? "rgba(142,45,226,0.08)" : "var(--surface-2)",
                }}
              >
                <span aria-hidden="true" className="font-display font-bold text-[12px]" style={{ color: isActive ? "var(--violet-400)" : "var(--text-p)" }}>
                  0{index + 1}
                </span>
                <span className="flex-1 text-[13px] font-semibold whitespace-nowrap lg:whitespace-normal" style={{ color: isActive ? "var(--text-h)" : "var(--text-m)" }}>
                  {pillar.title}
                </span>
                <span className="font-display font-bold text-[14px] text-white">{pillar.score}</span>
              </button>
            );
          })}
        </div>

        {/* Evidence panel */}
        <div role="tabpanel" className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="surface-panel p-6"
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-5 mb-5" style={{ borderBottom: "1px solid var(--line-1)" }}>
                <p className="font-display font-bold text-white text-[18px] tracking-[-0.01em]">
                  {PILLAR_TITLES[activeId]}
                </p>
                <p className="font-display font-bold text-[18px] text-white">{activeScore}%</p>
                <span
                  className="text-[11px] font-bold px-2.5 py-[3px] rounded-[7px]"
                  style={{ background: `var(--tier-${tier.key}-bg)`, color: `var(--tier-${tier.key}-text)` }}
                >
                  {tier.label}
                </span>
                <div className="basis-full h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${activeScore}%`, background: `var(--tier-${tier.key}-mark)` }} />
                </div>
              </div>

              <div className={`grid gap-6 ${strengths.length > 0 ? "md:grid-cols-2" : ""}`}>
                {strengths.length > 0 && (
                  <EvidenceColumn title="Capacidades presentes" items={strengths} empty="Nenhuma força específica foi selecionada neste pilar." />
                )}
                <EvidenceColumn title="Gaps prioritários" items={gaps} empty="Nenhum gap prioritário foi identificado neste pilar." />
              </div>

              {context.map(item => (
                <div key={item.id} className="mt-5 pl-3.5" style={{ borderLeft: "2px solid var(--line-2)" }}>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-p)] mb-1">Contexto fornecido</p>
                  <p className="text-[13px] leading-[1.65] text-[var(--text-m)]">{item.answer}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.section>
  );
}
