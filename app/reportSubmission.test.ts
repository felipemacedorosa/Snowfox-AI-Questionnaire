import { describe, expect, it, vi } from "vitest";
import { buildReportSnapshot } from "./reportSnapshot";
import {
  getReportSubmissionRecovery,
  normalizeParticipant,
  ReportSubmissionError,
  submitReportSnapshot,
  validateParticipant,
} from "./reportSubmission";

const snapshot = buildReportSnapshot({
  answers: { dados_q1: 2, est_q1: 3, est_q1b: 2, tec_q1: 1, tec_q1b: 2 },
  participant: {
    name: "Teste Submission",
    email: "submission@snowfox.ai",
    companyName: "Submission Industria",
    jobTitle: "Diretora de Operações",
    storageAcknowledged: true,
  },
  submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
  clientSubmittedAt: "2026-08-04T20:00:00.000Z",
  activeSeconds: 275,
});

const validIdentity = {
  name: "Gabi Silva",
  email: "gabi@example.com",
  companyName: "Metalurgica Aurora",
  jobTitle: "Gerente de Operações",
};

describe("participant validation", () => {
  it("requires every identity field", () => {
    expect(validateParticipant({ name: "", email: "x", companyName: "", jobTitle: "" })).toEqual({
      name: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      companyName: "Informe o nome da empresa.",
      jobTitle: "Informe seu cargo.",
    });
  });

  it("adds the legacy acknowledgement when normalizing valid identity", () => {
    expect(validateParticipant(validIdentity)).toEqual({});
    expect(normalizeParticipant({
      name: "  Gabi Silva  ",
      email: "  GABI@EXAMPLE.COM ",
      companyName: "  Metalurgica Aurora  ",
      jobTitle: "  Gerente de Operações  ",
    })).toEqual({
      name: "Gabi Silva",
      email: "gabi@example.com",
      companyName: "Metalurgica Aurora",
      jobTitle: "Gerente de Operações",
      storageAcknowledged: true,
    });
  });

  it("rejects email shapes that the PHP endpoint will reject", () => {
    expect(validateParticipant({ ...validIdentity, email: "a..b@example.com" })).toEqual({
      email: "Informe um e-mail válido.",
    });
  });

  // The PHP endpoint enforces 2..120 on both fields, so the browser must reject
  // the same range or a completed assessment fails only after the round trip.
  it.each([
    ["companyName", "companyName" as const, "Informe o nome da empresa."],
    ["jobTitle", "jobTitle" as const, "Informe seu cargo."],
  ])("bounds %s the way the endpoint does", (_label, field, message) => {
    expect(validateParticipant({ ...validIdentity, [field]: " A " })).toEqual({ [field]: message });
    expect(validateParticipant({ ...validIdentity, [field]: "x".repeat(121) })).toEqual({ [field]: message });
    expect(validateParticipant({ ...validIdentity, [field]: "x".repeat(120) })).toEqual({});
  });

  it("unlocks identity editing after a non-retryable server rejection", () => {
    expect(getReportSubmissionRecovery(new ReportSubmissionError("E-mail inválido.", 400, "invalid_email", false))).toBe("edit");
    expect(getReportSubmissionRecovery(new ReportSubmissionError("Falha temporária.", 500, "storage_unavailable", true))).toBe("retry");
  });
});

describe("report submission", () => {
  it("posts the unchanged snapshot to the same-origin endpoint", async () => {
    const receipt = {
      submissionId: snapshot.submissionId,
      receivedAt: "2026-08-04T20:01:00+00:00",
      payloadHash: "a".repeat(64),
    };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt), {
      status: 201,
      headers: { "content-type": "application/json" },
    }));

    await expect(submitReportSnapshot(snapshot, fetcher, "/Snowfox-AI-Questionnaire")).resolves.toEqual(receipt);
    expect(fetcher).toHaveBeenCalledWith("/Snowfox-AI-Questionnaire/api/reports.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
  });

  it("surfaces a retryable server failure without changing the snapshot", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "storage_unavailable", error: "Não foi possível salvar o relatório." }), { status: 500 }));
    const before = JSON.stringify(snapshot);
    await expect(submitReportSnapshot(snapshot, fetcher, "")).rejects.toMatchObject({ retryable: true, status: 500 });
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it("does not mark a conflicting id as retryable", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "submission_conflict", error: "Identificador já utilizado." }), { status: 409 }));
    await expect(submitReportSnapshot(snapshot, fetcher, "")).rejects.toMatchObject({ retryable: false, status: 409 });
  });
});
