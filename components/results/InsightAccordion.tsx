"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnswerRecord, PillarScore } from "@/app/data";
import {
  CATEGORY_INTRO, CATEGORY_LABEL, categoryOf, INSIGHT_BADGE_LABEL,
  InsightBadge, InsightCategory, PILLAR_LABEL, ResultInsight, selectResultInsights,
} from "@/app/resultInsights";
import type { Tier } from "@/components/ui/Badge";
import { EASE_INOUT, fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";

const CATEGORY_ORDER: InsightCategory[] = ["lacunas", "oportunidades", "forcas"];

const CATEGORY_TIER: Record<InsightCategory, Tier> = {
  lacunas: "low",
  oportunidades: "moderate",
  forcas: "high",
};

const BADGE_TIER: Record<InsightBadge, Tier> = {
  "risco-critico": "low",
  "oportunidade": "emerging",
  "proximo-passo": "moderate",
  "forca-existente": "high",
};

function InsightCard({ item, category, open, onToggle }: {
  item: ResultInsight;
  category: InsightCategory;
  open: boolean;
  onToggle: () => void;
}) {
  const tier = CATEGORY_TIER[category];
  const badgeTier = BADGE_TIER[item.type];

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <motion.div
      variants={fadeUp}
      className="cursor-glow rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)] overflow-hidden"
      style={{ borderLeft: `2px solid var(--tier-${tier}-mark)` }}
      onMouseMove={onMouseMove}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="flex-1 min-w-0">
          <span className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-dim)]">
              {PILLAR_LABEL[item.pillar]}
            </span>
            <span
              className="text-[10px] font-bold uppercase px-2 py-[2px] rounded-[6px] tracking-[0.04em]"
              style={{
                background: `var(--tier-${badgeTier}-bg)`,
                color: `var(--tier-${badgeTier}-text)`,
              }}
            >
              {INSIGHT_BADGE_LABEL[item.type]}
            </span>
          </span>
          <span className="block text-[14px] font-semibold text-white leading-[1.45]">{item.title}</span>
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_INOUT }}
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M3 6l5 5 5-5" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_INOUT }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-[13px] leading-[1.7] text-[var(--text-m)]">{item.insight}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function InsightAccordion({ answers, pillarScores }: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
}) {
  const insights = useMemo(() => selectResultInsights(answers, pillarScores), [answers, pillarScores]);

  const byCategory = useMemo(() => {
    const groups: Record<InsightCategory, ResultInsight[]> = { lacunas: [], oportunidades: [], forcas: [] };
    for (const item of insights) groups[categoryOf(item)].push(item);
    return groups;
  }, [insights]);

  // First Lacuna open by default; falls back to the first insight overall.
  const firstOpenId = byCategory.lacunas[0]?.id ?? insights[0]?.id;
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(firstOpenId ? [firstOpenId] : []));

  if (insights.length === 0) return null;

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {CATEGORY_ORDER.filter(cat => byCategory[cat].length > 0).map(cat => {
        const tier = CATEGORY_TIER[cat];
        return (
          <motion.section
            key={cat}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={staggerChildren(0.07)}
            aria-labelledby={`insights-${cat}`}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <h2 id={`insights-${cat}`} className="font-display font-bold text-white text-[24px] tracking-[-0.02em]">
                {CATEGORY_LABEL[cat]}
              </h2>
              <span
                className="text-[11.5px] font-bold px-2.5 py-[3px] rounded-[6px]"
                style={{ background: `var(--tier-${tier}-bg)`, color: `var(--tier-${tier}-text)` }}
              >
                {byCategory[cat].length}
              </span>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-2 mb-5 max-w-[680px] text-[13.5px] leading-[1.65] text-[var(--text-m)]">
              {CATEGORY_INTRO[cat]}
            </motion.p>
            <div className="flex flex-col gap-3">
              {byCategory[cat].map(item => (
                <InsightCard
                  key={item.id}
                  item={item}
                  category={cat}
                  open={openIds.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
