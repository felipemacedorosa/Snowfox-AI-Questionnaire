import { describe, expect, it } from "vitest";
import {
  applyBlockerRules,
  calculateOverallScore,
  calculatePillarScores,
  getAllQuestions,
  getQuestionFlowState,
  getSectionProgress,
  isQuestionScored,
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

function question(id: string) {
  return SECTIONS.flatMap(section => section.questions).find(item => item.id === id)!;
}

function localizedQuestion(id: string) {
  return getAllQuestions("pt").find(item => item.id === id)!;
}

// "Não sei afirmar" is reserved for questions a respondent can only answer with
// visibility into systems, infrastructure, or the internals of AI projects.
// Strategy, people, and process questions are answerable from lived experience,
// so an uncertainty escape there only invites opting out of the assessment.
const UNKNOWN_IDS = [
  "dados_q4", "dados_q6", "dados_q8", "dados_q9", "gov_q2",
  "pess_q3", "tec_q1", "tec_q1b", "tec_q1c", "tec_q1e", "tec_q1f",
  "tec_q2a", "tec_q2b", "tec_q2e", "tec_q2f",
] as const;

// est_q3a1 also carries the answer, but as required unscored context rather than
// a technical question, and on value 7 because 1-6 are taken. Asserted separately.
const UNKNOWN_ALLOWED: readonly string[] = [...UNKNOWN_IDS, "est_q3a1"];

describe("questionnaire content and answer semantics", () => {
  it("moves operational capacity from Data to Governance and Process", () => {
    const data = SECTIONS.find(section => section.id === "dados")!;
    const governance = SECTIONS.find(section => section.id === "governanca")!;

    expect(data.questions.some(item => item.id === "dados_q3")).toBe(false);
    expect(governance.questions.some(item => item.id === "dados_q3")).toBe(true);
    expect(question("dados_q3").pillar).toBe("governanca");

    const byPillar = Object.fromEntries(
      calculatePillarScores({ dados_q3: 3 }).map(item => [item.id, item.score])
    );
    expect(byPillar.dados).toBe(0);
    expect(byPillar.governanca).toBe(100);
    expect(calculateOverallScore({ dados_q3: 3 })).toBe(5);
  });

  it("defines economic value where the respondent answers the question", () => {
    expect(localizedQuestion("est_q1b").context).toBe(
      "Valor econômico é o impacto mensurável que a IA pode gerar, como reduzir custos ou tempo, aumentar receita, melhorar previsões e decisões recorrentes ou transformar dados em novos produtos, serviços e experiências."
    );
  });

  it("offers one explicit uncertainty answer on every approved question", () => {
    for (const id of UNKNOWN_IDS) {
      const item = localizedQuestion(id);
      expect(item.type).not.toBe("text");
      if (item.type === "text") continue;
      expect(item.options.filter(option => option.label === "Não sei afirmar")).toHaveLength(1);
      expect(item.options.find(option => option.label === "Não sei afirmar")).toMatchObject({
        value: 0,
        score: 0,
        isUnknown: true,
      });
    }
  });

  it("offers no uncertainty answer anywhere else", () => {
    const approved = new Set(UNKNOWN_ALLOWED);
    for (const item of getAllQuestions("pt")) {
      if (approved.has(item.id) || item.type === "text") continue;
      expect({
        id: item.id,
        unknown: item.options.some(option => option.label === "Não sei afirmar"),
      }).toEqual({ id: item.id, unknown: false });
    }
  });

  it("keeps the pre-existing uncertainty wording on questions that already had it", () => {
    for (const [id, label] of [
      ["dados_q1", "Sem clareza"],
      ["pess_q5", "Sem conhecimento"],
      ["tec_q1d", "Não sei"],
      ["tec_q2c", "Não sei"],
    ] as const) {
      const item = localizedQuestion(id);
      if (item.type === "text") continue;
      expect(item.options.some(option => option.label === label)).toBe(true);
    }
  });

  it("keeps unknown expertise exclusive from concrete expertise", () => {
    const expertise = localizedQuestion("pess_q3");
    expect(expertise.type).toBe("multi");
    if (expertise.type !== "multi") return;
    expect(expertise.options.find(option => option.isUnknown)).toMatchObject({
      value: 0,
      isNone: true,
    });
  });

  it("turns delay reason into required unscored context", () => {
    const delayReason = localizedQuestion("est_q3a1");
    expect(delayReason.type).toBe("single");
    expect(isQuestionScored(question("est_q3a1"))).toBe(false);
    if (delayReason.type !== "single") return;
    expect(delayReason.options.map(option => option.label)).toEqual([
      "Falta de engajamento ou disponibilidade dos times",
      "Desalinhamento entre o escopo e o processo interno real",
      "Falta de priorização da alta liderança",
      "Dependências de dados ou integrações",
      "Requisitos ou aprovações pouco claros",
      "Outro motivo",
      "Não sei afirmar",
    ]);

    const withoutReason = { est_q3: 5, est_q3a: 3 };
    const withReason = { ...withoutReason, est_q3a1: 1 };
    expect(calculateOverallScore(withReason)).toBe(calculateOverallScore(withoutReason));
    expect(calculatePillarScores(withReason)).toEqual(calculatePillarScores(withoutReason));
  });

  it("does not ask for a delay reason when there are no initiatives to assess", () => {
    const delayReason = strategy.questions.find(item => item.id === "est_q3a1")!;
    expect(getQuestionFlowState(delayReason, strategy.questions, { est_q3: 5, est_q3a: 5 })).toBe("skipped");
    expect(getQuestionFlowState(delayReason, strategy.questions, { est_q3: 5, est_q3a: 4 })).toBe("skipped");
  });
});

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
