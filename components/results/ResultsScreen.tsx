"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Download,
  ExternalLink,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AnswerRecord,
  applyBlockerRules,
  calculateOverallScore,
  calculatePillarScores,
  getLevelLabel,
  LEVEL_META,
} from "@/app/data";
import { useLanguage } from "@/app/LanguageContext";
import {
  getCriticalPath,
  getNextLevelTarget,
  getOpportunityTracks,
  getReadinessProfile,
  getRiskSignals,
  selectPrimaryRecommendation,
} from "@/app/resultAnalysis";
import {
  buildExecutiveSummary,
  buildQuarterlyRecommendations,
  QuarterlyRecommendation,
} from "@/app/resultInsights";
import {
  CriticalPathSection,
  OPPORTUNITY_ICONS,
  OpportunityLibrarySection,
  RiskViewSection,
} from "@/components/results/DeepResultSections";
import { PillarRadarChart } from "@/components/results/PillarRadarChart";
import { ReportChapter, ReportNavigation } from "@/components/results/ReportNavigation";
// TESTING FEATURE — safe to delete. See DebugAnswersAppendix.tsx for removal steps.
import { DebugAnswersAppendix } from "@/components/results/DebugAnswersAppendix";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL ?? "https://snowfox-ai.com";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.14 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function RoadmapDetailContent({ item }: { item: QuarterlyRecommendation }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="roadmap-action-copy"><p>{item.action}</p><p><strong>{t.results.expectedOutcome}</strong> {item.outcome}.</p></div>
      <dl className="roadmap-action-meta">
        <div><dt>{t.results.suggestedOwner}</dt><dd>{item.ownerRole}</dd></div>
        <div><dt>{t.results.effort}</dt><dd>{item.effort}</dd></div>
        <div><dt>{t.results.dependency}</dt><dd>{item.dependency}</dd></div>
        <div><dt>{t.results.successMetric}</dt><dd>{item.successMetric}</dd></div>
      </dl>
    </>
  );
}

