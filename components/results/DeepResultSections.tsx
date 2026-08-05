"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  FileSearch,
  Gauge,
  ShieldAlert,
  Star,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/app/LanguageContext";
import {
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
  const hiddenCount = Math.max(0, items.length - RISK_LANE_PAGE_SIZE);

  if (items.length === 0) return <p className="risk-empty">{emptyText}</p>;

  return (
    <>
      {items.map((item, index) => {
        // Items past the fold stay in the DOM but are hidden on screen until
        // "see more" is clicked; the PDF export reveals them all (globals.css).
        const isOverflow = index >= RISK_LANE_PAGE_SIZE;
        const hiddenOnScreen = isOverflow && !expanded;
        return (
          <details className={`risk-item${hiddenOnScreen ? " risk-item-overflow" : ""}`} key={item.id}>
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
                  {item.evidence.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}
            </div>
          </details>
        );
      })}
      {hiddenCount > 0 && !expanded && (
        <button type="button" className="risk-lane-toggle no-print" onClick={() => setExpanded(true)}>
          {t.deepSections.seeMore(hiddenCount)}
        </button>
      )}
      {expanded && items.length > RISK_LANE_PAGE_SIZE && (
        <button type="button" className="risk-lane-toggle no-print" onClick={() => setExpanded(false)}>
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
      <ReportHeading number="02" title={t.deepSections.riskHeading} />
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
  const scalingPortfolio = tracks.some(track => track.isFeatured);
  return (
    <motion.section className="report-section opportunity-section" id="opportunities" {...revealMotion}>
      <ReportHeading number="03" title={t.deepSections.opportunityHeading} />
      <p className="report-section-intro">
        <strong>{scalingPortfolio ? t.deepSections.opportunityIntroMaintainStrong : t.deepSections.opportunityIntroStrong}</strong>{" "}
        {scalingPortfolio ? t.deepSections.opportunityIntroMaintainRest : t.deepSections.opportunityIntroRest}
      </p>
      <div className="opportunity-tracks">
        {tracks.map(track => {
          const Icon = OPPORTUNITY_ICONS[track.id];
          const isDataFoundation = track.id === "data-foundation";
          const isSnowfoxPick = track.isFeatured;
          const isHighlighted = track.isFeatured;
          return (
            <article className={`opportunity-track opportunity-${track.status} opportunity-track-${track.id}${isHighlighted ? " opportunity-track-highlighted" : ""}`} key={track.id}>
              <div className="opportunity-track-heading">
                <Icon size={19} aria-hidden="true" />
                <div><strong>{track.title}</strong><span>{track.subtitle}</span></div>
                <b>{track.statusLabel}</b>
              </div>
              {isSnowfoxPick && <div className="opportunity-snowfox-pick"><Star size={12} aria-hidden="true" /><span>{t.deepSections.snowfoxPickLabel}</span></div>}
              <p className="opportunity-summary">{track.summary}</p>
              <div className="opportunity-track-body">
                <div><span className="report-label">{t.deepSections.examples}</span><ul>{track.examples.map(example => <li key={example}>{example}</li>)}</ul></div>
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
