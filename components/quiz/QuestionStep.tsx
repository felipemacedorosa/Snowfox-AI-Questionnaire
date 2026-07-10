"use client";

import { forwardRef } from "react";
import {
  AnswerRecord, MultiQuestion, Question, SECTIONS, SingleQuestion, TextQuestion,
} from "@/app/data";
import { Button } from "@/components/ui/Button";
import { MultiOptionList, SingleOptionList } from "./OptionList";
import { TextStep } from "./TextStep";

export const QuestionStep = forwardRef<HTMLHeadingElement, {
  question: Question;
  sectionIndex: number;
  numberInSection: number;
  totalInSection: number;
  answers: AnswerRecord;
  pressedIndex: number | null;
  complete: boolean;
  /** Final step: always show an explicit "Concluir avaliação" action. */
  isLast?: boolean;
  /** A single-select auto-advance is scheduled — suppress the fallback button. */
  pendingAdvance?: boolean;
  onSelectSingle: (q: SingleQuestion, value: number) => void;
  onToggleMulti: (q: MultiQuestion, value: number, isNone: boolean) => void;
  onAnswerText: (qid: string, val: string) => void;
  onContinue: () => void;
}>(function QuestionStep(
  {
    question, sectionIndex, numberInSection, totalInSection, answers,
    pressedIndex, complete, isLast, pendingAdvance, onSelectSingle, onToggleMulti, onAnswerText, onContinue,
  },
  headingRef,
) {
  const section = SECTIONS[sectionIndex];
  // Answered singles (back-nav / restored session) still need a way forward.
  const needsContinue =
    question.type !== "single" || isLast || (complete && !pendingAdvance);
  const textEmpty =
    question.type === "text" &&
    !(typeof answers[question.id] === "string" && (answers[question.id] as string).trim().length > 0);
  const continueLabel = isLast
    ? "Concluir avaliação"
    : question.type === "text" && textEmpty
      ? "Pular"
      : "Continuar";

  return (
    <div className="w-full">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(182,154,248,0.65)" }}>
        {section.title} · Pergunta {numberInSection} de {totalInSection}
      </p>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display font-bold text-white outline-none mt-3 mb-8"
        style={{ fontSize: "clamp(22px,3vw,30px)", lineHeight: 1.3, letterSpacing: "-0.02em" }}
      >
        {question.text}
      </h2>

      {question.type === "single" && (
        <SingleOptionList
          q={question as SingleQuestion}
          answers={answers}
          pressedIndex={pressedIndex}
          onSelect={onSelectSingle}
        />
      )}
      {question.type === "multi" && (
        <MultiOptionList
          q={question as MultiQuestion}
          answers={answers}
          pressedIndex={pressedIndex}
          onToggle={onToggleMulti}
        />
      )}
      {question.type === "text" && (
        <TextStep q={question as TextQuestion} answers={answers} onAnswer={onAnswerText} />
      )}

      {needsContinue && (
        <div className="mt-8">
          <Button onClick={onContinue} disabled={!complete}>
            {continueLabel}
            <span className="text-[11px] font-normal opacity-70" aria-hidden="true">↵</span>
          </Button>
        </div>
      )}
    </div>
  );
});
