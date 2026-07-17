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
import { useLanguage } from "@/app/LanguageContext";
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
  const { t } = useLanguage();
  return (
    <motion.section className="report-section critical-path-section" id="critical-path" {...revealMotion}>
      <ReportHeading number="03" title={t.deepSections.criticalPathHeading} />
      <div className="critical-path-summary">
        <div>
          <span className="report-label">{t.deepSections.nextLevelLabel}</span>
          <strong>{nextLevel.label ?? t.deepSections.nextLevelConsolidated}</strong>
        </div>
        {nextLevel.threshold !== null && (
          <p>{t.deepSections.nextLevelHint}</p>
        )}
      </div>
      {gates.length === 0 ? (
        <p className="report-section-intro">{t.deepSections.noGates}</p>
      ) : (
      <div className="critical-path-flow">
        {gates.map((gate, index) => (
          <article className={`critical-gate${gate.isBlocker ? " is-blocker" : ""}`} key={gate.id}>
            <div className="critical-gate-topline">
              <span>0{index + 1}</span>
              <strong>{gate.pillarTitle}</strong>
              {gate.isBlocker && <b>{t.deepSections.mainBlocker}</b>}
            </div>
            <p className="critical-gate-question">{gate.question}</p>
            <div className="critical-gate-shift">
              <span><small>{t.deepSections.currentState}</small>{gate.currentState}</span>
              <ArrowRight size={16} aria-hidden="true" />
              <span><small>{t.deepSections.targetState}</small>{gate.targetState}</span>
            </div>
            <p className="critical-gate-reason">{gate.reason}</p>
            <div className="critical-gate-dependency"><span>{t.deepSections.requiredBefore}</span>{gate.dependency}</div>
          </article>
        ))}
      </div>
      )}
    </motion.section>
  );
}

const RISK_LANE_PAGE_SIZE = 5;

function useRiskBands() {
  const { t } = useLanguage();
  return [
    { id: "blocks-scale" as const, label: t.deepSections.riskBandBlocksScale, description: t.deepSections.riskBandBlocksScaleDesc, icon: ShieldAlert },
    { id: "weakens-delivery" as const, label: t.deepSections.riskBandWeakensDelivery, description: t.deepSections.riskBandWeakensDeliveryDesc, icon: AlertTriangle },
    { id: "monitor" as const, label: t.deepSections.riskBandMonitor, description: t.deepSections.riskBandMonitorDesc, icon: Gauge },
  ];
}

function RiskLaneItems({ items, emptyText }: { items: RiskSignal[]; emptyText: string }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, RISK_LANE_PAGE_SIZE);
  const hiddenCount = items.length - visibleItems.length;

  if (items.length === 0) return <p className="risk-empty">{emptyText}</p>;

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
                <span><FileSearch size={13} aria-hidden="true" /> {t.deepSections.evidenceUsed}</span>
                {item.evidence.map((line, index) => <p key={index}>{line}</p>)}
              </div>
            )}
          </div>
        </details>
      ))}
      {hiddenCount > 0 && (
        <button type="button" className="risk-lane-toggle" onClick={() => setExpanded(true)}>
          {t.deepSections.seeMore(hiddenCount)}
        </button>
      )}
      {expanded && items.length > RISK_LANE_PAGE_SIZE && (
        <button type="button" className="risk-lane-toggle" onClick={() => setExpanded(false)}>
          {t.deepSections.seeLess}
        </button>
      )}
    </>
  );
}

export function RiskViewSection({ signals }: { signals: RiskSignal[] }) {
  const revealMotion = useReportReveal();
  const { t } = useLanguage();
  const riskBands = useRiskBands();
  const emptyText: Record<RiskBand, string> = {
    "blocks-scale": t.deepSections.riskBandBlocksScaleEmpty,
    "weakens-delivery": t.deepSections.riskBandWeakensDeliveryEmpty,
    monitor: t.deepSections.riskBandMonitorEmpty,
  };
  return (
    <motion.section className="report-section risk-view-section" id="risks" {...revealMotion}>
      <ReportHeading number="04" title={t.deepSections.riskHeading} />
      <p className="report-section-intro">{t.deepSections.riskIntro}</p>
      <div className="risk-lanes">
        {riskBands.map(band => {
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
                <RiskLaneItems items={items} emptyText={emptyText[band.id]} />
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
  const { t } = useLanguage();
  return (
    <motion.section className="report-section opportunity-section" id="opportunities" {...revealMotion}>
      <ReportHeading number="05" title={t.deepSections.opportunityHeading} />
      <p className="report-section-intro"><strong>{t.deepSections.opportunityIntroStrong}</strong> {t.deepSections.opportunityIntroRest}</p>
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
                <div><span className="report-label">{t.deepSections.examples}</span><ul>{track.examples.map(example => <li key={example}>{example}</li>)}</ul></div>
                {track.prerequisites.length > 0 && <div><span className="report-label">{t.deepSections.observedPrerequisites}</span><ul className="opportunity-checks">{track.prerequisites.map(item => <li key={item.label} className={item.met ? "is-met" : ""}>{item.met ? <Check size={13} aria-hidden="true" /> : <Circle size={11} aria-hidden="true" />}{item.label}</li>)}</ul></div>}
                {isDataFoundation && <div className="data-foundation-entry"><Check size={14} aria-hidden="true" /><span><b>{t.deepSections.immediateEntry}</b>{t.deepSections.immediateEntryDesc}</span></div>}
              </div>
              <div className="opportunity-start"><Target size={15} aria-hidden="true" /><span><b>{t.deepSections.firstMove}</b>{track.startAction}</span></div>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
