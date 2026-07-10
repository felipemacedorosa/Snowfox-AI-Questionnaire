"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Circle,
  Database,
  FileSearch,
  Gauge,
  ShieldAlert,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getPillarTier, PillarScore } from "@/app/data";
import {
  CriticalPathGate,
  NextLevelTarget,
  OpportunityTrack,
  PILLAR_TITLES,
  QuestionEvidence,
  RiskBand,
  RiskSignal,
} from "@/app/resultAnalysis";
import { InsightPillarId } from "@/app/resultInsights";

function ReportHeading({ number, title, aside }: { number: string; title: string; aside: string }) {
  return (
    <div className="report-section-heading">
      <div><span className="report-section-number">{number}</span><h2>{title}</h2></div>
      <span className="report-section-aside">{aside}</span>
    </div>
  );
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.42 },
};

function useReportReveal() {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? { initial: false as const } : reveal;
}

export function CriticalPathSection({ gates, nextLevel }: { gates: CriticalPathGate[]; nextLevel: NextLevelTarget }) {
  const revealMotion = useReportReveal();
  return (
    <motion.section className="report-section critical-path-section" id="critical-path" {...revealMotion}>
      <ReportHeading number="03" title="Prioridades para avançar" aside="O que fazer primeiro" />
      <div className="critical-path-summary">
        <div>
          <span className="report-label">Próximo nível</span>
          <strong>{nextLevel.label ?? "Prontidão avançada consolidada"}</strong>
        </div>
        {nextLevel.threshold !== null && (
          <p>Para chegar a esse nível, comece pelas prioridades abaixo. Elas mostram os principais pontos que precisam melhorar.</p>
        )}
      </div>
      <div className="critical-path-flow">
        {gates.map((gate, index) => (
          <article className={`critical-gate${gate.isBlocker ? " is-blocker" : ""}`} key={gate.id}>
            <div className="critical-gate-topline">
              <span>0{index + 1}</span>
              <strong>{gate.pillarTitle}</strong>
              {gate.isBlocker && <b>Bloqueio principal</b>}
            </div>
            <p className="critical-gate-question">{gate.question}</p>
            <div className="critical-gate-shift">
              <span><small>Estado atual</small>{gate.currentState}</span>
              <ArrowRight size={16} aria-hidden="true" />
              <span><small>O que precisa melhorar</small>{gate.targetState}</span>
            </div>
            <p className="critical-gate-reason">{gate.reason}</p>
            <div className="critical-gate-dependency"><span>Necessário antes</span>{gate.dependency}</div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

const RISK_BANDS: Array<{ id: RiskBand; label: string; description: string; icon: typeof ShieldAlert }> = [
  { id: "blocks-scale", label: "Bloqueia escala", description: "Sinais que limitam avanço confiável agora.", icon: ShieldAlert },
  { id: "weakens-delivery", label: "Enfraquece execução", description: "Riscos que reduzem adoção, velocidade ou valor.", icon: AlertTriangle },
  { id: "monitor", label: "Monitorar e preservar", description: "Forças e sinais que precisam continuar visíveis.", icon: Gauge },
];

export function RiskViewSection({ signals }: { signals: RiskSignal[] }) {
  const revealMotion = useReportReveal();
  return (
    <motion.section className="report-section risk-view-section" id="risks" {...revealMotion}>
      <ReportHeading number="04" title="Topologia de riscos" aside="Urgência sem falsa precisão" />
      <p className="report-section-intro">Os sinais são organizados pelo efeito sobre a capacidade de escalar, não por uma probabilidade inventada. Abra cada leitura para ver a evidência que a sustenta.</p>
      <div className="risk-lanes">
        {RISK_BANDS.map(band => {
          const Icon = band.icon;
          const items = signals.filter(signal => signal.band === band.id);
          return (
            <div className={`risk-lane risk-lane-${band.id}`} key={band.id}>
              <div className="risk-lane-heading">
                <Icon size={17} aria-hidden="true" />
                <div><strong>{band.label}</strong><span>{band.description}</span></div>
                <b>{items.length}</b>
              </div>
              <div className="risk-lane-items">
                {items.length === 0 && <p className="risk-empty">Nenhum sinal selecionado nesta faixa.</p>}
                {items.map(item => (
                  <details className="risk-item" key={item.id}>
                    <summary>
                      <span><small>{item.pillarTitle}</small><strong>{item.title}</strong></span>
                      <span className="risk-item-urgency">{item.urgency}</span>
                      <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    <div className="risk-item-body">
                      <p>{item.detail}</p>
                      {item.evidence.length > 0 && (
                        <div className="risk-evidence">
                          <span><FileSearch size={13} aria-hidden="true" /> Evidência utilizada</span>
                          {item.evidence.map((line, index) => <p key={index}>{line}</p>)}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function EvidenceList({ title, items, empty }: { title: string; items: QuestionEvidence[]; empty: string }) {
  return (
    <div className="pillar-evidence-group">
      <h3>{title}<span>{items.length}</span></h3>
      {items.length === 0 && <p className="pillar-evidence-empty">{empty}</p>}
      {items.map(item => (
        <article className={`pillar-evidence-row evidence-${item.kind}`} key={item.id}>
          <div className="pillar-evidence-meta">
            <span>{item.kind === "strength" ? <Check size={13} aria-hidden="true" /> : item.kind === "risk" ? <AlertTriangle size={13} aria-hidden="true" /> : <Circle size={11} aria-hidden="true" />}</span>
            {item.normalizedScore !== null && <b>{item.normalizedScore}%</b>}
          </div>
          <p>{item.question}</p>
          <strong>{item.answer}</strong>
          {item.targetState && item.kind !== "strength" && <small>Próxima capacidade: {item.targetState}</small>}
        </article>
      ))}
    </div>
  );
}

function PillarEvidencePanel({ pillar, score, evidence }: { pillar: InsightPillarId; score: number; evidence: QuestionEvidence[] }) {
  const tier = getPillarTier(score);
  const strengths = evidence
    .filter(item => item.kind === "strength")
    .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0))
    .slice(0, 3);
  const gaps = evidence
    .filter(item => item.kind === "gap" || item.kind === "risk")
    .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100))
    .slice(0, 4);
  const context = evidence.filter(item => item.kind === "context");

  return (
    <div className="pillar-evidence-panel">
      <div className="pillar-evidence-scoreline">
        <div><span className="report-label">{PILLAR_TITLES[pillar]}</span><strong>{score}%</strong></div>
        <div><span className={`level-tag level-${tier.key}`}>{tier.label}</span><div className="pillar-evidence-track"><span className={tier.barClass} style={{ width: `${score}%` }} /></div></div>
      </div>
      <div className={`pillar-evidence-columns${strengths.length === 0 ? " is-single" : ""}`}>
        {strengths.length > 0 && <EvidenceList title="Capacidades presentes" items={strengths} empty="Nenhuma força específica foi selecionada neste pilar." />}
        <EvidenceList title="Gaps prioritários" items={gaps} empty="Nenhum gap prioritário foi identificado neste pilar." />
      </div>
      {context.map(item => <div className="pillar-context" key={item.id}><span>Contexto fornecido</span><p>{item.answer}</p></div>)}
    </div>
  );
}

export function PillarDeepDiveSection({
  pillarScores,
  evidence,
  activePillarId,
  onSelect,
}: {
  pillarScores: PillarScore[];
  evidence: QuestionEvidence[];
  activePillarId: InsightPillarId;
  onSelect: (pillar: InsightPillarId) => void;
}) {
  const revealMotion = useReportReveal();
  const activeScore = pillarScores.find(pillar => pillar.id === activePillarId)?.score ?? 0;
  const activeEvidence = evidence.filter(item => item.pillar === activePillarId);

  return (
    <motion.section className="report-section pillar-deep-dive-section" id="pillars" {...revealMotion}>
      <ReportHeading number="05" title="Diagnóstico por dimensão" aside="Das respostas às capacidades" />
      <div className="pillar-deep-dive-layout screen-only">
        <div className="pillar-deep-tabs" role="tablist" aria-label="Dimensões do diagnóstico">
          {pillarScores.map((pillar, index) => {
            const id = pillar.id as InsightPillarId;
            return (
              <button key={id} type="button" role="tab" aria-selected={id === activePillarId} className={id === activePillarId ? "is-active" : ""} onClick={() => onSelect(id)}>
                <span>0{index + 1}</span><strong>{pillar.title}</strong><b>{pillar.score}%</b>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" aria-live="polite">
          <PillarEvidencePanel pillar={activePillarId} score={activeScore} evidence={activeEvidence} />
        </div>
      </div>
      <div className="pillar-print-list print-only">
        {pillarScores.map(pillar => (
          <PillarEvidencePanel key={pillar.id} pillar={pillar.id as InsightPillarId} score={pillar.score} evidence={evidence.filter(item => item.pillar === pillar.id)} />
        ))}
      </div>
    </motion.section>
  );
}

const OPPORTUNITY_ICONS = {
  "data-foundation": Database,
  "automation-agents": Bot,
  "predictive-agents": BrainCircuit,
};

export function OpportunityLibrarySection({ tracks }: { tracks: OpportunityTrack[] }) {
  const revealMotion = useReportReveal();
  return (
    <motion.section className="report-section opportunity-section" id="opportunities" {...revealMotion}>
      <ReportHeading number="06" title="Biblioteca de oportunidades" aside="Hipóteses para validar" />
      <p className="report-section-intro"><strong>Data Foundation é a solução recomendada e pode começar imediatamente, independentemente do nível atual de prontidão.</strong> Automation Agents e Predictive Agents continuam condicionados às capacidades necessárias para operar com segurança e valor.</p>
      <div className="opportunity-tracks">
        {tracks.map(track => {
          const Icon = OPPORTUNITY_ICONS[track.id];
          const isDataFoundation = track.id === "data-foundation";
          return (
            <article className={`opportunity-track opportunity-${track.status} opportunity-track-${track.id}`} key={track.id}>
              <div className="opportunity-track-heading">
                <Icon size={19} aria-hidden="true" />
                <div><strong>{track.title}</strong><span>{track.subtitle}</span></div>
                <b>{track.statusLabel}</b>
              </div>
              <p className="opportunity-summary">{track.summary}</p>
              <div className="opportunity-track-body">
                <div><span className="report-label">Exemplos</span><ul>{track.examples.map(example => <li key={example}>{example}</li>)}</ul></div>
                {track.prerequisites.length > 0 && <div><span className="report-label">Pré-requisitos observados</span><ul className="opportunity-checks">{track.prerequisites.map(item => <li key={item.label} className={item.met ? "is-met" : ""}>{item.met ? <Check size={13} aria-hidden="true" /> : <Circle size={11} aria-hidden="true" />}{item.label}</li>)}</ul></div>}
                {isDataFoundation && <div className="data-foundation-entry"><Check size={14} aria-hidden="true" /><span><b>Entrada imediata</b>Sem requisitos prévios de maturidade, tecnologia ou governança.</span></div>}
              </div>
              <div className="opportunity-start"><Target size={15} aria-hidden="true" /><span><b>Primeiro movimento</b>{track.startAction}</span></div>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
