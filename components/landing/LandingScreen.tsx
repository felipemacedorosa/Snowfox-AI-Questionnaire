"use client";

import { useState } from "react";
import { ArrowRight, Clock3, Compass, FileText, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { InsightPillarId } from "@/app/resultInsights";
import { getPillarConfig, getSections } from "@/app/data";
import { useLanguage } from "@/app/LanguageContext";
import { ReadinessNetwork } from "@/components/ui/ReadinessNetwork";

const PILLAR_DETAILS = [
  { id: "dados" as const, description: { pt: "Qualidade, acesso e histórico para decisões confiáveis.", en: "Quality, access, and history for reliable decisions." }, marker: "01" },
  { id: "estrategia" as const, description: { pt: "Prioridade executiva, casos de uso e valor mensurável.", en: "Executive priority, use cases, and measurable value." }, marker: "02" },
  { id: "pessoas" as const, description: { pt: "Capacidade, adoção e disposição para mudar o trabalho.", en: "Capacity, adoption, and willingness to change how work gets done." }, marker: "03" },
  { id: "governanca" as const, description: { pt: "Responsabilidades, segurança e operação responsável.", en: "Responsibilities, security, and responsible operation." }, marker: "04" },
  { id: "tecnologia" as const, description: { pt: "Integrações, produção, monitoramento e escala.", en: "Integrations, production, monitoring, and scale." }, marker: "05" },
];

export function LandingScreen({
  hasDraft,
  savedScreen,
  savedSection,
  onStart,
  onResume,
  onReset,
}: {
  hasDraft: boolean;
  savedScreen: "quiz" | "results" | null;
  savedSection: number;
  onStart: () => void;
  onResume: () => void;
  onReset: () => void;
}) {
  const { lang, t } = useLanguage();
  const sections = getSections(lang);
  const pillarConfig = getPillarConfig(lang);
  const savedSectionTitle = sections[savedSection]?.title ?? t.landing.fallbackSectionTitle;
  const [activePillarId, setActivePillarId] = useState<InsightPillarId>("estrategia");

  return (
    <div className="landing-page" id="landing-top">
      <section className="landing-hero page-frame">
        <motion.div
          className="landing-copy"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-kicker"><span className="kicker-line" /> {t.landing.kicker}</div>
          <h1>{t.landing.title}</h1>
          <p className="landing-lede">
            {t.landing.lede}
          </p>
          <div className="landing-actions">
            <motion.button type="button" className="button-primary button-large" onClick={hasDraft ? onResume : onStart} whileTap={{ scale: 0.98 }}>
              {hasDraft ? t.landing.continueAssessment : t.landing.startAssessment}
              <ArrowRight size={17} aria-hidden="true" />
            </motion.button>
            {hasDraft && (
              <button type="button" className="button-secondary" onClick={onStart}>
                <RotateCcw size={15} aria-hidden="true" />
                {t.landing.startOver}
              </button>
            )}
          </div>
          <div className="landing-proof-row" aria-label={t.landing.proofAriaLabel}>
            <span><Clock3 size={15} aria-hidden="true" /> {t.landing.proofDuration}</span>
            <span><Compass size={15} aria-hidden="true" /> {t.landing.proofDimensions}</span>
            <span><FileText size={15} aria-hidden="true" /> {t.landing.proofReport}</span>
          </div>
        </motion.div>

        <motion.div
          className="landing-network-shell"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          aria-label={t.landing.previewAriaLabel}
        >
          <div className="landing-network-topline">
            <span>{t.landing.readinessMap}</span>
            <strong>{t.landing.readinessMapSub}</strong>
          </div>
          <ReadinessNetwork mode="preview" activePillarId={activePillarId} onActivePillarChange={setActivePillarId} />
        </motion.div>
      </section>

      {hasDraft && (
        <section className="resume-strip page-frame" aria-label={t.landing.draftAriaLabel}>
          <div className="resume-strip-icon"><Sparkles size={18} aria-hidden="true" /></div>
          <div>
            <strong>{savedScreen === "results" ? t.landing.draftReportReady : t.landing.draftStoppedAt(savedSectionTitle)}</strong>
            <span>{savedScreen === "results" ? t.landing.draftResumeReport : t.landing.draftResumeQuiz}</span>
          </div>
          <button type="button" className="button-quiet" onClick={onResume}>
            {savedScreen === "results" ? t.landing.viewReport : t.landing.resume} <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button icon-button-muted" onClick={onReset} aria-label={t.landing.deleteDraftLabel} title={t.landing.deleteDraftLabel}>
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </section>
      )}

      <section className="landing-method-band" id="how-it-works">
        <div className="landing-method page-frame">
          <div className="method-intro">
            <div className="section-kicker"><span className="kicker-line" /> {t.landing.howItWorksKicker}</div>
            <h2>{t.landing.howItWorksTitle}</h2>
            <p>{t.landing.howItWorksLede}</p>
          </div>
          <div className="method-steps">
            <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <span>01</span>
              <div><strong>{t.landing.step1Title}</strong><p>{t.landing.step1Desc}</p></div>
            </motion.div>
            <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <span>02</span>
              <div><strong>{t.landing.step2Title}</strong><p>{t.landing.step2Desc}</p></div>
            </motion.div>
            <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <span>03</span>
              <div><strong>{t.landing.step3Title}</strong><p>{t.landing.step3Desc}</p></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="landing-dimensions page-frame" id="landing-dimensions">
        <div className="dimensions-heading">
          <div>
            <div className="section-kicker"><span className="kicker-line" /> {t.landing.dimensionsKicker}</div>
            <h2>{t.landing.dimensionsTitle}</h2>
          </div>
          <p>{t.landing.dimensionsLede}</p>
        </div>
        <div className="dimension-grid">
          {PILLAR_DETAILS.map((pillar, index) => {
            const config = pillarConfig[index];
            return (
              <motion.button type="button" className="dimension-item" key={pillar.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} onClick={() => {
                setActivePillarId(pillar.id);
                document.getElementById("landing-top")?.scrollIntoView({ behavior: "smooth" });
              }}>
                <span className="dimension-index">{pillar.marker}</span>
                <div className="dimension-copy">
                  <strong>{config.title}</strong>
                  <span>{pillar.description[lang]}</span>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </motion.button>
            );
          })}
        </div>
      </section>

      <motion.section className="landing-final page-frame" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        <div className="landing-final-mark"><ShieldCheck size={20} aria-hidden="true" /></div>
        <div>
          <h2>{t.landing.finalTitle}</h2>
          <p>{t.landing.finalLede}</p>
        </div>
        <button type="button" className="button-primary" onClick={hasDraft ? onResume : onStart}>
          {hasDraft ? t.landing.finalContinue : t.landing.finalStart}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </motion.section>
    </div>
  );
}
