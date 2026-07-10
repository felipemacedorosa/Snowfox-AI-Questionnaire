"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AnswerRecord, MultiQuestion, SECTIONS, SingleQuestion,
} from "@/app/data";
import {
  buildFlowSteps, computeProgress, firstIncompleteIndex, isStepComplete,
} from "@/lib/flow";
import { stepVariants } from "@/lib/motion";
import { PillarRail } from "./PillarRail";
import { PillarIntro } from "./PillarIntro";
import { QuestionStep } from "./QuestionStep";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { useQuizKeyboard } from "./useQuizKeyboard";

const AUTO_ADVANCE_MS = 350;
const CURSOR_KEY = "snowfox-assessment-cursor-v1";

export function QuizFlow({ answers, onAnswer, onFinish, onExit }: {
  answers: AnswerRecord;
  onAnswer: (qid: string, val: number | number[] | string | -1) => void;
  onFinish: () => void;
  onExit: () => void;
}) {
  const [cursorId, setCursorId] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(CURSOR_KEY);
        if (saved && buildFlowSteps(answers).some(s => s.id === saved)) return saved;
      } catch {
        // ignore — start from the first step
      }
    }
    return `intro:${SECTIONS[0].id}`;
  });
  const [direction, setDirection] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  // True while a single-select auto-advance is scheduled — hides the fallback
  // "Continuar" button that answered questions otherwise show (back-nav/restore).
  const [pendingAdvance, setPendingAdvance] = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = useMemo(() => buildFlowSteps(answers), [answers]);
  const cursorIndex = Math.max(0, steps.findIndex(s => s.id === cursorId));
  const step = steps[cursorIndex];
  const isLast = cursorIndex === steps.length - 1;
  const progress = useMemo(() => computeProgress(steps, answers), [steps, answers]);

  // Latest state for timer callbacks (auto-advance fires after answers change steps)
  const stateRef = useRef({ steps, cursorIndex, answers });
  stateRef.current = { steps, cursorIndex, answers };

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setPendingAdvance(false);
  }, []);

  const goNext = useCallback(() => {
    clearAdvance();
    const { steps, cursorIndex, answers } = stateRef.current;
    const current = steps[cursorIndex];
    if (!isStepComplete(current, answers)) return;

    if (cursorIndex >= steps.length - 1) {
      const missing = firstIncompleteIndex(steps, answers);
      if (missing >= 0) {
        setDirection(missing > cursorIndex ? 1 : -1);
        setCursorId(steps[missing].id);
        return;
      }
      setAnalyzing(true);
      return;
    }
    setDirection(1);
    setCursorId(steps[cursorIndex + 1].id);
  }, [clearAdvance]);

  const goBack = useCallback(() => {
    clearAdvance();
    const { steps, cursorIndex } = stateRef.current;
    if (cursorIndex === 0) {
      onExit();
      return;
    }
    setDirection(-1);
    setCursorId(steps[cursorIndex - 1].id);
  }, [clearAdvance, onExit]);

  const jumpTo = useCallback((sectionIndex: number) => {
    clearAdvance();
    const { steps, cursorIndex } = stateRef.current;
    const targetIndex = steps.findIndex(s => s.kind === "question" && s.sectionIndex === sectionIndex);
    if (targetIndex === -1) return;
    setDirection(targetIndex > cursorIndex ? 1 : -1);
    setCursorId(steps[targetIndex].id);
  }, [clearAdvance]);

  const handleSingleSelect = useCallback((q: SingleQuestion, value: number) => {
    clearAdvance();
    const current = stateRef.current.answers[q.id];
    if (current === value) {
      onAnswer(q.id, -1); // deselect — also purges dependent answers
      return;
    }
    onAnswer(q.id, value);
    const last = stateRef.current.cursorIndex >= stateRef.current.steps.length - 1;
    if (!last) {
      setPendingAdvance(true);
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        goNext();
      }, AUTO_ADVANCE_MS);
    }
  }, [clearAdvance, goNext, onAnswer]);

  const handleToggleMulti = useCallback((q: MultiQuestion, optValue: number, isNone: boolean) => {
    const current = Array.isArray(stateRef.current.answers[q.id])
      ? (stateRef.current.answers[q.id] as number[])
      : [];
    const noneValues = q.options.filter(o => o.isNone).map(o => o.value);
    let next: number[];
    if (isNone) {
      next = current.includes(optValue) ? [] : [optValue];
    } else {
      const withoutNone = current.filter(v => !noneValues.includes(v));
      next = withoutNone.includes(optValue)
        ? withoutNone.filter(v => v !== optValue)
        : [...withoutNone, optValue];
    }
    onAnswer(q.id, next);
  }, [onAnswer]);

  const handleDigit = useCallback((displayIndex: number) => {
    const { steps, cursorIndex } = stateRef.current;
    const current = steps[cursorIndex];
    if (current.kind !== "question") return;
    const q = current.question;
    if (q.type === "text") return;
    const opt = q.options[displayIndex];
    if (!opt) return;

    setPressedIndex(displayIndex);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressedIndex(null), 150);

    if (q.type === "single") handleSingleSelect(q, opt.value);
    else handleToggleMulti(q, opt.value, !!(opt as MultiQuestion["options"][number]).isNone);
  }, [handleSingleSelect, handleToggleMulti]);

  useQuizKeyboard({
    enabled: !analyzing,
    optionCount: step.kind === "question" && step.question.type !== "text" ? step.question.options.length : 0,
    onDigit: handleDigit,
    onEnter: goNext,
    onBack: goBack,
  });

  // Focus the question heading after each step change (screen-reader announce)
  useEffect(() => {
    if (step.kind === "question") {
      const id = setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 60);
      return () => clearTimeout(id);
    }
  }, [cursorId, step.kind]);

  // Refresh-safe cursor
  useEffect(() => {
    try {
      sessionStorage.setItem(CURSOR_KEY, cursorId);
    } catch {
      // best-effort
    }
  }, [cursorId]);

  // Never leave a timer running across unmount
  useEffect(() => () => {
    clearAdvance();
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, [clearAdvance]);

  if (analyzing) {
    return <AnalyzingScreen onDone={onFinish} />;
  }

  const currentLabel =
    step.kind === "question"
      ? `${SECTIONS[step.sectionIndex].title} · ${step.numberInSection} de ${step.totalInSection}`
      : `Pilar ${SECTIONS[step.sectionIndex].pillar} de ${SECTIONS.length} — ${SECTIONS[step.sectionIndex].title}`;

  return (
    <div className="mx-auto w-full max-w-landing px-6 pt-8 pb-16">
      <div className="lg:grid lg:grid-cols-[72px_1fr] lg:gap-7">
        <PillarRail
          perPillar={progress.perPillar}
          activeSection={step.sectionIndex}
          currentLabel={currentLabel}
          onJumpTo={jumpTo}
        />

        <div
          className="surface-panel relative flex flex-col overflow-hidden"
          style={{ minHeight: "calc(100dvh - 128px)" }}
        >
          <div className="flex items-center justify-between gap-4 px-8 max-md:px-5 pt-6">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-dim)] hover:text-[var(--text-h)] transition-colors rounded-[8px] px-2 py-1 -ml-2"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M13 8H3M7 4L3 8l4 4" />
              </svg>
              {cursorIndex === 0 ? "Voltar ao início" : "Voltar"}
            </button>
            <span className="text-[12px] whitespace-nowrap text-[var(--text-dim)]">
              {progress.answered} de {progress.total} respondidas
            </span>
          </div>

          <div className="flex-1 flex items-center px-8 max-md:px-5 py-10">
            <div className="w-full max-w-quiz mx-auto" style={{ minHeight: 380 }}>
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {step.kind === "intro" ? (
                    <PillarIntro sectionIndex={step.sectionIndex} onBegin={goNext} />
                  ) : (
                    <QuestionStep
                      ref={headingRef}
                      question={step.question}
                      sectionIndex={step.sectionIndex}
                      numberInSection={step.numberInSection}
                      totalInSection={step.totalInSection}
                      answers={answers}
                      pressedIndex={pressedIndex}
                      complete={isStepComplete(step, answers)}
                      isLast={isLast}
                      pendingAdvance={pendingAdvance}
                      onSelectSingle={handleSingleSelect}
                      onToggleMulti={handleToggleMulti}
                      onAnswerText={(qid, val) => onAnswer(qid, val)}
                      onContinue={goNext}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <p
            className="hidden md:block px-8 pb-5 text-center text-[12px] text-[var(--text-p)] transition-opacity duration-500"
            style={{ opacity: progress.answered >= 3 ? 0.4 : 1 }}
            aria-hidden="true"
          >
            1–9 selecionar · Enter continuar · ← voltar
          </p>
        </div>
      </div>
    </div>
  );
}
