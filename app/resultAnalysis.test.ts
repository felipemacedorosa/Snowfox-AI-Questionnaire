import { describe, expect, it } from "vitest";
import { AnswerRecord, AssessmentResult, PillarScore } from "./data";
import {
  buildQuestionEvidence,
  getCriticalPath,
  getNextLevelTarget,
  getOpportunityTracks,
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
      targetState: "Dados suficientes",
    });
    expect(evidence.some(item => item.id === "est_q1a")).toBe(false);
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
  it("keeps Data Foundation recommended when the gated tracks are also viable", () => {
    const answers: AnswerRecord = { dados_q1: 3, dados_q2: 3, dados_q4: 3 };
    const tracks = getOpportunityTracks(answers, scores({ dados: 72, estrategia: 68, pessoas: 55, governanca: 52, tecnologia: 63 }));
    expect(tracks.map(track => track.status)).toEqual(["recommended", "ready", "ready"]);
  });

  it("recommends Data Foundation without requirements while deferring unsupported predictive work", () => {
    const tracks = getOpportunityTracks({}, scores({ dados: 25, estrategia: 65, pessoas: 42, governanca: 42, tecnologia: 30 }));
    expect(tracks.find(track => track.id === "data-foundation")).toMatchObject({
      status: "recommended",
      statusLabel: "Solução recomendada",
      prerequisites: [],
    });
    expect(tracks.find(track => track.id === "predictive-agents")?.status).toBe("defer");
  });
});

describe("next level", () => {
  it("returns the next score threshold without implying a benchmark", () => {
    expect(getNextLevelTarget(moderateResult)).toEqual({ label: "Prontidão Alta", threshold: 75, scoreDelta: 11 });
  });
});
