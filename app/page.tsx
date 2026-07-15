"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LandingScreen } from "@/components/landing/LandingScreen";
import { Navbar, type AppScreen, type SaveState } from "@/components/Navbar";
import { QuizScreen } from "@/components/quiz/QuizScreen";
import { ResultsScreen } from "@/components/results/ResultsScreen";
import { AnswerRecord, SECTIONS, clearDependentAnswers } from "./data";
// DEV SHORTCUT (remove with app/devShortcuts.ts): see effect below.
import { buildStrategyGapTestAnswers } from "./devShortcuts";

const STORAGE_KEY = "snowfox-ai-assessment-v1";

interface AssessmentDraft {
  version: 1;
  screen: AppScreen;
  resumeScreen?: "quiz" | "results" | null;
  section: number;
  answers: AnswerRecord;
  updatedAt: string;
}

function isAnswerRecord(value: unknown): value is AnswerRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(item =>
    typeof item === "number" ||
    typeof item === "string" ||
    (Array.isArray(item) && item.every(entry => typeof entry === "number"))
  );
}

function isAssessmentDraft(value: unknown): value is AssessmentDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<AssessmentDraft>;
  return draft.version === 1 &&
    (draft.screen === "landing" || draft.screen === "quiz" || draft.screen === "results") &&
    typeof draft.section === "number" &&
    isAnswerRecord(draft.answers);
}

function clampSection(section: number) {
  return Math.min(Math.max(Math.round(section), 0), SECTIONS.length - 1);
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [section, setSection] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [resumeScreen, setResumeScreen] = useState<"quiz" | "results" | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const draftExists = useMemo(
    () => resumeScreen !== null || Object.keys(answers).length > 0 || screen === "results",
    [answers, resumeScreen, screen]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isAssessmentDraft(parsed)) {
          setScreen(parsed.screen);
          setSection(clampSection(parsed.section));
          setAnswers(parsed.answers);
          setResumeScreen(parsed.resumeScreen ?? (parsed.screen === "results" ? "results" : Object.keys(parsed.answers).length > 0 ? "quiz" : null));
        }
      }
    } catch {
      setSaveState("unavailable");
    } finally {
      setHydrated(true);
    }
  }, []);

  // DEV SHORTCUT (remove this block + app/devShortcuts.ts to remove entirely):
  // visit /?debug=strategy-gap to jump straight to the results page with a
  // near-perfect answer set that has 1-2 deliberately weak sub-answers in
  // Estratégia, for eyeballing the "high score, not a gap" fix.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("debug") !== "strategy-gap") return;
    setAnswers(buildStrategyGapTestAnswers());
    setResumeScreen("results");
    setScreen("results");
  }, []);

  const buildDraft = useCallback((): AssessmentDraft => ({
    version: 1,
    screen,
    resumeScreen,
    section,
    answers,
    updatedAt: new Date().toISOString(),
  }), [answers, resumeScreen, screen, section]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState(current => current === "unavailable" ? current : "saving");
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraft()));
        setSaveState("saved");
      } catch {
        setSaveState("unavailable");
      }
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [answers, buildDraft, hydrated, resumeScreen, screen, section]);

  const persistNow = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraft()));
      setSaveState("saved");
    } catch {
      setSaveState("unavailable");
    }
  }, [buildDraft]);

  const scrollToTop = useCallback(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, [screen, section]);

  const goTo = useCallback((nextScreen: AppScreen) => {
    if (nextScreen === "quiz") setResumeScreen("quiz");
    if (nextScreen === "results") setResumeScreen("results");
    setScreen(nextScreen);
    scrollToTop();
  }, [scrollToTop]);

  const handleAnswer = useCallback((qid: string, value: number | number[] | string | -1) => {
    setResumeScreen("quiz");
    setAnswers(previous => {
      const next = clearDependentAnswers(qid, previous);
      if (value === -1) {
        delete next[qid];
      } else {
        next[qid] = value;
      }
      return next;
    });
  }, []);

  const startFresh = useCallback(() => {
    setResumeScreen("quiz");
    setAnswers({});
    setSection(0);
    goTo("quiz");
  }, [goTo]);

  const restart = useCallback(() => {
    setResumeScreen(null);
    setAnswers({});
    setSection(0);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setSaveState("idle");
    } catch {
      setSaveState("unavailable");
    }
    goTo("landing");
  }, [goTo]);

  if (!hydrated) {
    return <div className="loading-screen" aria-label="Carregando avaliação" />;
  }

  const sectionLabel = SECTIONS[section]?.title ?? "Avaliação";

  return (
    <div className="app-shell">
      <Navbar
        screen={screen}
        sectionLabel={sectionLabel}
        saveState={saveState}
        onSave={persistNow}
        onNavigate={goTo}
      />

      <main className="page-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "landing" && (
              <LandingScreen
                hasDraft={draftExists}
                savedScreen={resumeScreen}
                savedSection={section}
                onStart={startFresh}
                onResume={() => goTo(resumeScreen === "results" ? "results" : "quiz")}
                onReset={restart}
              />
            )}

            {screen === "quiz" && (
              <QuizScreen
                section={section}
                answers={answers}
                saveState={saveState}
                onAnswer={handleAnswer}
                onSectionSelect={nextSection => {
                  setSection(nextSection);
                  scrollToTop();
                }}
                onBack={() => {
                  if (section === 0) {
                    goTo("landing");
                    return;
                  }
                  setSection(current => current - 1);
                  scrollToTop();
                }}
                onNext={() => {
                  if (section === SECTIONS.length - 1) {
                    goTo("results");
                    return;
                  }
                  setSection(current => current + 1);
                  scrollToTop();
                }}
              />
            )}

            {screen === "results" && (
              <ResultsScreen answers={answers} onRestart={restart} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
