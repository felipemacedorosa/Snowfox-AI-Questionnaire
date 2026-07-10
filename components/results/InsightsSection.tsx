"use client";

import { AnswerRecord, PillarScore } from "@/app/data";
import {
  CATEGORY_INTRO, CATEGORY_LABEL, categoryOf, INSIGHT_BADGE_LABEL, InsightBadge, InsightCategory,
  PILLAR_LABEL, ResultInsight, selectResultInsights,
} from "@/app/resultInsights";

const BADGE_STYLE: Record<InsightBadge, { bg: string; border: string; color: string }> = {
  "risco-critico": { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.35)", color: "#B91C1C" },
  "oportunidade": { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.38)", color: "#A8580F" },
  "proximo-passo": { bg: "rgba(109,40,217,0.10)", border: "rgba(109,40,217,0.30)", color: "#6D28D9" },
  "forca-existente": { bg: "rgba(31,157,107,0.12)", border: "rgba(31,157,107,0.35)", color: "#1F9D6B" },
};

const CATEGORY_ORDER: InsightCategory[] = ["lacunas", "oportunidades", "forcas"];

function InsightCard({ item }: { item: ResultInsight }) {
  const badge = BADGE_STYLE[item.type];
  return (
    <div className="rounded-[10px] p-5" style={{ background: "#FAF9FD", border: "1px solid #E7E4F0" }}>
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color: "#9A95AB" }}>
          {PILLAR_LABEL[item.pillar]}
        </span>
        <span className="text-[9.5px] font-bold uppercase px-2 py-[3px] rounded-[20px]"
          style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, letterSpacing: "0.04em" }}>
          {INSIGHT_BADGE_LABEL[item.type]}
        </span>
      </div>
      <p className="text-[14px] font-semibold mb-1.5" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{item.title}</p>
      <p className="text-[13px] leading-[1.65]" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>{item.insight}</p>
    </div>
  );
}

export function InsightsSection({ answers, pillarScores, startNumber }: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  startNumber: number;
}) {
  const insights = selectResultInsights(answers, pillarScores);
  if (insights.length === 0) return null;

  const byCategory: Record<InsightCategory, ResultInsight[]> = { lacunas: [], oportunidades: [], forcas: [] };
  for (const item of insights) byCategory[categoryOf(item)].push(item);

  const sections = CATEGORY_ORDER.filter(cat => byCategory[cat].length > 0);

  return (
    <>
      {sections.map((cat, idx) => (
        <div key={cat} className="rpt-section">
          <div className="rpt-sechead">
            <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>
              {String(startNumber + idx).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>
              {CATEGORY_LABEL[cat]}
            </span>
          </div>
          <p className="text-[13px] leading-[1.65] mb-5" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>
            {CATEGORY_INTRO[cat]}
          </p>
          <div className="flex flex-col gap-3.5">
            {byCategory[cat].map(item => <InsightCard key={item.id} item={item} />)}
          </div>
        </div>
      ))}
    </>
  );
}

export function insightSectionCount(answers: AnswerRecord, pillarScores: PillarScore[]): number {
  const insights = selectResultInsights(answers, pillarScores);
  const categories = new Set(insights.map(categoryOf));
  return categories.size;
}
