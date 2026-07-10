"use client";

import { useRef } from "react";
import { motion, useScroll } from "motion/react";
import { fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { ROADMAP_QUARTERS, SCORED_QUESTION_COUNT } from "./stats";

const STEPS = [
  {
    title: "Responda",
    body: `Até ${SCORED_QUESTION_COUNT} perguntas objetivas com ramificação condicional — você só vê o que se aplica à sua empresa. Cerca de 10 minutos.`,
  },
  {
    title: "Receba o diagnóstico",
    body: "Pontuação de 0 a 100, nível de prontidão e detalhamento dos 5 pilares, calculados na hora a partir das suas respostas.",
  },
  {
    title: "Aja com o roadmap",
    body: `Plano priorizado de ${ROADMAP_QUARTERS} trimestres, com lacunas, oportunidades e pontos fortes específicos do seu contexto.`,
  },
];

export function HowItWorks() {
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.85", "end 0.55"],
  });

  return (
    <section id="como-funciona" className="py-32 max-lg:py-20 scroll-mt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <div className="lg:sticky lg:top-28 self-start">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={fadeUp}
            className="font-display font-bold text-white text-[clamp(28px,4vw,36px)] tracking-[-0.02em]"
          >
            Como funciona
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={fadeUp}
            className="mt-3 text-[15px] leading-[1.7] text-[var(--text-m)]"
          >
            Três passos entre a primeira pergunta e um plano de ação concreto.
            Sem formulário de contato no meio do caminho.
          </motion.p>
        </div>

        <motion.div
          ref={listRef}
          className="relative pl-10"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={staggerChildren(0.09)}
        >
          {/* Connector line draws with scroll */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[var(--line-1)]" aria-hidden="true">
            <motion.div
              className="w-full h-full origin-top"
              style={{ scaleY: scrollYProgress, background: "var(--violet-500)" }}
            />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              className="relative py-8"
              style={{ borderBottom: i < STEPS.length - 1 ? "1px solid var(--line-1)" : "none" }}
            >
              <span
                className="absolute -left-10 top-8 font-display font-bold text-[26px] leading-none"
                style={{ color: "rgba(167,139,250,0.5)" }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="font-display font-bold text-[20px] text-white tracking-[-0.01em]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[560px] text-[14px] leading-[1.7] text-[var(--text-m)]">
                {step.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
