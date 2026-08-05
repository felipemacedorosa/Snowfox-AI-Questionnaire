import { describe, expect, it } from "vitest";
import {
  AnswerRecord,
  AssessmentResult,
  calculateOverallScore,
  getQuestionMax,
  isQuestionScored,
  PillarScore,
  SECTIONS,
} from "./data";
import { buildStrategyGapTestAnswers } from "./devShortcuts";
import {
  buildQuestionEvidence,
  getCriticalPath,
  getNextLevelTarget,
  getOpportunityTracks,
  getQuestionNextAction,
  getReadinessProfile,
  getRiskSignals,
} from "./resultAnalysis";

function scores(overrides: Partial<Record<string, number>> = {}): PillarScore[] {
  return [
    { id: "dados", title: "Dados", weight: 0.25, score: overrides.dados ?? 60 },
    { id: "estrategia", title: "Estratégia", weight: 0.20, score: overrides.estrategia ?? 60 },
    { id: "pessoas", title: "Pessoas e Cultura", weight: 0.15, score: overrides.pessoas ?? 60 },
    { id: "governanca", title: "Governança e Processo", weight: 0.15, score: overrides.governanca ?? 60 },
    { id: "tecnologia", title: "Tecnologia", weight: 0.25, score: overrides.tecnologia ?? 60 },
  ];
}

const moderateResult: AssessmentResult = { score: 64, level: "Prontidão Moderada", blocker: null };

describe("getReadinessProfile", () => {
  it("selects integrated readiness before other profiles", () => {
    expect(getReadinessProfile(scores({ dados: 82, estrategia: 80, pessoas: 76, governanca: 79, tecnologia: 84 }), { score: 80, level: "Prontidão Alta", blocker: null }).id).toBe("integrated");
  });

  it("detects governance lag when scale is ahead of controls", () => {
    expect(getReadinessProfile(scores({ dados: 75, estrategia: 75, pessoas: 65, governanca: 32, tecnologia: 78 }), { score: 68, level: "Prontidão Emergente", blocker: "Governança limita a escala" }).id).toBe("governance-lag");
  });

  it("uses the uneven profile when the score spread is material", () => {
    expect(getReadinessProfile(scores({ dados: 40, estrategia: 66, pessoas: 51, governanca: 48, tecnologia: 72 }), { score: 53, level: "Prontidão Emergente", blocker: null }).id).toBe("uneven");
  });

  it("never returns a warning-toned profile in the 75-84 range, even with one lagging pillar", () => {
    // governanca=35 alone would otherwise trigger "governance-lag"; none of that
    // should surface once the overall score reads strong.
    const profile = getReadinessProfile(
      scores({ dados: 90, estrategia: 90, pessoas: 90, governanca: 35, tecnologia: 90 }),
      { score: 79, level: "Prontidão Alta", blocker: null },
    );
    expect(profile.id).toBe("strong-with-focus");
    expect(profile.summary).toContain("Governança e Processo");
  });

  it("uses the top excellence bracket at 85+ overall with a lagging pillar", () => {
    const profile = getReadinessProfile(
      scores({ dados: 100, estrategia: 100, pessoas: 100, governanca: 35, tecnologia: 100 }),
      { score: 87, level: "Prontidão Alta", blocker: null },
    );
    expect(profile.id).toBe("excellence-with-focus");
    expect(profile.summary).toContain("Governança e Processo");
  });

  it("uses the top excellence bracket at 85+ overall when every pillar is strong", () => {
    const profile = getReadinessProfile(
      scores({ dados: 92, estrategia: 88, pessoas: 90, governanca: 85, tecnologia: 90 }),
      { score: 89, level: "Prontidão Alta", blocker: null },
    );
    expect(profile.id).toBe("excellence");
  });
});

