import { describe, expect, it } from "vitest";
import { AnswerRecord, AssessmentResult, PillarScore } from "./data";
import { buildExecutiveSummary } from "./resultInsights";

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
