"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AnswerRecord, LEVEL_META, PILLAR_CONFIG,
  applyBlockerRules, calculateOverallScore, calculatePillarScores,
} from "@/app/data";
import { buildExecutiveSummary, buildQuarterlyRecommendations, type InsightPillarId } from "@/app/resultInsights";
import {
  buildQuestionEvidence, getCriticalPath, getNextLevelTarget,
  getOpportunityTracks, getReadinessProfile, getRiskSignals,
} from "@/app/resultAnalysis";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { TierBadge, type Tier } from "@/components/ui/Badge";
import { fadeUp, VIEWPORT_ONCE } from "@/lib/motion";
import { PILLAR_SHORT } from "@/components/landing/stats";
import { RadarChart } from "./RadarChart";
import { ScoreGauge } from "./ScoreGauge";
import { PillarTiles } from "./PillarTiles";
import { ExecSummaryPanel } from "./ExecSummaryPanel";
import { CriticalPathSection } from "./CriticalPathSection";
import { RiskTopology } from "./RiskTopology";
import { PillarDeepDive } from "./PillarDeepDive";
import { OpportunityLibrary } from "./OpportunityLibrary";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { ChapterNav, type ReportChapter } from "./ChapterNav";
import { StickyScoreBar } from "./StickyScoreBar";
import { PrintReport } from "./PrintReport";

const REPORT_CHAPTERS: ReportChapter[] = [
  { id: "resumo", number: "01", label: "Resumo executivo" },
  { id: "caminho-critico", number: "02", label: "Caminho crítico" },
  { id: "riscos", number: "03", label: "Riscos" },
  { id: "dimensoes", number: "04", label: "Dimensões" },
  { id: "oportunidades", number: "05", label: "Oportunidades" },
  { id: "plano", number: "06", label: "Plano de ação" },
];

export function ResultsDashboard({ answers, onRestart }: {
  answers: AnswerRecord;
  onRestart: () => void;
}) {
  const results = useMemo(() => {
    const pillarScores = calculatePillarScores(answers);
    const overallScore = calculateOverallScore(answers);
    const result = applyBlockerRules(overallScore, pillarScores);
    const strongest = pillarScores.reduce((a, b) => (b.score > a.score ? b : a));
    const weakest = pillarScores.reduce((a, b) => (b.score < a.score ? b : a));
    return {
      pillarScores,
      overallScore,
      result,
      weakest,
      tier: (LEVEL_META[result.level]?.key ?? "moderate") as Tier,
      summary: buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest }),
      quarters: buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest }),
      profile: getReadinessProfile(pillarScores, result),
      evidence: buildQuestionEvidence(answers),
      criticalPath: getCriticalPath(answers, pillarScores, result),
      nextLevel: getNextLevelTarget(result),
      riskSignals: getRiskSignals(answers, pillarScores),
      opportunityTracks: getOpportunityTracks(answers, pillarScores),
    };
  }, [answers]);

  const {
    pillarScores, overallScore, result, weakest, tier, summary, quarters,
    profile, evidence, criticalPath, nextLevel, riskSignals, opportunityTracks,
  } = results;
  const levelShort = result.level.replace("Prontidão ", "");
  const dateStr = new Date().toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" });

  // Sticky bar appears once the hero score leaves the viewport
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroGone, setHeroGone] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroGone(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="screen-only mx-auto w-full max-w-results px-6 pb-20">
        <StickyScoreBar
          visible={heroGone}
          score={overallScore}
          levelShort={levelShort}
          tier={tier}
          onPdf={() => window.print()}
        />

        {/* Hero band: on the backdrop, hairline-bounded, no card */}
        <div ref={heroRef} className="py-12" style={{ borderBottom: "1px solid var(--line-1)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-white text-[clamp(24px,3.5vw,32px)] tracking-[-0.02em]">
                Seu diagnóstico de prontidão para IA
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-dim)]">{dateStr}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="secondary" size="md" onClick={() => window.print()}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2" />
                  <path d="M8 2v7M5 6l3 3 3-3" />
                </svg>
                Baixar PDF
              </Button>
              <Button variant="ghost" size="md" onClick={onRestart}>
                Refazer avaliação
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-[2fr_3fr] lg:items-center">
            <div className="flex flex-col items-center lg:items-start">
              <ScoreGauge score={overallScore} tier={tier} />
              <div className="mt-2 flex flex-col items-center lg:items-start gap-3">
                <TierBadge tier={tier}>{result.level}</TierBadge>
                <div className="max-w-[400px] text-center lg:text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]">
                    Perfil de prontidão
                  </p>
                  <p className="mt-1 font-display font-bold text-white text-[19px] tracking-[-0.01em]">
                    {profile.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-[1.65] text-[var(--text-m)]">{profile.summary}</p>
                  <p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--text-dim)]">{profile.implication}</p>
                </div>
                {result.blocker && (
                  <p
                    className="max-w-[400px] pl-3 text-[12.5px] leading-[1.6]"
                    style={{ borderLeft: "2px solid var(--tier-emerging-mark)", color: "var(--tier-emerging-text)" }}
                  >
                    {result.blocker}
                  </p>
                )}
              </div>
            </div>

            <div className="justify-self-center w-full max-w-[420px]">
              <RadarChart
                data={PILLAR_CONFIG.map(p => ({
                  label: PILLAR_SHORT[p.id],
                  value: pillarScores.find(s => s.id === p.id)?.score ?? 0,
                }))}
                size={420}
              />
            </div>
          </div>
        </div>

        {/* Pillar tiles: the radar's text twin */}
        <div className="mt-8">
          <PillarTiles scores={pillarScores} />
        </div>

        <ChapterNav chapters={REPORT_CHAPTERS} />

        <div className="mt-14 flex flex-col gap-16">
          <ExecSummaryPanel summary={summary} />
          <CriticalPathSection gates={criticalPath} nextLevel={nextLevel} />
          <RiskTopology signals={riskSignals} />
          <PillarDeepDive
            pillarScores={pillarScores}
            evidence={evidence}
            initialPillarId={weakest.id as InsightPillarId}
          />
          <OpportunityLibrary tracks={opportunityTracks} />
          <RoadmapTimeline items={quarters} />

          {/* Final CTA */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={fadeUp}
            className="surface-panel p-9 max-md:p-6 flex flex-wrap items-center justify-between gap-6"
          >
            <div>
              <h2 className="font-display font-bold text-white text-[26px] tracking-[-0.02em]">
                Transforme o diagnóstico em execução.
              </h2>
              <p className="mt-2 max-w-[480px] text-[14px] leading-[1.65] text-[var(--text-m)]">
                Agende uma conversa com um especialista Snowfox AI para priorizar seu roadmap.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href="https://snowfox-ai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] h-12 px-7 text-[14px] font-semibold text-white bg-[image:var(--grad)] shadow-[0_8px_32px_rgba(110,40,220,0.28)] transition-[filter] hover:brightness-110 no-underline"
                >
                  Fale com um Especialista Snowfox AI
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </a>
              </Magnetic>
              <Button variant="secondary" size="md" onClick={() => window.print()}>
                Baixar PDF
              </Button>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Light linear report — print/PDF only */}
      <PrintReport answers={answers} />
    </>
  );
}