describe("answer evidence", () => {
  it("normalizes selected answers and excludes hidden stale branches", () => {
    const answers: AnswerRecord = {
      dados_q1: 2,
      est_q1: 3,
      est_q1a: 1,
    };
    const evidence = buildQuestionEvidence(answers);
    expect(evidence.find(item => item.id === "dados_q1")).toMatchObject({
      answer: "Dados parciais",
      normalizedScore: 50,
      targetState: "Definir as decisões prioritárias e garantir dados suficientes e relevantes para sustentá-las.",
    });
    expect(evidence.some(item => item.id === "est_q1a")).toBe(false);
  });

  it("keeps the selected delay reason as context instead of a scored gap", () => {
    const evidence = buildQuestionEvidence({ est_q3: 5, est_q3a: 1, est_q3a1: 3 });
    expect(evidence.find(item => item.id === "est_q3a1")).toMatchObject({
      answer: "Falta de priorização da alta liderança",
      normalizedScore: null,
      kind: "context",
      targetState: null,
    });
  });

  it("uses an authored action instead of the next answer label", () => {
    const evidence = buildQuestionEvidence({ est_q1: 3, est_q1b: 3 });
    const strategy = evidence.find(item => item.id === "est_q1")!;
    expect(strategy.targetState).toContain("comitê executivo");
    expect(strategy.targetState).toContain("ROI");
    expect(strategy.targetState).not.toMatch(/^(Sim|Não|Parcialmente|Formal)$/);
  });

  it("authors a next action for every scored question", () => {
    for (const question of SECTIONS.flatMap(section => section.questions)) {
      if (!isQuestionScored(question) || getQuestionMax(question) === 0) continue;
      expect(getQuestionNextAction(question.id), question.id).toBeTruthy();
    }
  });
});

describe("critical path and risks", () => {
  it("places an active data blocker first", () => {
    const answers: AnswerRecord = { dados_q1: 1, dados_q2: 1, dados_q4: 1, gov_q1: 2, tec_q1: 1, tec_q1b: 2 };
    const result: AssessmentResult = {
      score: 68,
      level: "Prontidão Emergente",
      blocker: "Sua pontuação geral é promissora, mas sua pontuação em Dados limita a capacidade atual de escalar IA de forma confiável.",
    };
    const path = getCriticalPath(answers, scores({ dados: 20, governanca: 45, tecnologia: 45 }), result);
    expect(path[0]).toMatchObject({ pillar: "dados", isBlocker: true });
  });

  it("classifies a critical low-data insight as a scale blocker", () => {
    const answers: AnswerRecord = { dados_q1: 1 };
    const signals = getRiskSignals(answers, scores({ dados: 20 }));
    expect(signals.some(signal => signal.pillar === "dados" && signal.band === "blocks-scale")).toBe(true);
  });
});

describe("opportunity tracks", () => {
  it("does not feature Data Foundation as a universal recommendation", () => {
    const answers: AnswerRecord = { dados_q1: 3, dados_q2: 3, dados_q4: 3 };
    const tracks = getOpportunityTracks(answers, scores({ dados: 72, estrategia: 68, pessoas: 55, governanca: 52, tecnologia: 63 }));
    expect(tracks.find(track => track.id === "data-foundation")).toMatchObject({
      status: "prepare",
      isFeatured: false,
      statusLabel: "Preparar a base",
    });
    expect(tracks.filter(track => track.isFeatured)).toHaveLength(0);
  });

  it("keeps unsupported predictive work deferred without declaring a technical winner", () => {
    const tracks = getOpportunityTracks({}, scores({ dados: 25, estrategia: 65, pessoas: 42, governanca: 42, tecnologia: 30 }));
    expect(tracks.find(track => track.id === "data-foundation")?.status).toBe("prepare");
    expect(tracks.find(track => track.id === "predictive-agents")?.status).toBe("defer");
    expect(tracks.every(track => !track.isFeatured)).toBe(true);
  });

  it("features only a proven advanced agent expansion", () => {
    const answers = buildStrategyGapTestAnswers();
    expect(calculateOverallScore(answers)).toBeGreaterThanOrEqual(75);
    const tracks = getOpportunityTracks(answers, scores({ dados: 90, estrategia: 85, pessoas: 80, governanca: 82, tecnologia: 90 }));
    expect(tracks.find(track => track.id === "predictive-agents")?.isFeatured).toBe(true);
    expect(tracks.find(track => track.id === "data-foundation")?.isFeatured).toBe(false);
  });

  it("does not feature agent expansion below an overall score of 75", () => {
    const answers: AnswerRecord = {
      dados_q1: 3,
      dados_q2: 5,
      dados_q4: 4,
      tec_q1: 3,
      tec_q2a: 3,
      tec_q2b: 3,
      tec_q2c: 4,
      tec_q2d: 3,
      tec_q2e: 2,
      tec_q2f: 3,
    };
    expect(calculateOverallScore(answers)).toBeLessThan(75);
    const tracks = getOpportunityTracks(answers, scores({ dados: 90, estrategia: 85, pessoas: 80, governanca: 82, tecnologia: 90 }));
    expect(tracks.every(track => !track.isFeatured)).toBe(true);
  });
});

describe("next level", () => {
  it("returns the next score threshold without implying a benchmark", () => {
    expect(getNextLevelTarget(moderateResult)).toEqual({ label: "Prontidão Alta", threshold: 75, scoreDelta: 11 });
  });
});
