import { describe, expect, it } from "vitest";
import { buildReportSnapshot } from "./reportSnapshot";

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
    expect(first.report.overallScore).toBeTypeOf("number");
    expect(first.report.pillarScores).toHaveLength(5);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.report)).toBe(true);
    expect(Object.isFrozen(first.report.pillarScores)).toBe(true);
  });
});
