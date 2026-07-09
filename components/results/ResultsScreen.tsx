"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  AnswerRecord, LEVEL_META, RECOMMENDATIONS,
  calculatePillarScores, calculateOverallScore, applyBlockerRules, getPillarTier,
} from "@/app/data";
import { PillarBar } from "@/components/results/PillarBar";
import { InsightsSection, insightSectionCount } from "@/components/results/InsightsSection";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ResultsScreen({ answers, onRestart }: {
  answers: AnswerRecord;
  onRestart: () => void;
}) {
  const scoreNumRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const pillarScores = calculatePillarScores(answers);
  const overallScore = calculateOverallScore(answers);
  const result = applyBlockerRules(overallScore, pillarScores);
  const weakest = pillarScores.reduce((a, b) => b.score < a.score ? b : a);
  const rec = RECOMMENDATIONS[weakest.id] || "";
  const insightSections = insightSectionCount(answers, pillarScores);
  const actionStepNumber = String(3 + insightSections).padStart(2, "0");
  const meta = LEVEL_META[result.level];
  const dateStr = new Date().toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    const el = scoreNumRef.current;
    const bar = barRef.current;
    if (!el) return;
    const duration = 1100;
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el!.textContent = String(Math.round(ease * overallScore));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if (bar) requestAnimationFrame(() => { bar.style.width = overallScore + "%"; });
  }, [overallScore]);

  return (
    <div className="flex flex-col items-center pb-16">
      <div className="print-root flex flex-col items-center pb-16">
      <div className="report-wrap">
        {/* Cover */}
        <div className="rpt-cover">
          <div className="flex items-center justify-between mb-9 relative z-[1]">
            <Image src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={88} height={22} style={{ height: 22, width: "auto" }} />
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold tracking-[0.20em] uppercase" style={{ color: "rgba(255,255,255,0.30)" }}>Avaliação de Prontidão para IA</span>
              <button
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-1.5 px-3.5 h-[30px] rounded-[7px] text-[11px] font-semibold tracking-[0.02em] transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", fontFamily: "Poppins, sans-serif" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2"/>
                  <path d="M8 2v7M5 6l3 3 3-3"/>
                </svg>
                Baixar PDF
              </button>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.20em] uppercase mb-3.5 relative z-[1]" style={{ color: "rgba(167,139,250,0.80)" }}>Pontuação de Prontidão</p>
          <div className="flex items-baseline gap-2 mb-4 relative z-[1]">
            <span ref={scoreNumRef} className="text-[76px] font-black leading-none tracking-[-0.04em] text-white" style={{ fontFamily: "'Typo Grotesk', sans-serif" }}>0</span>
            <span className="text-[20px] font-medium self-end pb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>/100</span>
          </div>
          <div className="h-[3px] rounded-sm mb-5 relative z-[1]" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div ref={barRef} className="h-full rounded-sm" style={{ width: "0%", background: "linear-gradient(90deg,#8E2DE2,#a855f7)", transition: "width 1.2s cubic-bezier(.22,1,.36,1)" }} />
          </div>
          <span className={`inline-flex items-center px-4 py-[5px] rounded-[20px] text-[11px] font-bold tracking-[0.06em] relative z-[1] rpt-level-tag ${meta.key}`}
            style={meta.key === "low" ? { background: "rgba(239,68,68,0.20)", border: "1px solid rgba(239,68,68,0.45)", color: "rgba(252,165,165,1)" }
              : meta.key === "emerging" ? { background: "rgba(251,146,60,0.18)", border: "1px solid rgba(251,146,60,0.42)", color: "rgba(253,186,116,1)" }
              : meta.key === "moderate" ? { background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.42)", color: "rgba(196,181,253,1)" }
              : meta.key === "high" ? { background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.42)", color: "rgba(110,231,183,1)" }
              : { background: "rgba(34,211,238,0.18)", border: "1px solid rgba(34,211,238,0.40)", color: "rgba(103,232,249,1)" }}
          >{result.level}</span>
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
            <p className="text-[14.5px] leading-[1.72] mb-4" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>{meta.desc}</p>
            {result.blocker && (
              <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                style={{ background: "#FFFBEF", border: "1px solid rgba(168,120,15,0.40)", color: "#7A5A0C", fontFamily: "Poppins, sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0 mt-px" style={{ color: "#A8780F" }}><circle cx="8" cy="8" r="7"/><path d="M8 5v3"/><circle cx="8" cy="11.5" r=".6" fill="currentColor" stroke="none"/></svg>
                {result.blocker}
              </div>
            )}
            <div className="rpt-kpis">
              <div className="rpt-kpi">
                <p style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#6D28D9", whiteSpace: "nowrap" }}>{overallScore} / 100</p>
                <p className="text-[9.5px] uppercase tracking-[0.08em] font-semibold mt-1 leading-[1.4]" style={{ color: "#9A95AB" }}>Pontuação de Prontidão</p>
              </div>
              <div className="rpt-kpi">
                <p style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#171221", whiteSpace: "nowrap" }}>{result.level}</p>
                <p className="text-[9.5px] uppercase tracking-[0.08em] font-semibold mt-1 leading-[1.4]" style={{ color: "#9A95AB" }}>Nível de Prontidão</p>
              </div>
              <div className="rpt-kpi">
                <p style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#171221" }}>
                  {Object.keys(answers).filter(k => { const v = answers[k]; return typeof v === "number" || (Array.isArray(v) && (v as number[]).length > 0); }).length}
                </p>
                <p className="text-[9.5px] uppercase tracking-[0.08em] font-semibold mt-1 leading-[1.4]" style={{ color: "#9A95AB" }}>Perguntas Respondidas</p>
              </div>
            </div>
          </div>

          {/* 02 Pillar Breakdown */}
          <div className="rpt-section">
            <div className="rpt-sechead">
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>02</span>
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Detalhamento por Pilar</span>
              <span className="ml-auto text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: "#9A95AB" }}>5 dimensões</span>
            </div>
            <div>
              {pillarScores.map((p, i) => {
                const tier = getPillarTier(p.score);
                return (
                  <div key={p.id} className="grid items-center gap-[18px] py-3.5"
                    style={{ gridTemplateColumns: "1fr 56px", borderBottom: i < pillarScores.length - 1 ? "1px solid #F1EFF7" : "none" }}>
                    <div>
                      <p className="text-[13px] font-semibold mb-2" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{p.title}</p>
                      <div className="h-1 rounded-sm overflow-hidden" style={{ background: "#E7E4F0" }}>
                        <PillarBar pct={p.score} barClass={tier.barClass} />
                      </div>
                      <p className="text-[10.5px] font-semibold mt-1.5 tracking-[0.02em]" style={{ color: "#9A95AB" }}>{tier.label}</p>
                    </div>
                    <p className={`text-[19px] font-black tracking-[-0.03em] text-right ${tier.pctClass}`}
                      style={{ fontFamily: "'Typo Grotesk', sans-serif" }}>{p.score}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 03+ Lacunas / Oportunidades / Pontos Fortes (personalized, data-driven) */}
          <InsightsSection answers={answers} pillarScores={pillarScores} startNumber={3} />

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

        {/* Footer CTA */}
        <div className="rpt-footer">
          <p className="text-[13px] no-print" style={{ color: "#9A95AB" }}>Pronto para transformar esses insights em um roadmap de IA concreto?</p>
          <button className="no-print inline-flex items-center gap-2.5 px-9 h-[50px] rounded-[10px] text-[14px] font-semibold tracking-[0.03em] text-white cursor-pointer border-none transition-all"
            style={{ background: "linear-gradient(135deg,#6D28D9,#4A00E0)", boxShadow: "0 4px 20px rgba(109,40,217,0.36)", fontFamily: "Poppins, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(109,40,217,0.50)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(109,40,217,0.36)"; }}
          >
            Fale com um Especialista Snowfox AI
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </button>
          <button onClick={onRestart} className="no-print inline-flex items-center gap-2 px-5 h-[38px] rounded-[8px] text-[12.5px] font-medium cursor-pointer transition-all"
            style={{ border: "1px solid #E7E4F0", background: "#fff", color: "#9A95AB", fontFamily: "Poppins, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#9A95AB"; (e.currentTarget as HTMLElement).style.color = "#56516A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E7E4F0"; (e.currentTarget as HTMLElement).style.color = "#9A95AB"; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2 8a6 6 0 116 6"/><path d="M2 8V4M2 8H6"/></svg>
            Refazer Avaliação
          </button>
          <p className="text-[9.5px] tracking-[0.08em] w-full pt-3.5 text-center" style={{ color: "#C0BBCF", borderTop: "1px solid #E7E4F0" }}>
            SnowFox AI · snowfox-ai.com
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
