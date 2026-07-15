"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Database,
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
  LEVEL_META,
} from "@/app/data";
import {
  buildQuestionEvidence,
  getCriticalPath,
  getNextLevelTarget,
  getOpportunityTracks,
  getReadinessProfile,
  getRiskSignals,
} from "@/app/resultAnalysis";
import {
  buildExecutiveSummary,
  buildQuarterlyRecommendations,
  InsightPillarId,
  isWeakPillarScore,
  QuarterlyRecommendation,
} from "@/app/resultInsights";
import {
  CriticalPathSection,
  OpportunityLibrarySection,
  PillarDeepDiveSection,
  RiskViewSection,
} from "@/components/results/DeepResultSections";
import { ReportChapter, ReportNavigation } from "@/components/results/ReportNavigation";
import { ReadinessNetwork } from "@/components/ui/ReadinessNetwork";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL ?? "https://snowfox-ai.com";

const REPORT_CHAPTERS: ReportChapter[] = [
  { id: "summary", number: "01", label: "Resumo" },
  { id: "system-map", number: "02", label: "Sistema" },
  { id: "critical-path", number: "03", label: "Caminho crítico" },
  { id: "risks", number: "04", label: "Riscos" },
  { id: "pillars", number: "05", label: "Dimensões" },
  { id: "opportunities", number: "06", label: "Oportunidades" },
  { id: "action-plan", number: "07", label: "Plano de ação" },
];

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.14 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function RoadmapDetailContent({ item }: { item: QuarterlyRecommendation }) {
  return (
    <>
      <div className="roadmap-action-copy"><p>{item.action}</p><p><strong>Resultado esperado:</strong> {item.outcome}.</p></div>
      <dl className="roadmap-action-meta">
        <div><dt>Responsável sugerido</dt><dd>{item.ownerRole}</dd></div>
        <div><dt>Esforço</dt><dd>{item.effort}</dd></div>
        <div><dt>Dependência</dt><dd>{item.dependency}</dd></div>
        <div><dt>Medida de sucesso</dt><dd>{item.successMetric}</dd></div>
      </dl>
    </>
  );
}

