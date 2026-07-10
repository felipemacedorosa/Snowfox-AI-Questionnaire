import { AnswerRecord, Question, SECTIONS, isQuestionVisible } from "@/app/data";

/**
 * The quiz flattened into a linear sequence of steps: a chapter intro per
 * pillar followed by its currently-visible questions. Conditional questions
 * always follow their parent inside the same section (verified for the whole
 * dataset), so answering a parent splices its children in right after the
 * current step.
 */
export type FlowStep =
  | { kind: "intro"; id: string; sectionIndex: number }
  | {
      kind: "question";
      id: string;
      sectionIndex: number;
      question: Question;
      numberInSection: number;
      totalInSection: number;
    };

export function buildFlowSteps(answers: AnswerRecord): FlowStep[] {
  const steps: FlowStep[] = [];
  SECTIONS.forEach((sec, sectionIndex) => {
    steps.push({ kind: "intro", id: `intro:${sec.id}`, sectionIndex });
    const visible = sec.questions.filter(q => isQuestionVisible(q, sec.questions, answers));
    visible.forEach((question, qi) => {
      steps.push({
        kind: "question",
        id: `q:${question.id}`,
        sectionIndex,
        question,
        numberInSection: qi + 1,
        totalInSection: visible.length,
      });
    });
  });
  return steps;
}

/** Intro and (optional) text steps are always passable; scored steps need an answer. */
export function isStepComplete(step: FlowStep, answers: AnswerRecord): boolean {
  if (step.kind === "intro") return true;
  const q = step.question;
  if (q.type === "text") return true;
  const ans = answers[q.id];
  if (q.type === "multi") return Array.isArray(ans) && (ans as number[]).length > 0;
  return typeof ans === "number";
}

export interface PillarProgress {
  sectionIndex: number;
  answered: number;
  total: number;
}

/** Progress over scored (non-text) visible questions. */
export function computeProgress(
  steps: FlowStep[],
  answers: AnswerRecord,
): { answered: number; total: number; perPillar: PillarProgress[] } {
  const perPillar: PillarProgress[] = SECTIONS.map((_, sectionIndex) => ({
    sectionIndex,
    answered: 0,
    total: 0,
  }));

  for (const step of steps) {
    if (step.kind !== "question" || step.question.type === "text") continue;
    const bucket = perPillar[step.sectionIndex];
    bucket.total += 1;
    if (isStepComplete(step, answers)) bucket.answered += 1;
  }

  const answered = perPillar.reduce((sum, p) => sum + p.answered, 0);
  const total = perPillar.reduce((sum, p) => sum + p.total, 0);
  return { answered, total, perPillar };
}

/** Index of the first unanswered scored question, or -1 when everything is done. */
export function firstIncompleteIndex(steps: FlowStep[], answers: AnswerRecord): number {
  return steps.findIndex(
    step => step.kind === "question" && step.question.type !== "text" && !isStepComplete(step, answers),
  );
}
