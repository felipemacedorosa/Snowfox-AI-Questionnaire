import { ReportSubmissionReceipt } from "./assessmentDraft";
import { ParticipantIdentity, ReportSnapshot } from "./reportSnapshot";

export interface ParticipantInput {
  name: string;
  email: string;
}

export type ParticipantValidationErrors = Partial<Record<keyof ParticipantInput, string>>;

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function validateParticipant(input: ParticipantInput): ParticipantValidationErrors {
  const errors: ParticipantValidationErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const localPart = email.split("@", 1)[0] ?? "";
  if (name.length < 2 || name.length > 120) errors.name = "Informe seu nome.";
  if (
    email.length > 254 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    !EMAIL_PATTERN.test(email)
  ) errors.email = "Informe um e-mail válido.";
  return errors;
}

export function normalizeParticipant(input: ParticipantInput): ParticipantIdentity {
  const errors = validateParticipant(input);
  if (Object.keys(errors).length > 0) throw new Error("Participant must be valid before normalization.");
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    storageAcknowledged: true,
  };
}

export class ReportSubmissionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ReportSubmissionError";
  }
}

export function getReportSubmissionRecovery(error: unknown): "retry" | "edit" {
  return error instanceof ReportSubmissionError && !error.retryable ? "edit" : "retry";
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function submitReportSnapshot(
  snapshot: ReportSnapshot,
  fetcher: Fetcher = fetch,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
): Promise<ReportSubmissionReceipt> {
  let response: Response;
  try {
    response = await fetcher(`${basePath}/api/reports.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
  } catch {
    throw new ReportSubmissionError("Não foi possível conectar ao servidor. Tente novamente.", 0, "network_error", true);
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof body.error === "string" ? body.error : "Não foi possível salvar o relatório.";
    const code = typeof body.code === "string" ? body.code : "unknown_error";
    throw new ReportSubmissionError(message, response.status, code, response.status >= 500 || response.status === 0);
  }

  if (
    body.submissionId !== snapshot.submissionId ||
    typeof body.receivedAt !== "string" ||
    !Number.isFinite(Date.parse(body.receivedAt)) ||
    typeof body.payloadHash !== "string" ||
    !/^[0-9a-f]{64}$/i.test(body.payloadHash)
  ) {
    throw new ReportSubmissionError("O servidor retornou uma confirmação inválida.", response.status, "invalid_receipt", true);
  }

  return body as unknown as ReportSubmissionReceipt;
}
