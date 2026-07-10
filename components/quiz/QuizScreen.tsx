"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronRight,
  Circle,
  FileText,
  LockKeyhole,
  Save,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import {
  AnswerRecord,
  getAssessmentProgress,
  getSectionProgress,
  isQuestionAnswered,
  isQuestionVisible,
  SECTIONS,
  Question,
  SingleQuestion,
  MultiQuestion,
  TextQuestion,
} from "@/app/data";
import { NavBtn } from "@/components/NavBtn";
import type { SaveState } from "@/components/Navbar";

const AUTO_ADVANCE_MS = 360;
const CURSOR_KEY = "snowfox-ai-question-cursor-v1";

const questionVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 42 : -42,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -30 : 30,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  }),
};

const reducedQuestionVariants: Variants = {
  enter: { opacity: 1, x: 0 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 },
};

function firstQuestionId(questions: Question[], answers: AnswerRecord) {
  return questions.find(question =>
    question.type !== "text" && !isQuestionAnswered(question, answers)
  )?.id ?? questions[0]?.id ?? "";
}

export function QuizScreen({
  section,
  answers,
  saveState,
  onAnswer,
  onSectionSelect,
  onBack,
  onNext,
}: {
  section: number;
  answers: AnswerRecord;
  saveState: SaveState;
  onAnswer: (qid: string, val: number | number[] | string | -1) => void;
  onSectionSelect: (section: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sec = SECTIONS[section];
  const isLastSection = section === SECTIONS.length - 1;
  const visibleQs = useMemo(
    () => sec.questions.filter(question => isQuestionVisible(question, sec.questions, answers)),
    [answers, sec]
  );
  const [cursorId, setCursorId] = useState(() => {
    if (typeof window !== "undefined" && Object.keys(answers).length > 0) {
      try {
        const saved = window.sessionStorage.getItem(CURSOR_KEY);
        if (saved && visibleQs.some(question => question.id === saved)) return saved;
      } catch {
        // Cursor persistence is best-effort; answers remain the source of truth.
      }
    }
    return firstQuestionId(visibleQs, answers);
  });
  const [direction, setDirection] = useState(1);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const previousSection = useRef(section);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const currentIndex = Math.max(0, visibleQs.findIndex(question => question.id === cursorId));
  const currentQuestion = visibleQs[currentIndex] ?? visibleQs[0];
  const sectionProgress = getSectionProgress(sec, answers);
  const assessmentProgress = getAssessmentProgress(answers);
  const currentAnswered = currentQuestion ? isQuestionAnswered(currentQuestion, answers) : false;
  const canContinue = currentQuestion?.type === "text" || currentAnswered;
  const isFinalQuestion = currentIndex === visibleQs.length - 1;

  const flowRef = useRef({
    section,
    visibleQs,
    currentIndex,
    answers,
  });
  flowRef.current = { section, visibleQs, currentIndex, answers };

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setPendingAdvance(false);
  }, []);

  const bringCardIntoView = useCallback(() => {
    window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const top = window.scrollY + panel.getBoundingClientRect().top - 84;
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
    });
  }, []);

  const moveToQuestion = useCallback((targetIndex: number) => {
    clearAdvance();
    const state = flowRef.current;
    const target = state.visibleQs[targetIndex];
    if (!target) return;
    setDirection(targetIndex > state.currentIndex ? 1 : -1);
    setCursorId(target.id);
    bringCardIntoView();
  }, [bringCardIntoView, clearAdvance]);

  const goForward = useCallback(() => {
    clearAdvance();
    const state = flowRef.current;
    const question = state.visibleQs[state.currentIndex];
    if (!question) return;
    if (question.type !== "text" && !isQuestionAnswered(question, state.answers)) return;

    if (state.currentIndex < state.visibleQs.length - 1) {
      setDirection(1);
      setCursorId(state.visibleQs[state.currentIndex + 1].id);
      bringCardIntoView();
      return;
    }

    if (getSectionProgress(SECTIONS[state.section], state.answers).complete) {
      onNext();
    }
  }, [bringCardIntoView, clearAdvance, onNext]);

  const goBack = useCallback(() => {
    clearAdvance();
    const state = flowRef.current;
    if (state.currentIndex > 0) {
      setDirection(-1);
      setCursorId(state.visibleQs[state.currentIndex - 1].id);
      bringCardIntoView();
      return;
    }
    onBack();
  }, [bringCardIntoView, clearAdvance, onBack]);

  const handleSingleSelect = useCallback((question: SingleQuestion, value: number) => {
    clearAdvance();
    const state = flowRef.current;
    const selected = state.answers[question.id];
    if (selected === value) {
      onAnswer(question.id, -1);
      return;
    }

    onAnswer(question.id, value);
    const sourceIndex = SECTIONS[state.section].questions.findIndex(item => item.id === question.id);
    const revealsFollowUp = SECTIONS[state.section].questions
      .slice(sourceIndex + 1)
      .some(item => item.showIf?.qId === question.id && item.showIf.values.includes(value));
    const hasVisibleNext = state.currentIndex < state.visibleQs.length - 1;

    if (hasVisibleNext || revealsFollowUp) {
      setPendingAdvance(true);
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        goForward();
      }, prefersReducedMotion ? 80 : AUTO_ADVANCE_MS);
    }
  }, [clearAdvance, goForward, onAnswer, prefersReducedMotion]);

  const handleMultiToggle = useCallback((question: MultiQuestion, optValue: number, isNone: boolean) => {
    const current = Array.isArray(flowRef.current.answers[question.id])
      ? flowRef.current.answers[question.id] as number[]
      : [];
    const noneValues = question.options.filter(option => option.isNone).map(option => option.value);
    let next: number[];
    if (isNone) {
      next = current.includes(optValue) ? [] : [optValue];
    } else {
      const withoutNone = current.filter(value => !noneValues.includes(value));
      next = withoutNone.includes(optValue)
        ? withoutNone.filter(value => value !== optValue)
        : [...withoutNone, optValue];
    }
    onAnswer(question.id, next);
  }, [onAnswer]);

  useEffect(() => {
    if (section === previousSection.current) return;
    clearAdvance();
    const movingBack = section < previousSection.current;
    const sectionQuestions = SECTIONS[section].questions.filter(question =>
      isQuestionVisible(question, SECTIONS[section].questions, answers)
    );
    setDirection(movingBack ? -1 : 1);
    setCursorId(
      movingBack
        ? sectionQuestions.at(-1)?.id ?? ""
        : firstQuestionId(sectionQuestions, answers)
    );
    previousSection.current = section;
  }, [clearAdvance, section]);

  useEffect(() => {
    if (visibleQs.length === 0 || visibleQs.some(question => question.id === cursorId)) return;
    setCursorId(firstQuestionId(visibleQs, answers));
  }, [answers, cursorId, visibleQs]);

  useEffect(() => {
    const timeout = window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 70);
    return () => window.clearTimeout(timeout);
  }, [cursorId]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CURSOR_KEY, cursorId);
    } catch {
      // Cursor persistence is best-effort.
    }
  }, [cursorId]);

  useEffect(() => () => clearAdvance(), [clearAdvance]);

  if (!currentQuestion) return null;

  const nextLabel = isFinalQuestion
    ? isLastSection ? "Ver resultado" : "Próxima dimensão"
    : "Continuar";

  return (
    <div className="quiz-layout page-frame" id="assessment-navigation">
      <aside className="assessment-rail" aria-label="Navegação da avaliação">
        <div className="rail-heading">
          <div>
            <span className="section-kicker"><span className="kicker-line" /> Rota da avaliação</span>
            <strong>5 dimensões</strong>
          </div>
          <motion.span key={assessmentProgress.percent} className="rail-total" initial={{ opacity: 0.35, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>{assessmentProgress.percent}%</motion.span>
        </div>
        <ol className="section-list">
          {SECTIONS.map((item, index) => {
            const progress = getSectionProgress(item, answers);
            const isCurrent = index === section;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`section-item${isCurrent ? " is-current" : ""}${progress.complete ? " is-complete" : ""}`}
                  onClick={() => onSectionSelect(index)}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className="section-item-number">{progress.complete ? <Check size={14} aria-hidden="true" /> : `0${index + 1}`}</span>
                  <span className="section-item-copy"><strong>{item.title}</strong><small>{progress.answered}/{progress.total} respondidas</small></span>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="rail-footer">
          <LockKeyhole size={15} aria-hidden="true" />
          <span>Suas respostas ficam neste dispositivo.</span>
        </div>
      </aside>

      <motion.main
        ref={panelRef}
        key={sec.id}
        className="question-panel question-panel-flow"
        aria-labelledby="questionnaire-title"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="question-panel-topline">
          <span>Pilar {sec.pillar} de {SECTIONS.length}</span>
          <span className={`save-state save-state-${saveState}`} aria-live="polite">
            <Save size={13} aria-hidden="true" />
            {saveState === "unavailable" ? "Sessão local" : saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo agora" : "Pronto para salvar"}
          </span>
        </div>

        <header className="question-header question-header-flow">
          <div className="question-header-meta">
            <span className="section-kicker"><span className="kicker-line" /> Dimensão {String(sec.pillar).padStart(2, "0")}</span>
            <span>{sectionProgress.answered} de {sectionProgress.total} respondidas</span>
          </div>
          <h1 id="questionnaire-title">{sec.title}</h1>
          <p>{sec.desc}</p>
        </header>

        <nav
          className="question-position-track"
          aria-label={`Perguntas da dimensão. Pergunta atual: ${currentIndex + 1} de ${visibleQs.length}`}
        >
          {visibleQs.map((question, index) => (
            <button
              type="button"
              key={question.id}
              className={`${index === currentIndex ? " is-current" : ""}${isQuestionAnswered(question, answers) ? " is-answered" : ""}`}
              onClick={() => moveToQuestion(index)}
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={`Ir para a pergunta ${index + 1}`}
              title={`Pergunta ${index + 1}`}
            />
          ))}
        </nav>

        <div className="question-card-viewport">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.article
              key={currentQuestion.id}
              className="question-card"
              custom={direction}
              variants={prefersReducedMotion ? reducedQuestionVariants : questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <QuestionCard
                headingRef={headingRef}
                question={currentQuestion}
                index={currentIndex}
                total={visibleQs.length}
                answers={answers}
                onAnswer={onAnswer}
                onSingleSelect={handleSingleSelect}
                onMultiToggle={handleMultiToggle}
              />
            </motion.article>
          </AnimatePresence>
        </div>

        <footer className="question-footer question-flow-footer">
          <div className="question-footer-status" aria-live="polite">
            {currentAnswered
              ? <><Check size={16} aria-hidden="true" /> Resposta salva</>
              : currentQuestion.type === "text"
                ? <><FileText size={14} aria-hidden="true" /> Contexto opcional</>
                : <><Circle size={13} aria-hidden="true" /> Selecione uma resposta</>}
          </div>
          <div className="question-footer-actions">
            <NavBtn variant="back" onClick={goBack}>{currentIndex === 0 && section === 0 ? "Início" : "Voltar"}</NavBtn>
            <NavBtn variant="next" disabled={!canContinue || pendingAdvance} onClick={goForward}>{nextLabel}</NavBtn>
          </div>
        </footer>
      </motion.main>
    </div>
  );
}

function QuestionCard({
  headingRef,
  question,
  index,
  total,
  answers,
  onAnswer,
  onSingleSelect,
  onMultiToggle,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  question: Question;
  index: number;
  total: number;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: number | number[] | string | -1) => void;
  onSingleSelect: (question: SingleQuestion, value: number) => void;
  onMultiToggle: (question: MultiQuestion, value: number, isNone: boolean) => void;
}) {
  return (
    <>
      <div className="question-number">Pergunta {String(index + 1).padStart(2, "0")} <span>/ {String(total).padStart(2, "0")}</span></div>
      <h2 ref={headingRef} tabIndex={-1}>{question.text}</h2>
      {question.type === "single" && <SingleOptions question={question} answers={answers} onSelect={onSingleSelect} />}
      {question.type === "multi" && <MultiOptions question={question} answers={answers} onToggle={onMultiToggle} />}
      {question.type === "text" && <TextInput question={question} answers={answers} onAnswer={onAnswer} />}
    </>
  );
}

function SingleOptions({
  question,
  answers,
  onSelect,
}: {
  question: SingleQuestion;
  answers: AnswerRecord;
  onSelect: (question: SingleQuestion, value: number) => void;
}) {
  const selected = typeof answers[question.id] === "number" ? answers[question.id] as number : undefined;
  return (
    <div className={`options-list${question.options.length >= 4 ? " is-dense" : ""}`} role="group" aria-label={`Opções para: ${question.text}`}>
      {question.options.map((option, index) => {
        const isSelected = selected === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            className={`option-card${isSelected ? " is-selected" : ""}`}
            aria-pressed={isSelected}
            title={option.note}
            onClick={() => onSelect(question, option.value)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.035, 0.18), duration: 0.25 }}
            whileTap={{ scale: 0.995 }}
          >
            <span className="option-marker">{index + 1}</span>
            <span className="option-copy"><strong>{option.label}</strong>{option.note && <span>{option.note}</span>}</span>
            <span className="option-state" aria-hidden="true">{isSelected ? <Check size={15} /> : <Circle size={15} />}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function MultiOptions({
  question,
  answers,
  onToggle,
}: {
  question: MultiQuestion;
  answers: AnswerRecord;
  onToggle: (question: MultiQuestion, value: number, isNone: boolean) => void;
}) {
  const selected = Array.isArray(answers[question.id]) ? answers[question.id] as number[] : [];
  return (
    <div className={`options-list${question.options.length >= 4 ? " is-dense" : ""}`} role="group" aria-label={`Opções para: ${question.text}`}>
      {question.options.map((option, index) => {
        const isSelected = selected.includes(option.value);
        return (
          <motion.button
            key={option.value}
            type="button"
            className={`option-card option-card-multi${isSelected ? " is-selected" : ""}`}
            aria-pressed={isSelected}
            title={option.note}
            onClick={() => onToggle(question, option.value, !!option.isNone)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.035, 0.18), duration: 0.25 }}
            whileTap={{ scale: 0.995 }}
          >
            <span className="option-marker option-marker-check">{isSelected ? <Check size={16} aria-hidden="true" /> : null}</span>
            <span className="option-copy"><strong>{option.label}</strong>{option.note && <span>{option.note}</span>}</span>
          </motion.button>
        );
      })}
      <p className="multi-answer-note">Selecione todas que se aplicam.</p>
    </div>
  );
}

function TextInput({
  question,
  answers,
  onAnswer,
}: {
  question: TextQuestion;
  answers: AnswerRecord;
  onAnswer: (qid: string, value: string) => void;
}) {
  const value = typeof answers[question.id] === "string" ? answers[question.id] as string : "";
  return (
    <div className="text-answer">
      <div className="text-answer-label"><FileText size={15} aria-hidden="true" /> Contexto adicional</div>
      <textarea
        className="text-input"
        placeholder={question.placeholder ?? "Digite sua resposta..."}
        value={value}
        onChange={event => onAnswer(question.id, event.target.value)}
        rows={5}
      />
      <p>Opcional. Sua resposta fica salva, mas não afeta a pontuação.</p>
    </div>
  );
}