export function ResultsScreen({ answers, onRestart }: { answers: AnswerRecord; onRestart: () => void }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [activePillarId, setActivePillarId] = useState<InsightPillarId | "">("");
  const [expandedRoadmap, setExpandedRoadmap] = useState("q1");
  const prefersReducedMotion = useReducedMotion();
  const revealMotion = prefersReducedMotion ? { initial: false as const } : reveal;

  const pillarScores = useMemo(() => calculatePillarScores(answers), [answers]);
  const overallScore = useMemo(() => calculateOverallScore(answers), [answers]);
  const result = useMemo(() => applyBlockerRules(overallScore, pillarScores), [overallScore, pillarScores]);
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const selectedPillarId = activePillarId || weakest.id as InsightPillarId;
  const meta = LEVEL_META[result.level];
  const executiveSummary = useMemo(
    () => buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest }),
    [answers, pillarScores, result, strongest, weakest]
  );
  const quarterlyRecommendations = useMemo(
    () => buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest }),
    [answers, pillarScores, result, strongest, weakest]
  );
  const evidence = useMemo(() => buildQuestionEvidence(answers), [answers]);
  const profile = useMemo(() => getReadinessProfile(pillarScores, result), [pillarScores, result]);
  const criticalPath = useMemo(() => getCriticalPath(answers, pillarScores, result), [answers, pillarScores, result]);
  const nextLevel = useMemo(() => getNextLevelTarget(result), [result]);
  const riskSignals = useMemo(() => getRiskSignals(answers, pillarScores), [answers, pillarScores]);
  const opportunityTracks = useMemo(() => getOpportunityTracks(answers, pillarScores), [answers, pillarScores]);
  const dateStr = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()),
    []
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
                <span>Relatório personalizado · {dateStr}</span>
                <button type="button" className="hero-tool-button" onClick={() => window.print()} title="Exportar relatório em PDF">
                  <Download size={15} aria-hidden="true" /> <span>Exportar PDF</span>
                </button>
              </div>
            </motion.div>

            <div className="results-hero-grid">
              <motion.div className="score-column" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.42 }}>
                <span className="section-kicker section-kicker-light"><span className="kicker-line" /> Leitura de prontidão</span>
                <div className="score-value"><span>{displayScore}</span><small>/100</small></div>
                <div className="score-track" role="progressbar" aria-label={`Pontuação de ${overallScore} em 100`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallScore}><span style={{ width: `${overallScore}%` }} /></div>
                <div className="score-meta"><span className={`level-tag level-${meta.key}`}>{result.level}</span><span>{dateStr}</span></div>
              </motion.div>
              <motion.div className="results-hero-reading" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.42 }}>
                <span className="results-profile-label">Perfil de prontidão</span>
                <h1>{profile.title}</h1>
                <p className="results-hero-summary">{profile.summary}</p>
                <p className="results-profile-implication">{profile.implication}</p>
                {result.blocker && <div className="blocker-note"><TrendingDown size={16} aria-hidden="true" /><span>{result.blocker}</span></div>}
              </motion.div>
            </div>
          </motion.section>

          <motion.section className="report-section executive-section" id="summary" {...revealMotion}>
            <div className="report-section-heading">
              <div><span className="report-section-number">01</span><h2>Resumo executivo</h2></div>
            </div>
            <div className="executive-grid">
              <article className="executive-lead">
                <span className="report-label">Situação atual</span>
                <p className="executive-lead-copy">{executiveSummary.currentSituation[0]}</p>
                <p>{executiveSummary.currentSituation[1]}</p>
                <p>{executiveSummary.currentSituation[2]}</p>
              </article>
              <article className="executive-block executive-risk-block">
                <span className="report-label">Principais riscos</span>
                <ul>{executiveSummary.risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul>
              </article>
              <article className="executive-block">
                <span className="report-label">Maior oportunidade</span>
                {executiveSummary.opportunity.map((line, index) => <p key={index}>{line}</p>)}
              </article>
              <article className="executive-block executive-recommendation-block executive-data-foundation">
                <Database size={22} aria-hidden="true" />
                <div>
                  <span className="report-label">O que a Snowfox recomenda</span>
                  <h3>Data Foundation</h3>
                  {executiveSummary.immediateRecommendation.map((line, index) => <p key={index}>{line}</p>)}
                </div>
                <div className="solution-availability"><strong>Começar agora</strong><span>Sem pré-requisitos</span></div>
              </article>
            </div>
          </motion.section>

          <motion.section className="report-section readiness-map-section" id="system-map" {...revealMotion}>
            <div className="report-section-heading">
              <div><span className="report-section-number">02</span><h2>Mapa do sistema</h2></div>
            </div>
            <div className="readiness-map-layout">
              <ReadinessNetwork
                mode="scored"
                scores={pillarScores}
                activePillarId={selectedPillarId}
                onActivePillarChange={setActivePillarId}
              />
              <aside className="readiness-map-reading">
                <span className="report-label">Como ler o sistema</span>
                <h3>{profile.title}</h3>
                <p>{profile.implication}</p>
                <div className="readiness-map-signals">
                  {strongest.score === weakest.score ? (
                    <div><span>Nível consolidado</span><strong>Todos os pilares</strong><b>{strongest.score}%</b></div>
                  ) : (
                    <>
                      <div><span>Maior força</span><strong>{strongest.title}</strong><b>{strongest.score}%</b></div>
                      <div><span>{isWeakPillarScore(weakest.score) ? "Principal limitador" : "Espaço para evoluir"}</span><strong>{weakest.title}</strong><b>{weakest.score}%</b></div>
                    </>
                  )}
                </div>
                <p className="readiness-map-note">Linhas destacadas mostram relações tocadas pela dimensão selecionada. Conexões em alerta passam por capacidades abaixo de 40%.</p>
              </aside>
            </div>
          </motion.section>

          <CriticalPathSection gates={criticalPath} nextLevel={nextLevel} />
          <RiskViewSection signals={riskSignals} />
          <PillarDeepDiveSection pillarScores={pillarScores} evidence={evidence} activePillarId={selectedPillarId} onSelect={setActivePillarId} />
          <OpportunityLibrarySection tracks={opportunityTracks} />

          <motion.section className="report-section roadmap-section" id="action-plan" {...revealMotion}>
            <div className="report-section-heading">
              <div><span className="report-section-number">07</span><h2>Plano de ação</h2></div>
            </div>
            <p className="report-section-intro">A ordem reduz dependências antes de ampliar investimento. Os papéis e métricas são referências para estruturar a conversa interna.</p>
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

          <motion.footer className="results-footer no-print" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.42 }}>
            <div className="footer-cta-copy"><span className="section-kicker"><span className="kicker-line" /> Próxima conversa</span><h2>Transforme a leitura em uma agenda de IA concreta.</h2><p>Leve este diagnóstico para uma conversa com quem pode ajudar sua organização a decidir o que preparar, testar e escalar.</p></div>
            <div className="footer-actions">
              <a className="button-primary button-large" href={CONTACT_URL} target="_blank" rel="noreferrer">Falar com um especialista <ExternalLink size={16} aria-hidden="true" /></a>
              <button type="button" className="button-secondary" onClick={onRestart}><RotateCcw size={15} aria-hidden="true" /> Refazer avaliação</button>
            </div>
            <div className="footer-meta"><span>Snowfox AI</span><span>Diagnóstico de prontidão para IA</span><span>snowfox-ai.com</span></div>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
