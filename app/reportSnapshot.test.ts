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
      companyName: "Snowfox AI",
      jobTitle: "Diretor de Operações",
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
        companyName: "Snowfox AI",
        jobTitle: "Diretor de Operações",
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

describe("report language", () => {
  // The saved snapshot resolves bilingual content at submit time. The results
  // screen rebuilds it in the reader's language, so the same answers and id
  // must produce the same report with only the strings swapped.
  const input = {
    answers: { dados_q1: 2, est_q1: 3, est_q1b: 2, tec_q1: 1, tec_q1b: 2 },
    participant: {
      name: "Teste Interno Snowfox",
      email: "teste-interno@snowfox.ai",
      companyName: "Snowfox AI",
      jobTitle: "Diretor de Operações",
      storageAcknowledged: true as const,
    },
    submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
    clientSubmittedAt: "2026-08-04T20:00:00.000Z",
  };

  it("renders pillar titles in the requested language", () => {
    const pt = buildReportSnapshot({ ...input, lang: "pt" });
    const en = buildReportSnapshot({ ...input, lang: "en" });

    expect(pt.report.pillarScores.map(p => p.title)).toContain("Dados");
    expect(en.report.pillarScores.map(p => p.title)).toContain("Data");
    expect(en.report.pillarScores.map(p => p.title)).not.toContain("Dados");
  });

  it("keeps scores and identity identical across languages", () => {
    const pt = buildReportSnapshot({ ...input, lang: "pt" });
    const en = buildReportSnapshot({ ...input, lang: "en" });

    expect(en.report.overallScore).toBe(pt.report.overallScore);
    expect(en.submissionId).toBe(pt.submissionId);
    expect(en.answers).toEqual(pt.answers);
    expect(en.report.pillarScores.map(p => p.score)).toEqual(pt.report.pillarScores.map(p => p.score));
    expect(en.report.weakest.id).toBe(pt.report.weakest.id);
  });

  it("leaves no Portuguese in the English report body", () => {
    const en = buildReportSnapshot({ ...input, lang: "en" });
    const skip = new Set([
      // Respondent-supplied, stored verbatim in whatever they typed.
      "snapshot.participant",
      // result.level is an internal identifier, not display text: data.ts keys
      // LEVEL_META/LEVEL_LABEL off it and _reportSheet.php writes it to the
      // Sheet as a stable value. ResultsScreen renders getLevelLabel(level).
      "snapshot.report.result.level",
    ]);

    const found: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if ([...skip].some(prefix => path === prefix || path.startsWith(`${prefix}.`))) return;
      if (typeof value === "string") {
        if (/[ãõçáâàéêíóôú]/i.test(value)) found.push(`${path} => ${value}`);
        return;
      }
      if (Array.isArray(value)) return value.forEach((item, i) => walk(item, `${path}[${i}]`));
      if (value && typeof value === "object") {
        return Object.entries(value).forEach(([key, item]) => walk(item, `${path}.${key}`));
      }
    };
    walk(en, "snapshot");

    expect(found).toEqual([]);
  });
});