export function ResultsScreen({ answers, onRestart }: { answers: AnswerRecord; onRestart: () => void }) {
  const { lang, t } = useLanguage();
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedRoadmap, setExpandedRoadmap] = useState("q1");
  const prefersReducedMotion = useReducedMotion();
  const revealMotion = prefersReducedMotion ? { initial: false as const } : reveal;

  const REPORT_CHAPTERS: ReportChapter[] = useMemo(() => [
    { id: "summary", number: "01", label: t.results.summaryHeading },
    { id: "recommendation", number: "02", label: t.results.recommendationHeading },
    { id: "critical-path", number: "03", label: t.deepSections.criticalPathHeading },
    { id: "risks", number: "04", label: t.deepSections.riskHeading },
    { id: "opportunities", number: "05", label: t.deepSections.opportunityHeading },
    { id: "action-plan", number: "06", label: t.results.actionPlanHeading },
  ], [t]);

  const pillarScores = useMemo(() => calculatePillarScores(answers, lang), [answers, lang]);
  const overallScore = useMemo(() => calculateOverallScore(answers), [answers]);
  const result = useMemo(() => applyBlockerRules(overallScore, pillarScores, lang), [overallScore, pillarScores, lang]);
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const meta = LEVEL_META[result.level];
  const executiveSummary = useMemo(
    () => buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest, lang }),
    [answers, pillarScores, result, strongest, weakest, lang]
  );
  const quarterlyRecommendations = useMemo(
    () => buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest, lang }),
    [answers, pillarScores, result, strongest, weakest, lang]
  );
  const profile = useMemo(() => getReadinessProfile(pillarScores, result, lang), [pillarScores, result, lang]);
  const criticalPath = useMemo(() => getCriticalPath(answers, pillarScores, result, lang), [answers, pillarScores, result, lang]);
  const nextLevel = useMemo(() => getNextLevelTarget(result, lang), [result, lang]);
  const riskSignals = useMemo(() => getRiskSignals(answers, pillarScores, lang), [answers, pillarScores, lang]);
  const opportunityTracks = useMemo(() => getOpportunityTracks(answers, pillarScores, lang), [answers, pillarScores, lang]);
  const primaryRecommendation = useMemo(() => selectPrimaryRecommendation(opportunityTracks), [opportunityTracks]);
  const RecommendationIcon = OPPORTUNITY_ICONS[primaryRecommendation.id];
  const dateStr = useMemo(
    () => new Intl.DateTimeFormat(lang === "en" ? "en-US" : "pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()),
    [lang]
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayScore(overallScore);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const duration = 1050;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayScore(Math.round((1 - Math.pow(1 - progress, 3)) * overallScore));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [overallScore, prefersReducedMotion]);

  useEffect(() => {
    const originalStyles = new Map<HTMLElement, {
      opacity: string;
      opacityPriority: string;
      transform: string;
      transformPriority: string;
    }>();
    const prepareReport = () => {
      setDisplayScore(overallScore);
      document.querySelectorAll<HTMLElement>(".report-section").forEach(section => {
        originalStyles.set(section, {
          opacity: section.style.getPropertyValue("opacity"),
          opacityPriority: section.style.getPropertyPriority("opacity"),
          transform: section.style.getPropertyValue("transform"),
          transformPriority: section.style.getPropertyPriority("transform"),
        });
        section.style.setProperty("opacity", "1", "important");
        section.style.setProperty("transform", "none", "important");
      });
    };
    const restoreReport = () => {
      originalStyles.forEach((style, section) => {
        if (style.opacity) section.style.setProperty("opacity", style.opacity, style.opacityPriority);
        else section.style.removeProperty("opacity");
        if (style.transform) section.style.setProperty("transform", style.transform, style.transformPriority);
        else section.style.removeProperty("transform");
      });
      originalStyles.clear();
    };
    window.addEventListener("beforeprint", prepareReport);
    window.addEventListener("afterprint", restoreReport);
    return () => {
      window.removeEventListener("beforeprint", prepareReport);
      window.removeEventListener("afterprint", restoreReport);
      restoreReport();
    };
  }, [overallScore]);

  return (
    <div className="results-page">
      <div className="results-layout page-frame">
        <ReportNavigation chapters={REPORT_CHAPTERS} />

        <div className="results-report print-root">
          <motion.section className="results-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
            <motion.div className="results-hero-topline" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
              <div className="brand-lockup brand-lockup-light">
                <Image src={`${BASE}/fox-icon.png`} alt="" width={28} height={28} />
                <span>snowfox <b>AI</b></span>
              </div>
              <div className="results-hero-actions no-print">
                <span>{t.results.reportDate(dateStr)}</span>
                <button type="button" className="hero-tool-button" onClick={() => window.print()} title={t.results.exportPdfTitle}>
                  <Download size={15} aria-hidden="true" /> <span>{t.results.exportPdf}</span>
                </button>
              </div>
            </motion.div>

            <div className="results-hero-grid">
              <motion.div className="score-column" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.42 }}>
                <span className="section-kicker section-kicker-light"><span className="kicker-line" /> {t.results.readingKicker}</span>
                <div className="score-value"><span>{displayScore}</span><small>/100</small></div>
                <div className="score-track" role="progressbar" aria-label={t.results.scoreAriaLabel(overallScore)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallScore}><span style={{ width: `${overallScore}%` }} /></div>
                <div className="score-meta"><span className={`level-tag level-${meta.key}`}>{getLevelLabel(result.level, lang)}</span><span>{dateStr}</span></div>
              </motion.div>
              <motion.div className="results-hero-reading" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.42 }}>
                <span className="results-profile-label">{t.results.profileLabel}</span>
                <h1>{profile.title}</h1>
                <p className="results-hero-summary">{profile.summary}</p>
                <p className="results-profile-implication">{profile.implication}</p>
                {result.blocker && <div className="blocker-note"><TrendingDown size={16} aria-hidden="true" /><span>{result.blocker}</span></div>}
              </motion.div>
            </div>
          </motion.section>

          <motion.section className="report-section executive-section" id="summary" {...revealMotion}>
            <div className="report-section-heading">
              <div><span className="report-section-number">01</span><h2>{t.results.summaryHeading}</h2></div>
            </div>
            <div className="executive-summary-layout">
              <div className="executive-summary-body">
                <p>{executiveSummary.strengths}</p>
                <p>{executiveSummary.opportunities}</p>
              </div>
              <div className="executive-summary-chart">
                <PillarRadarChart pillarScores={pillarScores} />
              </div>
            </div>
          </motion.section>

          <motion.section className="report-section recommendation-section" id="recommendation" {...revealMotion}>
            <div className="report-section-heading">
              <div><span className="report-section-number">02</span><h2>{t.results.recommendationHeading}</h2></div>
            </div>
            <div className="executive-data-foundation">
              <RecommendationIcon size={22} aria-hidden="true" />
              <div>
                <h3>{primaryRecommendation.title}</h3>
                <p>{primaryRecommendation.summary}</p>
                <p>{primaryRecommendation.startAction}</p>
              </div>
              <div className="solution-availability">
                <strong>{t.results.startNow}</strong>
                <span>{primaryRecommendation.id === "data-foundation" ? t.results.noPrerequisites : t.results.prerequisitesMet}</span>
              </div>
            </div>
          </motion.section>

          <CriticalPathSection gates={criticalPath} nextLevel={nextLevel} />
          <RiskViewSection signals={riskSignals} />
          <OpportunityLibrarySection tracks={opportunityTracks} primaryId={primaryRecommendation.id} />

          <motion.section className="report-section roadmap-section" id="action-plan" {...revealMotion}>
            <div className="report-section-heading">
              <div><span className="report-section-number">06</span><h2>{t.results.actionPlanHeading}</h2></div>
            </div>
            <p className="report-section-intro">{t.results.actionPlanIntro}</p>
            <div className="roadmap-list">
              {quarterlyRecommendations.map((item, index) => {
                const isExpanded = expandedRoadmap === item.id;
                return (
                  <article key={item.id} className={`roadmap-row${isExpanded ? " is-active" : ""}`}>
                    <button type="button" className="roadmap-row-trigger" onClick={() => setExpandedRoadmap(isExpanded ? "" : item.id)} aria-expanded={isExpanded}>
                      <span className="roadmap-index">0{index + 1}</span>
                      <span className="roadmap-period"><strong>{item.period}</strong><small>{item.focus}</small></span>
                      <span className="roadmap-title">{item.title}</span>
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div className="roadmap-row-detail screen-only" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                          <RoadmapDetailContent item={item} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="roadmap-row-detail print-only"><RoadmapDetailContent item={item} /></div>
                  </article>
                );
              })}
            </div>
          </motion.section>

          {/* TESTING FEATURE — safe to delete, see DebugAnswersAppendix.tsx */}
          <DebugAnswersAppendix answers={answers} />

          <motion.footer className="results-footer no-print" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.42 }}>
            <div className="footer-cta-copy"><span className="section-kicker"><span className="kicker-line" /> {t.results.nextConversationKicker}</span><h2>{t.results.footerTitle}</h2><p>{t.results.footerLede}</p></div>
            <div className="footer-actions">
              <a className="button-primary button-large" href={CONTACT_URL} target="_blank" rel="noreferrer">{t.results.talkToSpecialist} <ExternalLink size={16} aria-hidden="true" /></a>
              <button type="button" className="button-secondary" onClick={onRestart}><RotateCcw size={15} aria-hidden="true" /> {t.results.restart}</button>
            </div>
            <div className="footer-meta"><span>Snowfox AI</span><span>{t.results.footerTagline}</span><span>snowfox-ai.com</span></div>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
