"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { getReadinessLevel, LEVEL_META, PILLAR_CONFIG } from "@/app/data";
import { RadarChart } from "@/components/results/RadarChart";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { Ticker } from "@/components/ui/Ticker";
import { TierBadge, type Tier } from "@/components/ui/Badge";
import { PILLAR_SHORT, SCORED_QUESTION_COUNT } from "./stats";

/** Three plausible readiness profiles the hero radar cycles through. */
const PROFILES: number[][] = [
  [42, 48, 35, 30, 45],
  [61, 70, 55, 58, 66],
  [82, 88, 74, 79, 85],
];

function overallOf(profile: number[]): number {
  return Math.round(
    PILLAR_CONFIG.reduce((sum, p, i) => sum + p.weight * profile[i], 0),
  );
}

const HEADLINE_WORDS: { word: string; gradient?: boolean }[] = [
  { word: "Sua" },
  { word: "empresa" },
  { word: "está" },
  { word: "pronta", gradient: true },
  { word: "para", gradient: true },
  { word: "IA?", gradient: true },
];

export function Hero({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion();
  const [profileIndex, setProfileIndex] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setProfileIndex(i => (i + 1) % PROFILES.length), 4000);
    return () => clearInterval(id);
  }, [reduced]);

  const profile = PROFILES[profileIndex];
  const score = overallOf(profile);
  const level = getReadinessLevel(score);
  const tier = (LEVEL_META[level]?.key ?? "moderate") as Tier;

  // Pointer-proximity tilt on the instrument (≤4°)
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 8);
    rotateX.set(-py * 8);
  }
  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <section className="min-h-[92vh] flex items-center">
      <div className="w-full grid gap-14 lg:grid-cols-[55fr_45fr] lg:items-center">
        {/* Copy column */}
        <div>
          <motion.h1
            className="font-display font-black text-white"
            style={{
              fontSize: "clamp(42px, 6.5vw, 76px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } }}
          >
            {HEADLINE_WORDS.map(({ word, gradient }, i) => (
              <motion.span
                key={i}
                className={gradient ? "gt inline-block" : "inline-block"}
                variants={{
                  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
                  visible: {
                    opacity: 1, y: 0, filter: "blur(0px)",
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                {word}
                {i < HEADLINE_WORDS.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mt-6 max-w-[560px] text-[15px] leading-[1.7] text-[var(--text-m)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Avalie os 5 pilares da prontidão — Dados, Estratégia, Pessoas, Governança e
            Tecnologia — e receba um diagnóstico executivo com roadmap de 3 trimestres.
            Em cerca de 10 minutos.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Magnetic>
              <Button onClick={onStart}>
                Iniciar avaliação gratuita
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Button>
            </Magnetic>
            <Button
              variant="ghost"
              onClick={() => document.getElementById("relatorio")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver o que você recebe
            </Button>
          </motion.div>

          <motion.p
            className="mt-7 text-[13px] text-[var(--text-dim)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
          >
            Até {SCORED_QUESTION_COUNT} perguntas · 5 pilares ponderados · resultado imediato · sem cadastro
          </motion.p>
        </div>

        {/* The instrument: a live radar demoing the product output */}
        <motion.div
          className="justify-self-center w-full max-w-[400px]"
          style={{ rotateX, rotateY, transformPerspective: 900 }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-end justify-between px-2 mb-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-dim)]">
                Índice de prontidão
              </p>
              <p
                className="font-display font-black text-white leading-none mt-1"
                style={{ fontSize: 56, letterSpacing: "-0.03em" }}
              >
                <Ticker value={score} />
                <span className="text-[18px] font-medium text-[var(--text-dim)] ml-1">/100</span>
              </p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <TierBadge tier={tier}>{level.replace("Prontidão ", "")}</TierBadge>
              </motion.div>
            </AnimatePresence>
          </div>
          <RadarChart
            data={PILLAR_CONFIG.map((p, i) => ({ label: PILLAR_SHORT[p.id], value: profile[i] }))}
            size={400}
            showValues={false}
          />
        </motion.div>
      </div>
    </section>
  );
}
