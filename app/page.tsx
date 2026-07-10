"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Navbar, type Screen } from "@/components/Navbar";
import { LandingScreen } from "@/components/landing/LandingScreen";
import { AnswerRecord, clearDependentAnswers } from "./data";
import { screenVariants } from "@/lib/motion";

const QuizFlow = dynamic(
  () => import("@/components/quiz/QuizFlow").then(m => m.QuizFlow),
  { ssr: false },
);
const ResultsDashboard = dynamic(
  () => import("@/components/results/ResultsDashboard").then(m => m.ResultsDashboard),
  { ssr: false },
);

const STORAGE_KEY = "snowfox-assessment-v1";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [hydrated, setHydrated] = useState(false);

  // Restore an in-progress session (refresh-safe; cleared on restart)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { screen?: Screen; answers?: AnswerRecord };
        if (saved.answers && typeof saved.answers === "object") setAnswers(saved.answers);
        if (saved.screen === "quiz" || saved.screen === "results") setScreen(saved.screen);
      }
    } catch {
      // corrupted storage — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ screen, answers }));
    } catch {
      // storage full/unavailable — persistence is best-effort
    }
  }, [screen, answers, hydrated]);

  const handleAnswer = useCallback((qid: string, val: number | number[] | string | -1) => {
    setAnswers(prev => {
      if (val === -1) {
        const next = clearDependentAnswers(qid, prev);
        delete next[qid];
        return next;
      }
      const next = clearDependentAnswers(qid, prev);
      next[qid] = val as number | number[] | string;
      return next;
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  function goTo(s: Screen) {
    setScreen(s);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-backdrop" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative min-h-screen" style={{ zIndex: 10 }}>
        <Navbar
          screen={screen}
          onStart={() => goTo("quiz")}
          onHome={() => goTo("landing")}
          saved
        />

        <div className="pt-16">
          <AnimatePresence mode="wait">
            {screen === "landing" && (
              <motion.div key="landing" variants={screenVariants} initial="enter" animate="center" exit="exit">
                <LandingScreen onStart={() => goTo("quiz")} />
              </motion.div>
            )}

            {screen === "quiz" && (
              <motion.div key="quiz" variants={screenVariants} initial="enter" animate="center" exit="exit">
                <QuizFlow
                  answers={answers}
                  onAnswer={handleAnswer}
                  onFinish={() => goTo("results")}
                  onExit={() => goTo("landing")}
                />
              </motion.div>
            )}

            {screen === "results" && (
              <motion.div key="results" variants={screenVariants} initial="enter" animate="center" exit="exit">
                <ResultsDashboard
                  answers={answers}
                  onRestart={() => {
                    setAnswers({});
                    try {
                      // QuizFlow's persisted cursor — must reset with the answers
                      sessionStorage.removeItem("snowfox-assessment-cursor-v1");
                    } catch {}
                    goTo("quiz");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
