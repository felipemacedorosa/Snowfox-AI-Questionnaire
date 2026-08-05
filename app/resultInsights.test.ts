import { describe, expect, it } from "vitest";
import { AnswerRecord, AssessmentResult, PillarScore } from "./data";
import { buildExecutiveSummary, buildQuarterlyRecommendations, selectResultInsights } from "./resultInsights";

function scores(overrides: Partial<Record<string, number>> = {}): PillarScore[] {
  return [
    { id: "dados", title: "Dados", weight: 0.25, score: overrides.dados ?? 60 },
    { id: "estrategia", title: "Estratégia", weight: 0.20, score: overrides.estrategia ?? 60 },
    { id: "pessoas", title: "Pessoas e Cultura", weight: 0.15, score: overrides.pessoas ?? 60 },
    { id: "governanca", title: "Governança e Processo", weight: 0.15, score: overrides.governanca ?? 60 },
    { id: "tecnologia", title: "Tecnologia", weight: 0.25, score: overrides.tecnologia ?? 60 },
  ];
}

function build(pillarScores: PillarScore[], result: AssessmentResult, answers: AnswerRecord = {}) {
  const strongest = pillarScores.reduce((a, b) => (b.score > a.score ? b : a));
  const weakest = pillarScores.reduce((a, b) => (b.score < a.score ? b : a));
  return buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest });
}

function summarize(pillarScores: PillarScore[], answers: AnswerRecord = {}) {
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const result: AssessmentResult = { score: 58, level: "Prontidão Emergente", blocker: null };
  return {
    summary: buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest }),
    roadmap: buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest }),
  };
}

describe("buildExecutiveSummary", () => {
  it("never restates the overall score in either paragraph", () => {
    const summary = build(
      scores({ dados: 80, estrategia: 78, pessoas: 82, governanca: 60, tecnologia: 85 }),
      { score: 77, level: "Prontidão Alta", blocker: null },
    );
    expect(summary.strengths).not.toContain("77");
    expect(summary.opportunities).not.toContain("77");
  });

  it("names the strongest pillar with a reason when it genuinely clears the bar", () => {
    const summary = build(
      scores({ dados: 80, estrategia: 78, pessoas: 82, governanca: 60, tecnologia: 85 }),
      { score: 77, level: "Prontidão Alta", blocker: null },
    );
    expect(summary.strengths).toContain("Tecnologia");
    expect(summary.strengths).toContain("vantagem real");
  });

  it("doesn't fabricate a strength when not even the strongest pillar clears the bar", () => {
    const summary = build(
      scores({ dados: 30, estrategia: 45, pessoas: 25, governanca: 20, tecnologia: 35 }),
      { score: 31, level: "Prontidão Baixa", blocker: null },
    );
    expect(summary.strengths).not.toMatch(/Estratégia.*vantagem real/);
    expect(summary.strengths).toMatch(/nível consistente|base mínima/);
  });

  it("stays fully positive in the opportunities paragraph when every pillar is strong", () => {
    const summary = build(
      scores({ dados: 90, estrategia: 88, pessoas: 92, governanca: 76, tecnologia: 95 }),
      { score: 88, level: "Prontidão Avançada", blocker: null },
    );
    expect(summary.opportunities).not.toContain("Sem avançar aqui");
    expect(summary.opportunities).toContain("Processos e responsabilidades");
  });

  it("uses subtle criticism (no consequence clause) when overall score is strong but one pillar lags", () => {
    const summary = build(
      scores({ dados: 95, estrategia: 95, pessoas: 95, governanca: 35, tecnologia: 95 }),
      { score: 83, level: "Prontidão Alta", blocker: null },
    );
    expect(summary.opportunities).toContain("Processos e responsabilidades");
    expect(summary.opportunities).not.toContain("Sem avançar aqui");
  });

  it("includes the full consequence clause when the overall score is not yet strong", () => {
    const summary = build(
      scores({ dados: 55, estrategia: 60, pessoas: 50, governanca: 30, tecnologia: 58 }),
      { score: 51, level: "Prontidão Emergente", blocker: null },
    );
    expect(summary.opportunities).toContain("Sem avançar aqui");
  });

  it("uses the urgent framing for a critically low opportunity pillar", () => {
    const summary = build(
      scores({ dados: 55, estrategia: 60, pessoas: 50, governanca: 15, tecnologia: 58 }),
      { score: 48, level: "Prontidão Emergente", blocker: null },
    );
    expect(summary.opportunities).toContain("O ponto mais urgente é");
  });
});

describe("shared organizational priority", () => {
  it("classifies the operational-capacity insight under Governance and Process", () => {
    const insight = selectResultInsights(
      { dados_q3: 1 },
      scores({ dados: 70, estrategia: 66, pessoas: 62, governanca: 58, tecnologia: 64 }),
    ).find(item => item.questionId === "dados_q3");

    expect(insight).toMatchObject({
      id: "governanca-06",
      pillar: "governanca",
      theme: "governanca-escalabilidade",
    });
  });

  it("aligns a people opportunity with the executive priority and first roadmap action", () => {
    const pillarScores = scores({ dados: 72, estrategia: 68, pessoas: 18, governanca: 62, tecnologia: 64 });
    const { summary, roadmap } = summarize(pillarScores, { pess_q4: 1, pess_q6: 1 });

    expect(summary.opportunities).toContain("Pessoas e Cultura");
    expect(summary.priorityId).toBe("pessoas");
    expect(summary.recommendationTitle).toBe("Programa de adoção e capacitação");
    expect(summary.immediateRecommendation.join(" ")).toMatch(/adoção|capacitação/);
    expect(roadmap[0]).toMatchObject({ priorityId: "pessoas" });
    expect(`${roadmap[0].focus} ${roadmap[0].title} ${roadmap[0].action}`).toMatch(/Pessoas|equipe|adoção|capacitação/i);
    expect(`${summary.immediateRecommendation.join(" ")} ${roadmap[0].action}`).not.toContain("Data Foundation");
  });

  it.each([
    ["dados", { dados: 15, estrategia: 68, pessoas: 62, governanca: 64, tecnologia: 66 }, "Fundação de dados orientada ao caso de uso"],
    ["estrategia", { dados: 70, estrategia: 15, pessoas: 62, governanca: 64, tecnologia: 66 }, "Comitê executivo e portfólio de IA"],
    ["governanca", { dados: 70, estrategia: 68, pessoas: 62, governanca: 15, tecnologia: 66 }, "Modelo de governança e processo"],
    ["tecnologia", { dados: 70, estrategia: 68, pessoas: 62, governanca: 64, tecnologia: 15 }, "Base técnica de entrega"],
  ] as const)("uses %s as opportunity, recommendation, and quarter-one priority", (id, overrides, title) => {
    const { summary, roadmap } = summarize(scores(overrides));
    expect(summary.priorityId).toBe(id);
    expect(summary.recommendationTitle).toBe(title);
    expect(roadmap[0].priorityId).toBe(id);
  });

  it("uses portfolio management only for balanced advanced profiles", () => {
    const pillarScores = scores({ dados: 82, estrategia: 80, pessoas: 79, governanca: 81, tecnologia: 83 });
    const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
    const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
    const result: AssessmentResult = { score: 81, level: "Prontidão Alta", blocker: null };
    const summary = buildExecutiveSummary({ answers: {}, pillarScores, result, strongest, weakest });
    expect(summary).toMatchObject({ priorityId: "portfolio", recommendationTitle: "Gestão do portfólio de IA" });
  });
});
