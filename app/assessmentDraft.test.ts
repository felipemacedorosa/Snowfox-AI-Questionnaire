import { describe, expect, it } from "vitest";
import { buildAssessmentDraft, parseAssessmentDraft } from "./assessmentDraft";
import { buildReportSnapshot } from "./reportSnapshot";

const validSnapshot = buildReportSnapshot({
  answers: { tec_q1: 1, tec_q1b: 2 },
  participant: {
    name: "Teste Draft",
    email: "draft@snowfox.ai",
    companyName: "Draft Industria",
    jobTitle: "Gerente de Dados",
    storageAcknowledged: true,
  },
  submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
  clientSubmittedAt: "2026-08-04T20:00:00.000Z",
});

function makeValidDraft(overrides: Record<string, unknown> = {}) {
  return {
    version: 2,
    screen: "results",
    resumeScreen: "results",
    section: 4,
    answers: validSnapshot.answers,
    pendingReport: validSnapshot,
    reportReceipt: null,
    updatedAt: "2026-08-04T20:00:00.000Z",
    ...overrides,
  };
}

describe("parseAssessmentDraft", () => {
  it("migrates a draft saved on the removed landing screen to the quiz", () => {
    const parsed = parseAssessmentDraft(makeValidDraft({
      screen: "landing",
      resumeScreen: "quiz",
      section: 2,
      answers: { tec_q1: 1 },
      pendingReport: null,
    }));

    // The answers are the point: rejecting this draft would wipe the saved
    // progress of anyone mid-assessment when the landing screen was removed.
    expect(parsed?.screen).toBe("quiz");
    expect(parsed?.answers).toEqual({ tec_q1: 1 });
    expect(parsed?.section).toBe(2);
  });

  it("migrates a version-1 completed draft to an unsaved version-2 report", () => {
    expect(parseAssessmentDraft({
      version: 1,
      screen: "results",
      resumeScreen: "results",
      section: 4,
      answers: { tec_q1: 1, tec_q1b: 2 },
      updatedAt: "2026-08-04T19:00:00.000Z",
    })).toEqual({
      version: 2,
      screen: "results",
      resumeScreen: "results",
      section: 4,
      answers: { tec_q1: 1, tec_q1b: 2 },
      pendingReport: null,
      reportReceipt: null,
      updatedAt: "2026-08-04T19:00:00.000Z",
    });
  });

  it("rejects malformed answers and snapshots", () => {
    expect(parseAssessmentDraft({ version: 2, screen: "results", section: 4, answers: { bad: {} } })).toBeNull();
    expect(parseAssessmentDraft(makeValidDraft({ pendingReport: { submissionId: 12 } }))).toBeNull();
  });

  it("keeps a pending report saved before company and job title were collected", () => {
    // Someone who finished the assessment under the older build has a draft whose
    // participant has neither field. Rejecting it would throw away their answers.
    const legacy = JSON.parse(JSON.stringify(validSnapshot));
    delete legacy.participant.companyName;
    delete legacy.participant.jobTitle;

    const parsed = parseAssessmentDraft(makeValidDraft({ pendingReport: legacy }));
    expect(parsed?.pendingReport).toEqual(legacy);
    expect(parsed?.answers).toEqual(validSnapshot.answers);
  });

  it("rejects a pending report whose company or job title is not a string", () => {
    for (const field of ["companyName", "jobTitle"]) {
      const corrupt = JSON.parse(JSON.stringify(validSnapshot));
      corrupt.participant[field] = 42;
      expect(parseAssessmentDraft(makeValidDraft({ pendingReport: corrupt }))).toBeNull();
    }
  });

  it("retains a valid pending report for idempotent retry", () => {
    expect(parseAssessmentDraft(makeValidDraft())?.pendingReport).toEqual(validSnapshot);
  });

  it("requires a confirmed receipt to match its pending snapshot", () => {
    const draft = makeValidDraft({
      reportReceipt: {
        submissionId: "6158fe1c-2fea-4d8d-9f16-443846c0c479",
        receivedAt: "2026-08-04T20:01:00+00:00",
        payloadHash: "a".repeat(64),
      },
    });
    expect(parseAssessmentDraft(draft)).toBeNull();
  });

  it("retains the exact confirmed snapshot and receipt", () => {
    const receipt = {
      submissionId: validSnapshot.submissionId,
      receivedAt: "2026-08-04T20:01:00+00:00",
      payloadHash: "a".repeat(64),
    };
    const draft = makeValidDraft({ reportReceipt: receipt });
    expect(parseAssessmentDraft(draft)).toEqual(draft);
  });
});

describe("buildAssessmentDraft", () => {
  it("persists the exact pending snapshot before a receipt exists", () => {
    const draft = buildAssessmentDraft({
      screen: "results",
      resumeScreen: "results",
      section: 4,
      answers: validSnapshot.answers,
      pendingReport: null,
      reportReceipt: null,
    }, {
      pendingReport: validSnapshot,
    }, "2026-08-04T20:00:01.000Z");

    expect(draft).toMatchObject({
      version: 2,
      screen: "results",
      pendingReport: validSnapshot,
      reportReceipt: null,
      updatedAt: "2026-08-04T20:00:01.000Z",
    });
    expect(draft.pendingReport).toBe(validSnapshot);
  });

  it("persists a matching receipt without rebuilding the snapshot", () => {
    const receipt = {
      submissionId: validSnapshot.submissionId,
      receivedAt: "2026-08-04T20:01:00+00:00",
      payloadHash: "a".repeat(64),
    };
    const draft = buildAssessmentDraft({
      screen: "results",
      resumeScreen: "results",
      section: 4,
      answers: validSnapshot.answers,
      pendingReport: validSnapshot,
      reportReceipt: null,
    }, {
      reportReceipt: receipt,
    }, "2026-08-04T20:01:01.000Z");

    expect(draft.pendingReport).toBe(validSnapshot);
    expect(draft.reportReceipt).toBe(receipt);
  });
});
