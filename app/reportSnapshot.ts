import {
  AnswerRecord,
  applyBlockerRules,
  AssessmentResult,
  calculateOverallScore,
  calculatePillarScores,
  PillarScore,
} from "./data";
import {
  buildQuestionEvidence,
  CriticalPathGate,
  getCriticalPath,
  getNextLevelTarget,
  getOpportunityTracks,
  getReadinessProfile,
  getRiskSignals,
  NextLevelTarget,
  OpportunityTrack,
  QuestionEvidence,
  ReadinessProfile,
  RiskSignal,
} from "./resultAnalysis";
import {
  buildExecutiveSummary,
  buildQuarterlyRecommendations,
  ExecutiveSummary,
  getPrimaryPriority,
  PrimaryPriority,
  QuarterlyRecommendation,
} from "./resultInsights";
import { buildLowestPillarRoadmap } from "./roadmapActivities";
import { DEFAULT_LANG, Lang } from "./i18n";

export interface ParticipantIdentity {
  name: string;
  email: string;
  storageAcknowledged: true;
}

export interface ReportContents {
  overallScore: number;
  result: AssessmentResult;
  pillarScores: PillarScore[];
  strongest: PillarScore;
  weakest: PillarScore;
  primaryPriority: PrimaryPriority;
  executiveSummary: ExecutiveSummary;
  quarterlyRecommendations: QuarterlyRecommendation[];
  evidence: QuestionEvidence[];
  profile: ReadinessProfile;
  criticalPath: CriticalPathGate[];
  nextLevel: NextLevelTarget;
  riskSignals: RiskSignal[];
  opportunityTracks: OpportunityTrack[];
}

export interface ReportSnapshot {
  schemaVersion: 1;
  assessmentVersion: 2;
  submissionId: string;
  participant: ParticipantIdentity;
  clientSubmittedAt: string;
  answers: AnswerRecord;
  report: ReportContents;
}

export interface BuildReportSnapshotInput {
  answers: AnswerRecord;
  participant: ParticipantIdentity;
  submissionId: string;
  clientSubmittedAt: string;
  lang?: Lang;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function buildReportSnapshot(input: BuildReportSnapshotInput): ReportSnapshot {
  const answers = structuredClone(input.answers);
  const lang = input.lang ?? DEFAULT_LANG;
  const pillarScores = calculatePillarScores(answers, lang);
  const overallScore = calculateOverallScore(answers);
  const result = applyBlockerRules(overallScore, pillarScores, lang);
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const primaryPriority = getPrimaryPriority({ answers, pillarScores, weakest, lang });
  const baseExecutiveSummary = buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest, lang });
  const criticalPath = getCriticalPath(answers, pillarScores, result, lang);
  const questionLedRoadmap = primaryPriority.id === "portfolio"
    ? null
    : buildLowestPillarRoadmap(answers, weakest.id, lang);
  const quarterlyRecommendations = questionLedRoadmap
    ?? buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest, lang });
  const executiveSummary = questionLedRoadmap ? {
    ...baseExecutiveSummary,
    recommendationTitle: questionLedRoadmap[0].title,
    recommendationContext: questionLedRoadmap[0].focus,
    immediateRecommendation: [
      lang === "en"
        ? `First-cycle outcome: ${questionLedRoadmap[0].outcome}.`
        : `Resultado do primeiro ciclo: ${questionLedRoadmap[0].outcome}.`,
    ],
  } : baseExecutiveSummary;

  return deepFreeze({
    schemaVersion: 1,
    assessmentVersion: 2,
    submissionId: input.submissionId,
    participant: { ...input.participant },
    clientSubmittedAt: input.clientSubmittedAt,
    answers,
    report: {
      overallScore,
      result,
      pillarScores,
      strongest,
      weakest,
      primaryPriority,
      executiveSummary,
      quarterlyRecommendations,
      evidence: buildQuestionEvidence(answers, lang),
      profile: getReadinessProfile(pillarScores, result, lang),
      criticalPath,
      nextLevel: getNextLevelTarget(result, lang),
      riskSignals: getRiskSignals(answers, pillarScores, lang),
      opportunityTracks: getOpportunityTracks(answers, pillarScores, lang),
    },
  });
}
