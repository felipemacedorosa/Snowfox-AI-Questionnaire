"use client";

import { AnswerRecord, PillarScore } from "@/app/data";
import { INSIGHT_BADGE_LABEL, InsightBadge, PILLAR_LABEL, selectResultInsights } from "@/app/resultInsights";

const BADGE_STYLE: Record<InsightBadge, { bg: string; border: string; color: string }> = {
  "risco-critico": { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.35)", color: "#B91C1C" },
  "oportunidade": { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.38)", color: "#A8580F" },
  "proximo-passo": { bg: "rgba(109,40,217,0.10)", border: "rgba(109,40,217,0.30)", color: "#6D28D9" },
  "forca-existente": { bg: "rgba(31,157,107,0.12)", border: "rgba(31,157,107,0.35)", color: "#1F9D6B" },
};

export function InsightsSection({ answers, pillarScores }: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
}) {
  const insights = selectResultInsights(answers, pillarScores);
  if (insights.length === 0) return null;

  return (
    <div className="rpt-section">
      <div className="rpt-sechead">
        <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>04</span>
        <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Principais insights</span>
      </div>
      <p className="text-[13px] leading-[1.65] mb-5" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>
        Com base nas suas respostas, estes são os pontos que mais influenciam a prontidão da sua empresa para IA.
      </p>
      <div className="flex flex-col gap-3.5">
        {insights.map(item => {
          const badge = BADGE_STYLE[item.type];
          return (
            <div key={item.id} className="rounded-[10px] p-5" style={{ background: "#FAF9FD", border: "1px solid #E7E4F0" }}>
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
        })}
      </div>
    </div>
  );
}
