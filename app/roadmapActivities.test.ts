import { describe, expect, it } from "vitest";
import { CriticalPathGate } from "./resultAnalysis";
import { buildLowestPillarRoadmap, buildQuestionLedRoadmap } from "./roadmapActivities";

function gate(id: string, pillar: CriticalPathGate["pillar"]): CriticalPathGate {
  return {
    id,
    pillar,
    pillarTitle: pillar,
    question: `Question ${id}`,
    currentState: "Current weak state",
    targetState: "Target capability",
    reason: "This capability limits reliable progress.",
    dependency: "A prioritized business case",
    normalizedScore: 0,
    isBlocker: false,
  };
}

describe("buildQuestionLedRoadmap", () => {
  it("maps weak answers to distinct roadmap activity lanes", () => {
    const roadmap = buildQuestionLedRoadmap([
      gate("dados_q7", "dados"),
      gate("est_q1a", "estrategia"),
      gate("pess_q6", "pessoas"),
    ], {}, "pt");

    expect(roadmap?.map(item => item.title)).toEqual([
      "Estabelecer um framework de qualidade de dados",
      "Priorizar os casos de uso iniciais de IA",
      "Lançar um programa aplicado de alfabetização em IA",
    ]);
    expect(roadmap?.map(item => item.focus)).toEqual([
      "Dados para IA",
      "Valor da IA",
      "Pessoas e Cultura",
    ]);
    expect(roadmap?.every(item => item.questionLedActivity === true)).toBe(true);
  });

  it("covers governance, engineering, and value-monitoring gaps", () => {
    const roadmap = buildQuestionLedRoadmap([
      gate("gov_q2", "governanca"),
      gate("tec_q2a", "tecnologia"),
      gate("tec_q2e", "tecnologia"),
    ], {}, "en");

    expect(roadmap?.map(item => item.title)).toEqual([
      "Define initial AI policies and decision rights",
      "Establish MLOps and AI observability practices",
      "Set up an AI value monitoring system",
    ]);
    expect(roadmap?.[0].ownerRole).toContain("Risk");
    expect(roadmap?.[1].successMetric.toLowerCase()).toContain("production");
    expect(roadmap?.[2].successMetric).toContain("baseline");
  });

  it("routes a delay gap through the respondent's stated cause", () => {
    const leadershipDelay = buildQuestionLedRoadmap(
      [gate("est_q3a", "governanca")],
      { est_q3a1: 3 },
      "pt",
    );
    const integrationDelay = buildQuestionLedRoadmap(
      [gate("est_q3a", "governanca")],
      { est_q3a1: 4 },
      "pt",
    );

    expect(leadershipDelay?.[0].title).toBe("Definir liderança e direitos de decisão para IA");
    expect(integrationDelay?.[0].title).toBe("Definir uma arquitetura de referência para IA");
  });

  it("deduplicates repeated activities while retaining roadmap order", () => {
    const roadmap = buildQuestionLedRoadmap([
      gate("est_q1", "estrategia"),
      gate("est_q1b", "estrategia"),
      gate("gov_q2", "governanca"),
    ], {}, "pt");

    expect(roadmap).toHaveLength(2);
    expect(roadmap?.map(item => item.id)).toEqual(["q1", "q2"]);
  });

  it("returns null when there are no weak question gates", () => {
    expect(buildQuestionLedRoadmap([], {}, "pt")).toBeNull();
  });

  it("builds recommendations only from weak answers in the lowest pillar", () => {
    const roadmap = buildLowestPillarRoadmap({
      dados_q1: 1,
      dados_q5: 1,
      dados_q7: 1,
      est_q1: 3,
      est_q1b: 3,
    }, "dados", "pt");

    expect(roadmap).toHaveLength(3);
    expect(roadmap?.every(item => item.priorityId === "dados")).toBe(true);
    expect(roadmap?.map(item => item.title)).toEqual([
      "Avaliar a prontidão dos dados para IA",
      "Implementar observabilidade de dados",
      "Estabelecer um framework de qualidade de dados",
    ]);
  });

  it("uses the lowest improvable answer when the lowest pillar has no sub-50 gap", () => {
    const roadmap = buildLowestPillarRoadmap({
      dados_q1: 2,
      dados_q2: 4,
      dados_q4: 4,
      dados_q5: 4,
      dados_q6: 4,
      dados_q7: 5,
    }, "dados", "pt");

    expect(roadmap?.[0]).toMatchObject({
      priorityId: "dados",
      title: "Avaliar a prontidão dos dados para IA",
      questionLedActivity: true,
    });
  });

  it("uses contextual data architecture gaps when scored data answers leave room", () => {
    const roadmap = buildLowestPillarRoadmap({
      dados_q1: 3,
      dados_q2: 5,
      dados_q4: 4,
      dados_q5: 4,
      dados_q6: 4,
      dados_q7: 5,
      dados_q8: 1,
    }, "dados", "pt");

    expect(roadmap?.[0].title).toBe("Desenvolver capacidades de analytics para IA");
  });
});
