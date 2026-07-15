"use client";

import { useState } from "react";
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
import {
  CriticalPathGate,
  NextLevelTarget,
  OpportunityTrack,
  RiskBand,
  RiskSignal,
} from "@/app/resultAnalysis";

function ReportHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="report-section-heading">
      <div><span className="report-section-number">{number}</span><h2>{title}</h2></div>
    </div>
  );
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function useReportReveal() {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? { initial: false as const } : reveal;
}

export function CriticalPathSection({ gates, nextLevel }: { gates: CriticalPathGate[]; nextLevel: NextLevelTarget }) {
  const revealMotion = useReportReveal();
  return (
    <motion.section className="report-section critical-path-section" id="critical-path" {...revealMotion}>
      <ReportHeading number="04" title="Prioridades para avançar" />
      <div className="critical-path-summary">
        <div>
          <span className="report-label">Próximo nível</span>
          <strong>{nextLevel.label ?? "Prontidão avançada consolidada"}</strong>
        </div>
        {nextLevel.threshold !== null && (
          <p>Para chegar a esse nível, comece pelas prioridades abaixo. Elas mostram os principais pontos que precisam melhorar.</p>
        )}
      </div>
      {gates.length === 0 ? (
        <p className="report-section-intro">Nenhuma resposta ficou abaixo de metade da pontuação possível. Não há gates críticos a destravar agora.</p>
      ) : (
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
      )}
    </motion.section>
  );
}

const RISK_BANDS: Array<{ id: RiskBand; label: string; description: string; icon: typeof ShieldAlert }> = [
  { id: "blocks-scale", label: "Bloqueia escala", description: "Sinais que limitam avanço confiável agora.", icon: ShieldAlert },
  { id: "weakens-delivery", label: "Enfraquece execução", description: "Riscos que reduzem adoção, velocidade ou valor.", icon: AlertTriangle },
  { id: "monitor", label: "Monitorar e preservar", description: "Forças e sinais que precisam continuar visíveis.", icon: Gauge },
];

const RISK_LANE_PAGE_SIZE = 5;

const RISK_BAND_EMPTY_TEXT: Record<RiskBand, string> = {
  "blocks-scale": "Com base nas respostas, nenhum sinal bloqueia a escala no momento.",
  "weakens-delivery": "Com base nas respostas, nenhum sinal reduz adoção, velocidade ou valor no momento.",
  monitor: "Com base nas respostas, não há força ou sinal deste tipo para monitorar agora.",
};

function RiskLaneItems({ items, band }: { items: RiskSignal[]; band: RiskBand }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, RISK_LANE_PAGE_SIZE);
  const hiddenCount = items.length - visibleItems.length;

  if (items.length === 0) return <p className="risk-empty">{RISK_BAND_EMPTY_TEXT[band]}</p>;

  return (
    <>
      {visibleItems.map(item => (
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
      {hiddenCount > 0 && (
        <button type="button" className="risk-lane-toggle" onClick={() => setExpanded(true)}>
          Ver mais ({hiddenCount})
        </button>
      )}
      {expanded && items.length > RISK_LANE_PAGE_SIZE && (
        <button type="button" className="risk-lane-toggle" onClick={() => setExpanded(false)}>
          Ver menos
        </button>
      )}
    </>
  );
}

export function RiskViewSection({ signals }: { signals: RiskSignal[] }) {
  const revealMotion = useReportReveal();
  return (
    <motion.section className="report-section risk-view-section" id="risks" {...revealMotion}>
      <ReportHeading number="05" title="Topologia de riscos" />
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
                <RiskLaneItems items={items} band={band.id} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

export const OPPORTUNITY_ICONS = {
  "data-foundation": Database,
  "automation-agents": Bot,
  "predictive-agents": BrainCircuit,
};

export function OpportunityLibrarySection({ tracks }: { tracks: OpportunityTrack[] }) {
  const revealMotion = useReportReveal();
  return (
    <motion.section className="report-section opportunity-section" id="opportunities" {...revealMotion}>
      <ReportHeading number="06" title="Biblioteca de oportunidades" />
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
