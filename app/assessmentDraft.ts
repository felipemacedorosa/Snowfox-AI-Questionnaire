import type { AppScreen } from "@/components/Navbar";
import { AnswerRecord } from "./data";
import { ReportSnapshot } from "./reportSnapshot";

export interface ReportSubmissionReceipt {
  submissionId: string;
  receivedAt: string;
  payloadHash: string;
}

export interface AssessmentDraftV2 {
  version: 2;
  screen: AppScreen;
  resumeScreen?: "quiz" | "results" | null;
  section: number;
  answers: AnswerRecord;
  pendingReport: ReportSnapshot | null;
  reportReceipt: ReportSubmissionReceipt | null;
  updatedAt: string;
}

export type AssessmentDraftState = Omit<AssessmentDraftV2, "version" | "updatedAt">;

export function buildAssessmentDraft(
  current: AssessmentDraftState,
  overrides: Partial<AssessmentDraftState> = {},
  updatedAt = new Date().toISOString(),
): AssessmentDraftV2 {
  return {
    version: 2,
    ...current,
    ...overrides,
    updatedAt,
  };
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const REPORT_KEYS = [
  "overallScore",
  "result",
  "pillarScores",
  "strongest",
  "weakest",
  "primaryPriority",
  "executiveSummary",
  "quarterlyRecommendations",
  "evidence",
  "profile",
  "criticalPath",
  "nextLevel",
  "riskSignals",
  "opportunityTracks",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isAnswerRecord(value: unknown): value is AnswerRecord {
  if (!isRecord(value)) return false;
  return Object.values(value).every(item =>
    typeof item === "number" ||
    typeof item === "string" ||
    (Array.isArray(item) && item.every(entry => typeof entry === "number"))
  );
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length >= 20 && Number.isFinite(Date.parse(value));
}

function isScreen(value: unknown): value is AppScreen {
  return value === "quiz" || value === "results";
}

/**
 * Drafts written before the landing screen was removed carry screen:"landing".
 * They are still perfectly good answer sets, so they are migrated to the quiz
 * rather than rejected — returning null here would silently discard the saved
 * progress of anyone who was mid-assessment when this shipped.
 */
function normalizeScreen(value: unknown): AppScreen | null {
  if (value === "landing") return "quiz";
  return isScreen(value) ? value : null;
}

function isResumeScreen(value: unknown): value is AssessmentDraftV2["resumeScreen"] {
  return value === undefined || value === null || value === "quiz" || value === "results";
}

function isReportSnapshot(value: unknown): value is ReportSnapshot {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1 || value.assessmentVersion !== 2) return false;
  if (typeof value.submissionId !== "string" || !UUID_V4.test(value.submissionId)) return false;
  if (!isIsoTimestamp(value.clientSubmittedAt) || !isAnswerRecord(value.answers)) return false;

  const participant = value.participant;
  if (!isRecord(participant) || typeof participant.name !== "string" || typeof participant.email !== "string" || participant.storageAcknowledged !== true) return false;
  // companyName/jobTitle are required for new submissions but must stay optional
  // here: a pendingReport persisted before those fields existed is still a valid
  // draft, and rejecting it would discard the respondent's completed answers.
  if (participant.companyName !== undefined && typeof participant.companyName !== "string") return false;
  if (participant.jobTitle !== undefined && typeof participant.jobTitle !== "string") return false;

  // Optional for the same reason, and for the same cost if it were not: a draft
  // captured before the assessment was timed still holds finished answers.
  const activeSeconds = value.activeSeconds;
  if (activeSeconds !== undefined && (typeof activeSeconds !== "number" || !Number.isFinite(activeSeconds) || activeSeconds < 0)) return false;

  const report = value.report;
  if (!isRecord(report) || !REPORT_KEYS.every(key => key in report)) return false;
  if (typeof report.overallScore !== "number" || !isRecord(report.result)) return false;
  if (!Array.isArray(report.pillarScores) || !Array.isArray(report.quarterlyRecommendations)) return false;
  if (!Array.isArray(report.evidence) || !Array.isArray(report.criticalPath)) return false;
  if (!Array.isArray(report.riskSignals) || !Array.isArray(report.opportunityTracks)) return false;
  return isRecord(report.strongest) && isRecord(report.weakest) && isRecord(report.primaryPriority) &&
    isRecord(report.executiveSummary) && isRecord(report.profile) && isRecord(report.nextLevel);
}

function isReceipt(value: unknown): value is ReportSubmissionReceipt {
  if (!isRecord(value)) return false;
  return typeof value.submissionId === "string" && UUID_V4.test(value.submissionId) &&
    isIsoTimestamp(value.receivedAt) && typeof value.payloadHash === "string" && SHA256.test(value.payloadHash);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function parseAssessmentDraft(value: unknown): AssessmentDraftV2 | null {
  if (!isRecord(value) || typeof value.section !== "number" || !isAnswerRecord(value.answers)) return null;
  const screen = normalizeScreen(value.screen);
  if (screen === null) return null;
  if (!isResumeScreen(value.resumeScreen) || !isIsoTimestamp(value.updatedAt)) return null;

  if (value.version === 1) {
    return {
      version: 2,
      screen,
      resumeScreen: value.resumeScreen,
      section: value.section,
      answers: value.answers,
      pendingReport: null,
      reportReceipt: null,
      updatedAt: value.updatedAt,
    };
  }

  if (value.version !== 2) return null;
  const pendingReport = value.pendingReport === null ? null : isReportSnapshot(value.pendingReport) ? value.pendingReport : null;
  if (value.pendingReport !== null && pendingReport === null) return null;
  const reportReceipt = value.reportReceipt === null ? null : isReceipt(value.reportReceipt) ? value.reportReceipt : null;
  if (value.reportReceipt !== null && reportReceipt === null) return null;
  if (reportReceipt && (!pendingReport || reportReceipt.submissionId !== pendingReport.submissionId)) return null;
  if (pendingReport && JSON.stringify(pendingReport.answers) !== JSON.stringify(value.answers)) return null;

  return deepFreeze({
    version: 2,
    screen,
    resumeScreen: value.resumeScreen,
    section: value.section,
    answers: value.answers,
    pendingReport,
    reportReceipt,
    updatedAt: value.updatedAt,
  });
}
