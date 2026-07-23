import { describe, expect, it } from "vitest";
import {
  applyBlockerRules,
  getQuestionFlowState,
  getSectionProgress,
  PillarScore,
  SECTIONS,
} from "./data";

function pillarScores(overrides: Record<string, number>): PillarScore[] {
  const weights: Record<string, number> = { dados: 0.25, estrategia: 0.2, pessoas: 0.15, governanca: 0.15, tecnologia: 0.25 };
  return Object.entries(weights).map(([id, weight]) => ({
    id,
    title: id,
    weight,
    score: overrides[id] ?? 80,
  }));
}

const strategy = SECTIONS.find(section => section.id === "estrategia")!;
const technology = SECTIONS.find(section => section.id === "tecnologia")!;

function strategyQuestion(id: string) {
  return strategy.questions.find(question => question.id === id)!;
}

describe("conditional questionnaire progress", () => {
  it("keeps the maximum question count stable", () => {
    const initial = getSectionProgress(strategy, {});
    const afterBranchChoice = getSectionProgress(strategy, { est_q1: 3 });

    expect(initial.total).toBe(strategy.questions.length);
    expect(afterBranchChoice.total).toBe(initial.total);
  });

  it("distinguishes undecided branches from branches that were skipped", () => {
    expect(getQuestionFlowState(strategyQuestion("est_q1a"), strategy.questions, {})).toBe("pending");
    expect(getQuestionFlowState(strategyQuestion("est_q1a"), strategy.questions, { est_q1: 3 })).toBe("skipped");
    expect(getQuestionFlowState(strategyQuestion("est_q1a1"), strategy.questions, { est_q1: 3 })).toBe("skipped");
    expect(getQuestionFlowState(strategyQuestion("est_q1b"), strategy.questions, { est_q1: 3 })).toBe("visible");
  });

  it("counts skipped required questions as completed steps", () => {
    const progress = getSectionProgress(strategy, { est_q1: 3 });

    expect(progress.answered).toBe(4);
    expect(progress.complete).toBe(false);
  });

  it("completes a section when its selected branch is answered", () => {
    const progress = getSectionProgress(technology, { tec_q1: 1, tec_q1b: 3 });

    expect(progress.answered).toBe(progress.total);
    expect(progress.complete).toBe(true);
  });
});

describe("blocker rules", () => {
  it("flags a weak pillar as a blocker when the overall score is not strong", () => {
    const result = applyBlockerRules(60, pillarScores({ tecnologia: 30 }));

    expect(result.blocker).toContain("Tecnologia");
    expect(result.blockerPillar).toBe("tecnologia");
  });

  it("does not frame a weak pillar as blocking scale once the overall score is strong", () => {
    const result = applyBlockerRules(80, pillarScores({ tecnologia: 30 }));

    expect(result.blocker).toBeNull();
    expect(result.blockerPillar).toBeNull();
  });
});
