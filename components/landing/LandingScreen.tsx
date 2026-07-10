"use client";

import { useState } from "react";
import { ArrowRight, Clock3, Compass, FileText, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { InsightPillarId } from "@/app/resultInsights";
import { PILLAR_CONFIG, SECTIONS } from "@/app/data";
import { ReadinessNetwork } from "@/components/ui/ReadinessNetwork";

const PILLAR_DETAILS = [
  { id: "dados" as const, label: "Dados", description: "Qualidade, acesso e histórico para decisões confiáveis.", marker: "01" },
  { id: "estrategia" as const, label: "Estratégia", description: "Prioridade executiva, casos de uso e valor mensurável.", marker: "02" },
  { id: "pessoas" as const, label: "Pessoas e Cultura", description: "Capacidade, adoção e disposição para mudar o trabalho.", marker: "03" },
  { id: "governanca" as const, label: "Governança e Processo", description: "Responsabilidades, segurança e operação responsável.", marker: "04" },
  { id: "tecnologia" as const, label: "Tecnologia", description: "Integrações, produção, monitoramento e escala.", marker: "05" },
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
  const savedSectionTitle = SECTIONS[savedSection]?.title ?? "Avaliação";
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
          <div className="section-kicker"><span className="kicker-line" /> Snowfox AI · Diagnóstico executivo</div>
          <h1>Diagnóstico de prontidão para IA.</h1>
          <p className="landing-lede">
            Enxergue como estratégia, dados, pessoas, governança e tecnologia se conectam e transforme respostas dispersas em uma agenda de decisão concreta.
          </p>
          <div className="landing-actions">
            <motion.button type="button" className="button-primary button-large" onClick={hasDraft ? onResume : onStart} whileTap={{ scale: 0.98 }}>
              {hasDraft ? "Continuar avaliação" : "Começar avaliação"}
              <ArrowRight size={17} aria-hidden="true" />
            </motion.button>
            {hasDraft && (
              <button type="button" className="button-secondary" onClick={onStart}>
                <RotateCcw size={15} aria-hidden="true" />
                Começar de novo
              </button>
            )}
          </div>
          <div className="landing-proof-row" aria-label="Características da avaliação">
            <span><Clock3 size={15} aria-hidden="true" /> 15 min</span>
            <span><Compass size={15} aria-hidden="true" /> 5 dimensões</span>
            <span><FileText size={15} aria-hidden="true" /> Relatório executivo</span>
          </div>
        </motion.div>

        <motion.div
          className="landing-network-shell"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Prévia da avaliação em cinco dimensões"
        >
          <div className="landing-network-topline">
            <span>Mapa de prontidão</span>
            <strong>cinco capacidades, um sistema</strong>
          </div>
          <ReadinessNetwork mode="preview" activePillarId={activePillarId} onActivePillarChange={setActivePillarId} />
        </motion.div>
      </section>

      {hasDraft && (
        <section className="resume-strip page-frame" aria-label="Avaliação salva">
          <div className="resume-strip-icon"><Sparkles size={18} aria-hidden="true" /></div>
          <div>
            <strong>{savedScreen === "results" ? "Seu relatório está pronto." : `Você parou em ${savedSectionTitle}.`}</strong>
            <span>{savedScreen === "results" ? "Retome a leitura de prontidão de onde deixou." : "A avaliação fica salva neste dispositivo para você continuar quando quiser."}</span>
          </div>
          <button type="button" className="button-quiet" onClick={onResume}>
            {savedScreen === "results" ? "Ver relatório" : "Retomar"} <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button icon-button-muted" onClick={onReset} aria-label="Excluir avaliação salva" title="Excluir avaliação salva">
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </section>
      )}

      <section className="landing-method-band" id="how-it-works">
        <div className="landing-method page-frame">
          <div className="method-intro">
            <div className="section-kicker"><span className="kicker-line" /> Como funciona</div>
            <h2>Da percepção ao próximo passo.</h2>
            <p>O diagnóstico organiza a conversa antes que a organização invista em mais uma iniciativa isolada.</p>
          </div>
          <div className="method-steps">
            <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.35 }}>
              <span>01</span>
              <div><strong>Responda com contexto</strong><p>As perguntas foram desenhadas para refletir decisões, não apenas ferramentas.</p></div>
            </motion.div>
            <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.08, duration: 0.35 }}>
              <span>02</span>
              <div><strong>Enxergue o sistema</strong><p>Dados, estratégia, pessoas, governança e tecnologia aparecem em conjunto.</p></div>
            </motion.div>
            <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.16, duration: 0.35 }}>
              <span>03</span>
              <div><strong>Saia com uma agenda</strong><p>O resultado destaca riscos, alavancas e uma sequência de ação para os próximos trimestres.</p></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="landing-dimensions page-frame" id="landing-dimensions">
        <div className="dimensions-heading">
          <div>
            <div className="section-kicker"><span className="kicker-line" /> As cinco dimensões</div>
            <h2>Prontidão é um sistema, não uma pontuação isolada.</h2>
          </div>
          <p>Explore as lentes que estruturam a conversa e revelam onde a organização pode avançar com mais segurança.</p>
        </div>
        <div className="dimension-grid">
          {PILLAR_DETAILS.map((pillar, index) => {
            const config = PILLAR_CONFIG[index];
            return (
              <motion.button type="button" className="dimension-item" key={pillar.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ delay: index * 0.06, duration: 0.35 }} onClick={() => {
                setActivePillarId(pillar.id);
                document.getElementById("landing-top")?.scrollIntoView({ behavior: "smooth" });
              }}>
                <span className="dimension-index">{pillar.marker}</span>
                <div className="dimension-copy">
                  <strong>{config.title}</strong>
                  <span>{pillar.description}</span>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </motion.button>
            );
          })}
        </div>
      </section>

      <motion.section className="landing-final page-frame" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.4 }}>
        <div className="landing-final-mark"><ShieldCheck size={20} aria-hidden="true" /></div>
        <div>
          <h2>Uma conversa melhor começa com uma pergunta melhor.</h2>
          <p>O diagnóstico é privado, sem login, e pode ser retomado neste dispositivo.</p>
        </div>
        <button type="button" className="button-primary" onClick={hasDraft ? onResume : onStart}>
          {hasDraft ? "Continuar" : "Iniciar agora"}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </motion.section>
    </div>
  );
}
