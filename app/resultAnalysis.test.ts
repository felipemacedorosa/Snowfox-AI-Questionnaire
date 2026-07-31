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
import { buildExecutiveSummary, buildQuarterlyRecommendations } from "./resultInsights";

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

  it("surfaces the scale blockers and delivery gaps named in the assessment feedback", () => {
    const answers: AnswerRecord = {
      dados_q2: 2,
      dados_q4: 2,
      dados_q6: 1,
      dados_q7: 2,
      gov_q1: 2,
      gov_q2: 1,
    };
    const signals = getRiskSignals(answers, scores({ dados: 45, governanca: 35 }));

    expect(signals.find(signal => signal.id === "dados-dependencia-pessoas-chave")?.band).toBe("blocks-scale");
    expect(signals.find(signal => signal.id === "dados-sensiveis-e-controles")?.band).toBe("blocks-scale");
    expect(signals.find(signal => signal.id === "dados-historico-curto")?.band).toBe("blocks-scale");
    expect(signals.find(signal => signal.id === "dados-confianca-fragil")?.band).toBe("blocks-scale");
    expect(signals.find(signal => signal.id === "governanca-processos-parciais")?.band).toBe("blocks-scale");
  });

  it("never leaves a sub-60 profile without a scale blocker", () => {
    const answers: AnswerRecord = { dados_q1: 2, est_q1: 2, pess_q4: 3, gov_q1: 3, tec_q1: 1, tec_q1b: 2 };
    const signals = getRiskSignals(answers, scores({ dados: 50, estrategia: 50, pessoas: 50, governanca: 50, tecnologia: 45 }));

    expect(signals.some(signal => signal.band === "blocks-scale")).toBe(true);
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

  it("moves an experienced high-readiness portfolio from testing to expansion", () => {
    const answers: AnswerRecord = {
      dados_q1: 3,
      dados_q2: 5,
      dados_q4: 4,
      tec_q1: 3,
      tec_q2e: 2,
    };
    const tracks = getOpportunityTracks(answers, scores({ dados: 96, estrategia: 92, pessoas: 90, governanca: 91, tecnologia: 95 }));
    const automation = tracks.find(track => track.id === "automation-agents")!;
    const predictive = tracks.find(track => track.id === "predictive-agents")!;

    expect(tracks.find(track => track.id === "data-foundation")).toMatchObject({ status: "maintain", statusLabel: "Manter e expandir" });
    expect(automation.statusLabel).toBe("Escalar e reutilizar");
    expect(`${automation.summary} ${automation.startAction}`).not.toMatch(/testar|primeiro piloto/i);
    expect(predictive).toMatchObject({ isFeatured: true, statusLabel: "Expandir portfólio" });
    expect(`${predictive.summary} ${predictive.startAction}`).not.toMatch(/explorar modelos|escolher uma decisão/i);
  });
});

describe("score-aware result copy", () => {
  it("frames a low score around the main limiter and isolated-pilot risk", () => {
    const pillarScores = scores({ dados: 28, estrategia: 42, pessoas: 38, governanca: 31, tecnologia: 36 });
    const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
    const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
    const summary = buildExecutiveSummary({
      answers: {},
      pillarScores,
      result: { score: 34, level: "Prontidão Baixa", blocker: null },
      strongest,
      weakest,
    });

    expect(summary.currentSituation.join(" ")).toContain("espaço significativo de evolução");
    expect(summary.currentSituation.join(" ")).toContain("O principal limitador hoje é Dados");
    expect(summary.currentSituation.join(" ")).toContain("restrita a pilotos isolados");
  });

  it("puts a practical governed pilot in the second quarter for sub-60 profiles", () => {
    const pillarScores = scores({ dados: 42, estrategia: 55, pessoas: 45, governanca: 38, tecnologia: 48 });
    const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
    const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
    const roadmap = buildQuarterlyRecommendations({
      answers: {},
      pillarScores,
      result: { score: 50, level: "Prontidão Emergente", blocker: null },
      strongest,
      weakest,
    });

    expect(roadmap.map(item => item.focus)).toEqual([
      "Preparar base e mudança",
      "Pilotar agente e governança",
      "Expandir o piloto",
    ]);
    expect(roadmap[1].title).toContain("governança focada no piloto");
    expect(roadmap[1].successMetric).toContain("fluxo real");
  });

  it("does not tell an advanced profile to rebuild its foundation", () => {
    const pillarScores = scores({ dados: 96, estrategia: 92, pessoas: 90, governanca: 91, tecnologia: 95 });
    const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
    const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
    const result: AssessmentResult = { score: 93, level: "Prontidão Avançada", blocker: null };
    const answers: AnswerRecord = { dados_q1: 3, dados_q2: 5, dados_q4: 4, tec_q1: 3, tec_q2e: 2 };
    const summary = buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest });
    const roadmap = buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest });

    expect(summary.currentSituation.join(" ")).not.toContain("principal limitador");
    expect(summary.currentSituation.join(" ")).toContain("ampliar soluções comprovadas");
    expect(summary.recommendationTitle).toBe("Predictive Agents");
    expect(roadmap[0].focus).toBe("Consolidar Data Foundation");
    expect(roadmap[0].title).toContain("Ampliar");
  });
});

describe("next level", () => {
  it("returns the next score threshold without implying a benchmark", () => {
    expect(getNextLevelTarget(moderateResult)).toEqual({ label: "Prontidão Alta", threshold: 75, scoreDelta: 11 });
  });
});
