import { describe, expect, it } from "vitest";
import { AnswerRecord, isQuestionVisible, Question, SECTIONS } from "./data";
import { buildReportSnapshot } from "./reportSnapshot";

function bestAnswer(question: Question): number | number[] | string {
  if (question.type === "single") {
    return question.options.reduce((best, option) => option.score > best.score ? option : best).value;
  }
  if (question.type === "multi") return question.options.filter(option => !option.isNone).map(option => option.value);
  return "Context";
}

function bestAnswers(): AnswerRecord {
  const answers: AnswerRecord = {};
  for (let pass = 0; pass < 5; pass++) {
    for (const section of SECTIONS) {
      for (const question of section.questions) {
        if (question.id in answers || !isQuestionVisible(question, section.questions, answers)) continue;
        answers[question.id] = bestAnswer(question);
      }
    }
  }
  return answers;
}

function snapshotFor(answers: AnswerRecord) {
  return buildReportSnapshot({
    answers,
    participant: {
      name: "Teste Interno Snowfox",
      email: "teste-interno@snowfox.ai",
      storageAcknowledged: true,
    },
    submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
    clientSubmittedAt: "2026-08-04T20:00:00.000Z",
  });
}

describe("buildReportSnapshot", () => {
  it("builds one deterministic immutable report payload", () => {
    const input = {
      answers: {
        dados_q1: 2,
        dados_q2: 3,
        dados_q3: 1,
        est_q1: 3,
        est_q1b: 2,
        pess_q4: 2,
        pess_q6: 1,
        gov_q1: 2,
        gov_q2: 2,
        tec_q1: 1,
        tec_q1b: 2,
      },
      participant: {
        name: "Teste Interno Snowfox",
        email: "teste-interno@snowfox.ai",
        storageAcknowledged: true as const,
      },
      submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
      clientSubmittedAt: "2026-08-04T20:00:00.000Z",
    };

    const first = buildReportSnapshot(input);
    const second = buildReportSnapshot(input);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      schemaVersion: 1,
      assessmentVersion: 2,
      submissionId: input.submissionId,
      participant: input.participant,
      clientSubmittedAt: input.clientSubmittedAt,
      answers: input.answers,
    });
    expect(first.report.executiveSummary.priorityId).toBe(first.report.quarterlyRecommendations[0].priorityId);
    expect(first.report.quarterlyRecommendations[0].questionLedActivity).toBe(true);
    expect(first.report.quarterlyRecommendations[0].title).toBe("Lançar um programa aplicado de alfabetização em IA");
    expect(first.report.overallScore).toBeTypeOf("number");
    expect(first.report.pillarScores).toHaveLength(5);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.report)).toBe(true);
    expect(Object.isFrozen(first.report.pillarScores)).toBe(true);
  });

  it("keeps balanced advanced reports portfolio-led", () => {
    const answers = bestAnswers();
    answers.est_q1a1a = 1;
    const snapshot = snapshotFor(answers);

    expect(snapshot.report.executiveSummary.priorityId).toBe("portfolio");
    expect(snapshot.report.quarterlyRecommendations[0].priorityId).toBe("portfolio");
    expect(snapshot.report.quarterlyRecommendations[0].questionLedActivity).toBeUndefined();
  });

  it("aligns the executive recommendation with the selected lowest-pillar activity", () => {
    const answers = bestAnswers();
    answers.tec_q2a = 1;
    const snapshot = snapshotFor(answers);

    expect(snapshot.report.weakest.id).toBe("tecnologia");
    expect(snapshot.report.quarterlyRecommendations[0].title).toBe("Estabelecer práticas de MLOps e observabilidade de IA");
    expect(snapshot.report.executiveSummary).toMatchObject({
      priorityId: "tecnologia",
      recommendationTitle: "Estabelecer práticas de MLOps e observabilidade de IA",
      recommendationContext: "Engenharia de IA",
    });
    expect(snapshot.report.executiveSummary.immediateRecommendation.join(" ")).not.toContain("primeiro piloto");
  });
});
