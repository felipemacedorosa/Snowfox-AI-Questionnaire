/* eslint-disable @next/next/no-img-element */

import {
  AnswerRecord, LEVEL_META, RECOMMENDATIONS,
  calculatePillarScores, calculateOverallScore, applyBlockerRules, getPillarTier,
} from "@/app/data";
import { PillarBar } from "@/components/results/PillarBar";
import { InsightsSection, insightSectionCount } from "@/components/results/InsightsSection";
import { buildExecutiveSummary, buildQuarterlyRecommendations } from "@/app/resultInsights";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The light linear consulting report. Never visible on screen — rendered
 * inside `.print-only` and shown exclusively by the @media print stylesheet
 * when the user exports the PDF. All values are static (no animation).
 */
export function PrintReport({ answers }: { answers: AnswerRecord }) {
  const pillarScores = calculatePillarScores(answers);
  const overallScore = calculateOverallScore(answers);
  const result = applyBlockerRules(overallScore, pillarScores);
  const strongest = pillarScores.reduce((a, b) => (b.score > a.score ? b : a));
  const weakest = pillarScores.reduce((a, b) => (b.score < a.score ? b : a));
  const rec = RECOMMENDATIONS[weakest.id] || "";
  const insightSections = insightSectionCount(answers, pillarScores);
  const actionStepNumber = String(4 + insightSections).padStart(2, "0");
  const meta = LEVEL_META[result.level];
  const executiveSummary = buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest });
  const quarterlyRecommendations = buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest });
  const dateStr = new Date().toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="print-only">
      <div className="print-root">
        <div className="report-wrap">
          {/* Cover */}
          <div className="rpt-cover">
            <div className="flex items-center justify-between mb-9 relative z-[1]">
              <img src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={88} height={22} style={{ height: 22, width: "auto" }} />
              <span className="text-[9px] font-bold tracking-[0.20em] uppercase" style={{ color: "rgba(255,255,255,0.30)" }}>
                Avaliação de Prontidão para IA
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-[0.20em] uppercase mb-3.5 relative z-[1]" style={{ color: "rgba(167,139,250,0.80)" }}>
              Pontuação de Prontidão
            </p>
            <div className="flex items-baseline gap-2 mb-4 relative z-[1]">
              <span className="text-[76px] font-black leading-none tracking-[-0.04em] text-white" style={{ fontFamily: "'Typo Grotesk', sans-serif" }}>
                {overallScore}
              </span>
              <span className="text-[20px] font-medium self-end pb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>/100</span>
            </div>
            <div className="h-[3px] rounded-sm mb-5 relative z-[1]" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="h-full rounded-sm" style={{ width: `${overallScore}%`, background: "linear-gradient(90deg,#8E2DE2,#a855f7)" }} />
            </div>
            <span
              className="inline-flex items-center px-4 py-[5px] rounded-[20px] text-[11px] font-bold tracking-[0.06em] relative z-[1]"
              style={
                meta.key === "low" ? { background: "rgba(239,68,68,0.20)", border: "1px solid rgba(239,68,68,0.45)", color: "rgba(252,165,165,1)" }
                : meta.key === "emerging" ? { background: "rgba(251,146,60,0.18)", border: "1px solid rgba(251,146,60,0.42)", color: "rgba(253,186,116,1)" }
                : meta.key === "moderate" ? { background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.42)", color: "rgba(196,181,253,1)" }
                : meta.key === "high" ? { background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.42)", color: "rgba(110,231,183,1)" }
                : { background: "rgba(34,211,238,0.18)", border: "1px solid rgba(34,211,238,0.40)", color: "rgba(103,232,249,1)" }
              }
            >
              {result.level}
            </span>
            <div className="flex gap-11 mt-6 relative z-[1]">
              <div>
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: "rgba(167,139,250,0.70)" }}>Data</p>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.72)", fontFamily: "Poppins, sans-serif" }}>{dateStr}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div>
            {/* 01 Executive Summary */}
            <div className="rpt-section">
              <div className="rpt-sechead">
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>01</span>
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Resumo Executivo</span>
              </div>
              <div className="rpt-exec-summary">
                <div className="rpt-exec-block">
                  <p className="rpt-exec-title">Situação Atual</p>
                  {executiveSummary.currentSituation.map((sentence, i) => (
                    <p key={i} className="rpt-exec-copy">{sentence}</p>
                  ))}
                </div>
                <div className="rpt-exec-block">
                  <p className="rpt-exec-title">Principais Riscos</p>
                  <ul className="rpt-exec-risks">
                    {executiveSummary.risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
                <div className="rpt-exec-block">
                  <p className="rpt-exec-title">Onde Está a Maior Oportunidade</p>
                  {executiveSummary.opportunity.map((sentence, i) => (
                    <p key={i} className="rpt-exec-copy">{sentence}</p>
                  ))}
                </div>
                <div className="rpt-exec-block">
                  <p className="rpt-exec-title">Recomendação Imediata</p>
                  {executiveSummary.immediateRecommendation.map((sentence, i) => (
                    <p key={i} className="rpt-exec-copy">{sentence}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* 02 Quarterly Roadmap */}
            <div className="rpt-section">
              <div className="rpt-sechead">
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>02</span>
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>O Que Fazer nos Próximos 3 Trimestres</span>
              </div>
              <div className="rpt-quarter-plan">
                {quarterlyRecommendations.map(item => (
                  <div key={item.id} className="rpt-quarter-row">
                    <div>
                      <p className="text-[11px] font-semibold leading-[1.35]" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{item.period}</p>
                      <p className="text-[10px] leading-[1.45] mt-1" style={{ fontFamily: "Poppins, sans-serif", color: "#9A95AB" }}>{item.focus}</p>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold mb-1.5" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{item.title}</p>
                      <p className="text-[12.8px] leading-[1.65]" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>{item.action}</p>
                      <p className="text-[12.3px] leading-[1.55] mt-2" style={{ fontFamily: "Poppins, sans-serif", color: "#7A7587" }}>
                        <span className="font-semibold" style={{ color: "#171221" }}>Resultado esperado:</span> {item.outcome}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 03 Pillar Breakdown */}
            <div className="rpt-section">
              <div className="rpt-sechead">
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>03</span>
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Detalhamento por Pilar</span>
                <span className="ml-auto text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: "#9A95AB" }}>5 dimensões</span>
              </div>
              <div>
                {pillarScores.map((p, i) => {
                  const tier = getPillarTier(p.score);
                  return (
                    <div
                      key={p.id}
                      className="grid items-center gap-[18px] py-3.5"
                      style={{ gridTemplateColumns: "1fr 56px", borderBottom: i < pillarScores.length - 1 ? "1px solid #F1EFF7" : "none" }}
                    >
                      <div>
                        <p className="text-[13px] font-semibold mb-2" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{p.title}</p>
                        <div className="h-1 rounded-sm overflow-hidden" style={{ background: "#E7E4F0" }}>
                          <PillarBar pct={p.score} barClass={tier.barClass} />
                        </div>
                        <p className="text-[10.5px] font-semibold mt-1.5 tracking-[0.02em]" style={{ color: "#9A95AB" }}>{tier.label}</p>
                      </div>
                      <p className={`text-[19px] font-black tracking-[-0.03em] text-right ${tier.pctClass}`} style={{ fontFamily: "'Typo Grotesk', sans-serif" }}>
                        {p.score}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 04+ Lacunas / Oportunidades / Pontos Fortes */}
            <InsightsSection answers={answers} pillarScores={pillarScores} startNumber={4} />

            {/* Recommended Action */}
            <div className="rpt-section">
              <div className="rpt-sechead">
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>{actionStepNumber}</span>
                <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Próximo Passo Recomendado</span>
              </div>
              <div className="rounded-[10px] p-5" style={{ background: "#FAF9FD", border: "1px solid #E7E4F0" }}>
                <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: "#6D28D9" }}>Ação Prioritária</p>
                <p className="text-[13.5px] leading-[1.70]" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>{rec}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rpt-footer">
            <p className="text-[9.5px] tracking-[0.08em] w-full pt-3.5 text-center" style={{ color: "#C0BBCF", borderTop: "1px solid #E7E4F0" }}>
              SnowFox AI · snowfox-ai.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
