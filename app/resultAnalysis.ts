import {
  AnswerRecord,
  AssessmentResult,
  getQuestionMax,
  getQuestionScore,
  isQuestionVisible,
  LEVEL_ORDER,
  MultiQuestion,
  PillarScore,
  Question,
  SECTIONS,
  SingleQuestion,
} from "./data";
import {
  insightMatches,
  InsightPillarId,
  RESULT_INSIGHTS,
  ResultInsight,
} from "./resultInsights";

export type EvidenceKind = "strength" | "gap" | "risk" | "context";

export interface QuestionEvidence {
  id: string;
  pillar: InsightPillarId;
  sectionTitle: string;
  question: string;
  answer: string;
  answerNote: string | null;
  normalizedScore: number | null;
  kind: EvidenceKind;
  targetState: string | null;
}

export interface ReadinessProfile {
  id: string;
  title: string;
  summary: string;
  implication: string;
}

export interface CriticalPathGate {
  id: string;
  pillar: InsightPillarId;
  pillarTitle: string;
  question: string;
  currentState: string;
  targetState: string;
  reason: string;
  dependency: string;
  normalizedScore: number;
  isBlocker: boolean;
}

export type RiskBand = "blocks-scale" | "weakens-delivery" | "monitor";

export interface RiskSignal {
  id: string;
  pillar: InsightPillarId;
  pillarTitle: string;
  title: string;
  detail: string;
  band: RiskBand;
  urgency: string;
  evidence: string[];
}

export type OpportunityStatus = "recommended" | "priority" | "ready" | "prepare" | "defer" | "maintain";

export interface OpportunityTrack {
  id: "data-foundation" | "automation-agents" | "predictive-agents";
  title: string;
  subtitle: string;
  isFeatured: boolean;
  status: OpportunityStatus;
  statusLabel: string;
  summary: string;
  examples: string[];
  prerequisites: Array<{ label: string; met: boolean }>;
  startAction: string;
}

export interface NextLevelTarget {
  label: string | null;
  scoreDelta: number;
  threshold: number | null;
}

export const PILLAR_TITLES: Record<InsightPillarId, string> = {
  dados: "Dados",
  estrategia: "Estratégia",
  pessoas: "Pessoas e Cultura",
  governanca: "Governança e Processo",
  tecnologia: "Tecnologia",
};

const PILLAR_REASON: Record<InsightPillarId, string> = {
  dados: "Sem uma base confiável, iniciativas posteriores carregam incerteza, retrabalho e baixa confiança.",
  estrategia: "Sem direção e patrocínio, capacidade técnica tende a se dispersar em testes sem decisão clara.",
  pessoas: "Sem adoção e capacidade interna, soluções entregues não se transformam em mudança de trabalho.",
  governanca: "Sem responsabilidades e controles, a organização não consegue ampliar IA com exposição administrável.",
  tecnologia: "Sem integração e operação, bons protótipos permanecem fora dos fluxos que geram valor.",
};

const PILLAR_DEPENDENCY: Record<InsightPillarId, string> = {
  dados: "Estratégia define o dado prioritário; Governança permite utilizá-lo com segurança.",
  estrategia: "Orienta investimentos, dados, adoção, controles e escolhas técnicas.",
  pessoas: "Depende de patrocínio, processo claro e uma solução integrada ao trabalho real.",
  governanca: "Atravessa Dados e Tecnologia e define o perímetro seguro para execução.",
  tecnologia: "Depende de dados utilizáveis, controles mínimos e um caso de negócio priorizado.",
};

function toPillarId(id: string): InsightPillarId {
  return id in PILLAR_TITLES ? id as InsightPillarId : "dados";
}

function selectedAnswer(q: Question, answers: AnswerRecord): { label: string; note: string | null } | null {
  const answer = answers[q.id];
  if (q.type === "text") {
    if (typeof answer !== "string" || answer.trim().length === 0) return null;
    return { label: answer.trim(), note: null };
  }
  if (q.type === "single") {
    const option = q.options.find(item => item.value === answer);
    return option ? { label: option.label, note: option.note ?? null } : null;
  }
  const values = Array.isArray(answer) ? answer : [];
  const selected = q.options.filter(item => values.includes(item.value));
  if (selected.length === 0) return null;
  return {
    label: selected.map(item => item.label).join(", "),
    note: selected.map(item => item.note).filter(Boolean).join(" ") || null,
  };
}

function nextCapability(q: Question, answers: AnswerRecord): string | null {
  if (q.type === "text") return null;
  const answer = answers[q.id];
  if (q.type === "single") {
    const selected = q.options.find(item => item.value === answer);
    if (!selected) return null;
    const next = [...q.options]
      .filter(item => item.score > selected.score)
      .sort((a, b) => a.score - b.score)[0];
    return next?.label ?? null;
  }
  const values = Array.isArray(answer) ? answer : [];
  const missing = q.options
    .filter(item => !item.isNone && item.score > 0 && !values.includes(item.value))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  return missing.length > 0 ? missing.map(item => item.label).join(" + ") : null;
}

export function buildQuestionEvidence(answers: AnswerRecord): QuestionEvidence[] {
  const evidence: QuestionEvidence[] = [];

  for (const section of SECTIONS) {
    const visibleQuestions = section.questions.filter(question =>
      isQuestionVisible(question, section.questions, answers)
    );
    for (const question of visibleQuestions) {
      const selected = selectedAnswer(question, answers);
      if (!selected) continue;
      const score = getQuestionScore(question, answers);
      const max = getQuestionMax(question);
      const normalizedScore = question.type === "text" || score === null
        ? null
        : max > 0 ? Math.round((score / max) * 100) : 0;
      const pillar = toPillarId(question.scorePillar ?? question.pillar);
      const kind: EvidenceKind = question.type === "text"
        ? "context"
        : question.type === "single" && question.riskFlag && (normalizedScore ?? 0) < 60
          ? "risk"
          : (normalizedScore ?? 0) >= 60 ? "strength" : "gap";

      evidence.push({
        id: question.id,
        pillar,
        sectionTitle: section.title,
        question: question.text,
        answer: selected.label,
        answerNote: selected.note,
        normalizedScore,
        kind,
        targetState: nextCapability(question, answers),
      });
    }
  }

  return evidence;
}

function scoreMap(pillarScores: PillarScore[]): Record<InsightPillarId, number> {
  const map = { dados: 0, estrategia: 0, pessoas: 0, governanca: 0, tecnologia: 0 };
  for (const pillar of pillarScores) map[toPillarId(pillar.id)] = pillar.score;
  return map;
}

export function getReadinessProfile(pillarScores: PillarScore[], result: AssessmentResult): ReadinessProfile {
  const scores = scoreMap(pillarScores);
  const values = Object.values(scores);
  const spread = Math.max(...values) - Math.min(...values);

  if (values.every(score => score >= 75)) {
    return {
      id: "integrated",
      title: "Prontidão integrada",
      summary: "As cinco capacidades estão suficientemente alinhadas para sustentar uma agenda mais ampla de IA.",
      implication: "A prioridade passa de preparar a base para gerir portfólio, valor, risco e melhoria contínua.",
    };
  }
  if (result.score >= 60 && scores.governanca < 40) {
    return {
      id: "governance-lag",
      title: "Escala à frente da governança",
      summary: "A organização já reúne capacidade para avançar, mas controles e responsabilidades não acompanham essa ambição.",
      implication: "Ampliar iniciativas agora pode aumentar exposição, retrabalho e decisões sem dono claro.",
    };
  }
  if (scores.estrategia >= 60 && [scores.dados, scores.governanca, scores.tecnologia].some(score => score < 40)) {
    return {
      id: "ambition-gap",
      title: "Ambição acima da base",
      summary: "A direção estratégica está mais madura do que as capacidades necessárias para entregar e sustentar IA.",
      implication: "O valor virá de reduzir dependências fundamentais antes de multiplicar pilotos.",
    };
  }
  if (scores.dados >= 60 && scores.tecnologia >= 60 && scores.estrategia < 40) {
    return {
      id: "direction-gap",
      title: "Capacidade sem direção",
      summary: "Dados e tecnologia permitem avançar, mas ainda falta uma tese executiva clara para concentrar investimento.",
      implication: "O próximo salto depende de priorização, patrocínio e critérios objetivos de valor.",
    };
  }
  if (scores.dados >= 60 && scores.tecnologia >= 60 && scores.pessoas < 40) {
    return {
      id: "adoption-gap",
      title: "Base pronta, adoção frágil",
      summary: "A capacidade técnica existe, mas a organização ainda não está preparada para incorporar IA ao trabalho real.",
      implication: "Treinamento, desenho de processo e gestão de mudança devem acompanhar qualquer nova entrega.",
    };
  }
  if (spread >= 25) {
    return {
      id: "uneven",
      title: "Maturidade desigual",
      summary: "Algumas capacidades já sustentam avanço, enquanto outras ainda criam dependências relevantes.",
      implication: "A organização deve usar seus pontos fortes para destravar o elo mais fraco, não escalar tudo ao mesmo tempo.",
    };
  }
  if (result.score < 40) {
    return {
      id: "foundation",
      title: "Base em construção",
      summary: "A prontidão ainda depende da organização de fundamentos antes de iniciativas mais ambiciosas.",
      implication: "Um primeiro ciclo deve reduzir incerteza, definir donos e construir uma prova de valor delimitada.",
    };
  }
  return {
    id: "balanced",
    title: "Base em evolução",
    summary: "A maturidade é relativamente equilibrada e permite avançar de forma seletiva.",
    implication: "O melhor caminho é validar um caso relevante enquanto fortalece os controles necessários para repetir o resultado.",
  };
}

function blockerPillar(result: AssessmentResult): InsightPillarId | null {
  if (!result.blocker) return null;
  if (result.blocker.includes("Dados")) return "dados";
  if (result.blocker.includes("Governança")) return "governanca";
  if (result.blocker.includes("Tecnologia")) return "tecnologia";
  return null;
}

export function getCriticalPath(
  answers: AnswerRecord,
  pillarScores: PillarScore[],
  result: AssessmentResult,
): CriticalPathGate[] {
  const evidence = buildQuestionEvidence(answers)
    .filter(item => item.normalizedScore !== null && item.targetState)
    .sort((a, b) => {
      if (a.kind === "risk" && b.kind !== "risk") return -1;
      if (b.kind === "risk" && a.kind !== "risk") return 1;
      return (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100);
    });
  const scores = [...pillarScores].sort((a, b) => a.score - b.score);
  const blocker = blockerPillar(result);
  const selected: QuestionEvidence[] = [];

  const addFromPillar = (pillar: InsightPillarId) => {
    if (selected.some(item => item.pillar === pillar)) return;
    const match = evidence.find(item => item.pillar === pillar);
    if (match) selected.push(match);
  };

  if (blocker) addFromPillar(blocker);
  for (const pillar of scores) {
    if (selected.length >= 3) break;
    addFromPillar(toPillarId(pillar.id));
  }
  for (const item of evidence) {
    if (selected.length >= 3) break;
    if (!selected.some(selectedItem => selectedItem.id === item.id)) selected.push(item);
  }

  return selected.slice(0, 3).map(item => ({
    id: item.id,
    pillar: item.pillar,
    pillarTitle: PILLAR_TITLES[item.pillar],
    question: item.question,
    currentState: item.answer,
    targetState: item.targetState ?? "Próxima capacidade",
    reason: PILLAR_REASON[item.pillar],
    dependency: PILLAR_DEPENDENCY[item.pillar],
    normalizedScore: item.normalizedScore ?? 0,
    isBlocker: item.pillar === blocker,
  }));
}

function evidenceForInsight(insight: ResultInsight, evidence: QuestionEvidence[]): string[] {
  const ids = [...new Set(insight.answerMatch.map(condition => condition.questionId))];
  return ids
    .map(id => evidence.find(item => item.id === id))
    .filter((item): item is QuestionEvidence => Boolean(item))
    .map(item => `${item.question} — ${item.answer}`);
}

interface DirectRiskRule {
  id: string;
  pillar: InsightPillarId;
  questionIds: string[];
  band: RiskBand;
  blocksWhenPillarBelow?: number;
  title: string;
  detail: string;
  matches: (answers: AnswerRecord) => boolean;
}

const DIRECT_RISK_RULES: DirectRiskRule[] = [
  {
    id: "dados-dependencia-pessoas-chave",
    pillar: "dados",
    questionIds: ["dados_q2"],
    band: "blocks-scale",
    title: "Acesso a dados depende de pessoas-chave",
    detail: "Quando o acesso depende de pessoas ou ferramentas específicas, cada nova iniciativa herda uma fila manual e um ponto único de falha. Antes de escalar IA, a empresa precisa tornar as fontes prioritárias acessíveis por integrações e permissões repetíveis.",
    matches: answers => answers.dados_q2 === 2,
  },
  {
    id: "dados-historico-curto",
    pillar: "dados",
    questionIds: ["dados_q4"],
    band: "weakens-delivery",
    blocksWhenPillarBelow: 60,
    title: "Histórico ainda curto para modelos confiáveis",
    detail: "Poucos meses de histórico limitam a identificação de padrões e tornam a validação de modelos mais instável. O piloto deve começar com um recorte compatível com o histórico disponível enquanto a captura confiável continua.",
    matches: answers => answers.dados_q4 === 2,
  },
  {
    id: "dados-confianca-fragil",
    pillar: "dados",
    questionIds: ["dados_q7"],
    band: "weakens-delivery",
    blocksWhenPillarBelow: 60,
    title: "Confiança nos dados ainda é frágil",
    detail: "Usar os números com bastante insegurança reduz a adoção de qualquer recomendação automatizada. Qualidade, rastreabilidade e tratamento visível de erros precisam fazer parte do piloto para que a IA não amplifique dúvidas já existentes.",
    matches: answers => answers.dados_q7 === 2,
  },
  {
    id: "governanca-processos-parciais",
    pillar: "governanca",
    questionIds: ["gov_q1"],
    band: "weakens-delivery",
    blocksWhenPillarBelow: 60,
    title: "Processos críticos só estão parcialmente documentados",
    detail: "Sem etapas, exceções e responsáveis claramente mapeados, o escopo de uma automação muda durante a entrega e aumenta o risco de atraso. O processo escolhido para o piloto deve ser documentado antes da implementação.",
    matches: answers => answers.gov_q1 === 2,
  },
];

function evidenceForQuestions(questionIds: string[], evidence: QuestionEvidence[]): string[] {
  return questionIds
    .map(id => evidence.find(item => item.id === id))
    .filter((item): item is QuestionEvidence => Boolean(item))
    .map(item => `${item.question} — ${item.answer}`);
}

function riskUrgency(band: RiskBand): string {
  return band === "blocks-scale" ? "Tratar agora" : band === "weakens-delivery" ? "Próximo ciclo" : "Monitorar";
}

const EVIDENCE_GAP_TITLES: Record<string, string> = {
  dados_q1: "Dados ainda são parciais para decisões críticas",
  dados_q3: "Crescimento ainda depende do aumento do quadro",
  dados_q5: "Dados nem sempre chegam no ritmo da decisão",
  est_q1: "Visão de valor para IA ainda é parcial",
  est_q1a: "Áreas de maior retorno ainda não foram mapeadas",
  est_q1a1: "Roadmap de IA ainda não está documentado",
  est_q1a1a: "Roadmap é revisado com pouca frequência",
  est_q1b: "Valor econômico da IA ainda é pouco claro",
  est_q2: "IA ainda está concentrada em ganhos de produtividade",
  est_q3: "Patrocínio executivo ainda é irregular",
  est_q3a: "Iniciativas de IA sofrem atrasos frequentes",
  pess_q1: "Comunicação da liderança ainda é inconsistente",
  pess_q2: "Experimentação com IA ainda é pouco frequente",
  pess_q2a: "Testes de IA ainda são informais",
  pess_q3: "Capacidade interna de IA ainda é limitada",
  pess_q4: "Adoção enfrenta resistência à mudança",
  pess_q5: "Critérios para escolher IA ainda são incompletos",
  pess_q5a: "Priorização de iniciativas ainda é informal",
  pess_q6: "Capacitação em IA ainda é informal",
  tec_q1: "Portfólio de IA ainda tem pouca experiência prática",
  tec_q1b: "Primeiro piloto ainda depende de preparação técnica",
  tec_q1c: "Projetos existentes não estão evoluindo ativamente",
  tec_q1d: "Portfólio técnico ainda é pouco diversificado",
  tec_q1e: "Integração com sistemas internos ainda é parcial",
  tec_q1f: "Projetos ainda não comprovaram valor mensurável",
  tec_q1g: "Soluções ainda exigem retrabalho para expandir",
  tec_q2a: "Portfólio de IA não é atualizado com frequência",
  tec_q2b: "Soluções de IA ainda são pouco integradas",
  tec_q2c: "Portfólio técnico ainda é pouco diversificado",
  tec_q2d: "Integração com sistemas internos ainda é parcial",
  tec_q2e: "Portfólio ainda não comprova valor mensurável",
  tec_q2f: "Soluções ainda exigem retrabalho para expandir",
};

function sensitiveDataSignal(
  answers: AnswerRecord,
  evidence: QuestionEvidence[],
  scores: Record<InsightPillarId, number>,
): RiskSignal | null {
  const exposure = answers.dados_q6;
  if (typeof exposure !== "number" || exposure > 2) return null;

  const governance = answers.gov_q2;
  const band: RiskBand = governance === 1 || (governance === 2 && scores.governanca < 60)
    ? "blocks-scale"
    : governance === 2 ? "weakens-delivery" : "monitor";
  const detail = governance === 1
    ? "A empresa reconhece que um vazamento teria impacto relevante, mas ainda não definiu controles ou responsáveis específicos para IA. Antes de ampliar o uso, é necessário mapear os dados sensíveis, onde estão, quem pode acessá-los e quais processos exigem revisão humana."
    : governance === 2
      ? "O impacto potencial de um vazamento é relevante e os controles atuais ainda são genéricos. O piloto deve mapear os dados sensíveis utilizados e adaptar acesso, privacidade, registro e revisão humana ao risco específico de IA."
      : "A exposição potencial é relevante, mas existem controles específicos de IA. Preserve o mapeamento de dados sensíveis, o acesso mínimo e a revisão dos controles a cada nova expansão.";

  return {
    id: "dados-sensiveis-e-controles",
    pillar: "governanca",
    pillarTitle: PILLAR_TITLES.governanca,
    title: band === "monitor" ? "Controles para dados sensíveis precisam acompanhar a expansão" : "Dados sensíveis exigem controles focados no caso de uso",
    detail,
    band,
    urgency: riskUrgency(band),
    evidence: evidenceForQuestions(["dados_q6", "gov_q2"], evidence),
  };
}

export function getRiskSignals(answers: AnswerRecord, pillarScores: PillarScore[]): RiskSignal[] {
  const evidence = buildQuestionEvidence(answers);
  const scores = scoreMap(pillarScores);
  const matched = RESULT_INSIGHTS.filter(insight => insightMatches(insight, answers));
  const diagnosticInsights = matched.filter(insight => insight.priority <= 2);
  const monitorInsights = matched
    .filter(insight => insight.priority === 3)
    .sort((a, b) => scores[b.pillar] - scores[a.pillar])
    .slice(0, 3);

  const signals: RiskSignal[] = [...diagnosticInsights, ...monitorInsights].map(insight => {
    const blocksScale = insight.type === "risco-critico" && (insight.priority === 1 || scores[insight.pillar] < 40);
    const band: RiskBand = blocksScale
      ? "blocks-scale"
      : insight.priority <= 2 ? "weakens-delivery" : "monitor";
    return {
      id: insight.id,
      pillar: insight.pillar,
      pillarTitle: PILLAR_TITLES[insight.pillar],
      title: insight.title,
      detail: insight.insight,
      band,
      urgency: riskUrgency(band),
      evidence: evidenceForInsight(insight, evidence),
    };
  });

  const coveredQuestionIds = new Set(
    diagnosticInsights.flatMap(insight => insight.answerMatch.map(condition => condition.questionId))
  );

  for (const rule of DIRECT_RISK_RULES) {
    if (!rule.matches(answers)) continue;
    rule.questionIds.forEach(id => coveredQuestionIds.add(id));
    const band: RiskBand = rule.blocksWhenPillarBelow !== undefined && scores[rule.pillar] < rule.blocksWhenPillarBelow
      ? "blocks-scale"
      : rule.band;
    signals.push({
      id: rule.id,
      pillar: rule.pillar,
      pillarTitle: PILLAR_TITLES[rule.pillar],
      title: rule.title,
      detail: rule.detail,
      band,
      urgency: riskUrgency(band),
      evidence: evidenceForQuestions(rule.questionIds, evidence),
    });
  }

  const securitySignal = sensitiveDataSignal(answers, evidence, scores);
  if (securitySignal) {
    coveredQuestionIds.add("dados_q6");
    coveredQuestionIds.add("gov_q2");
    signals.push(securitySignal);
  }

  // High-impact exposure is context, not a maturity gap by itself. It only
  // becomes a topology signal through the combined control rule above.
  coveredQuestionIds.add("dados_q6");

  const genericCandidates = evidence
    .filter(item => item.normalizedScore !== null && item.normalizedScore < 60 && !coveredQuestionIds.has(item.id))
    .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100));

  // Specific authored diagnostics remain complete. Generic evidence only fills
  // blind spots so every weak pillar gets up to two concrete signals, instead
  // of turning every below-average answer into a repetitive risk card.
  for (const pillarScore of pillarScores) {
    const pillar = toPillarId(pillarScore.id);
    if (pillarScore.score >= 75) continue;
    const existingCount = signals.filter(signal => signal.pillar === pillar && signal.band !== "monitor").length;
    const slots = Math.max(0, 2 - existingCount);
    const additions = genericCandidates.filter(item => item.pillar === pillar).slice(0, slots);
    for (const item of additions) {
      const band: RiskBand = item.normalizedScore === 0 && scores[item.pillar] < 40
        ? "blocks-scale"
        : "weakens-delivery";
      signals.push({
        id: `evidence-gap-${item.id}`,
        pillar: item.pillar,
        pillarTitle: PILLAR_TITLES[item.pillar],
        title: EVIDENCE_GAP_TITLES[item.id] ?? `${PILLAR_TITLES[item.pillar]} ainda exige evolução`,
        detail: [
          item.answerNote,
          item.targetState ? `O próximo patamar de capacidade é ${item.targetState}.` : PILLAR_REASON[item.pillar],
        ].filter(Boolean).join(" "),
        band,
        urgency: riskUrgency(band),
        evidence: [`${item.question} — ${item.answer}`],
      });
    }
  }

  const readinessScore = pillarScores.reduce((total, pillar) => total + pillar.score * pillar.weight, 0);
  if (readinessScore < 60 && !signals.some(signal => signal.band === "blocks-scale")) {
    const promotable = signals.findIndex(signal => signal.band === "weakens-delivery");
    if (promotable >= 0) {
      signals[promotable] = { ...signals[promotable], band: "blocks-scale", urgency: riskUrgency("blocks-scale") };
    } else {
      const weakest = [...pillarScores].sort((a, b) => a.score - b.score)[0];
      if (weakest) {
        const pillar = toPillarId(weakest.id);
        const weakestEvidence = evidence
          .filter(item => item.pillar === pillar && item.normalizedScore !== null)
          .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100))[0];
        signals.push({
          id: `pillar-scale-gap-${pillar}`,
          pillar,
          pillarTitle: PILLAR_TITLES[pillar],
          title: `${PILLAR_TITLES[pillar]} limita a escala`,
          detail: PILLAR_REASON[pillar],
          band: "blocks-scale",
          urgency: riskUrgency("blocks-scale"),
          evidence: weakestEvidence ? [`${weakestEvidence.question} — ${weakestEvidence.answer}`] : [],
        });
      }
    }
  }

  return signals.sort((a, b) => {
    const order: Record<RiskBand, number> = { "blocks-scale": 0, "weakens-delivery": 1, monitor: 2 };
    if (order[a.band] !== order[b.band]) return order[a.band] - order[b.band];
    return scores[a.pillar] - scores[b.pillar];
  });
}

function statusLabel(status: OpportunityStatus): string {
  return {
    recommended: "Solução recomendada",
    priority: "Prioridade agora",
    ready: "Pronto para explorar",
    prepare: "Preparar a base",
    defer: "Adiar por enquanto",
    maintain: "Manter e expandir",
  }[status];
}

export function getOpportunityTracks(answers: AnswerRecord, pillarScores: PillarScore[]): OpportunityTrack[] {
  const scores = scoreMap(pillarScores);
  const automationChecks = [
    { label: "Direção estratégica clara", met: scores.estrategia >= 60 },
    { label: "Adoção e capacidade interna mínimas", met: scores.pessoas >= 40 },
    { label: "Controles mínimos de IA", met: scores.governanca >= 40 },
    { label: "Integração e execução técnica mínimas", met: scores.tecnologia >= 40 },
  ];
  const predictiveChecks = [
    { label: "Dados relevantes e suficientes", met: answers.dados_q1 === 3 },
    { label: "Dados acessíveis para equipes e sistemas", met: typeof answers.dados_q2 === "number" && answers.dados_q2 >= 3 },
    { label: "Ao menos um ano de histórico utilizável", met: typeof answers.dados_q4 === "number" && answers.dados_q4 >= 3 },
    { label: "Maturidade de Dados ≥ 60", met: scores.dados >= 60 },
    { label: "Tecnologia ≥ 40", met: scores.tecnologia >= 40 },
  ];

  const automationMet = automationChecks.filter(item => item.met).length;
  const readinessScore = pillarScores.reduce((total, pillar) => total + pillar.score * pillar.weight, 0);
  const provenPortfolio = readinessScore >= 75 && answers.tec_q1 === 3 && answers.tec_q2e === 2;
  const matureDataFoundation = scores.dados >= 75;
  const predictiveReady = predictiveChecks.every(item => item.met);
  const automationStatus: OpportunityStatus = provenPortfolio
    ? "maintain" : automationMet === automationChecks.length
    ? "ready" : automationMet >= 3 ? "prepare" : "defer";
  const predictiveStatus: OpportunityStatus = provenPortfolio && predictiveReady
    ? "maintain" : predictiveReady
    ? "ready" : scores.dados >= 40 && scores.tecnologia >= 40 ? "prepare" : "defer";
  const dataFoundationStatus: OpportunityStatus = matureDataFoundation ? "maintain" : "recommended";
  const featuredTrack: OpportunityTrack["id"] = provenPortfolio
    ? predictiveReady ? "predictive-agents" : "automation-agents"
    : "data-foundation";

  return [
    {
      id: "data-foundation",
      title: "Data Foundation",
      subtitle: "Lake, warehouse, qualidade e governança",
      isFeatured: featuredTrack === "data-foundation",
      status: dataFoundationStatus,
      statusLabel: statusLabel(dataFoundationStatus),
      summary: matureDataFoundation
        ? "A organização já demonstra uma base de dados madura. A prioridade agora é preservar qualidade e governança, ampliar a cobertura para novos domínios e evitar reconstruir a fundação a cada iniciativa."
        : "Data Foundation é a solução recomendada para o estágio atual. Ela cria a base reutilizável para decisões, automações e modelos sem exigir uma maturidade mínima para começar.",
      examples: ["Lake ou warehouse orientado a domínios críticos", "Catálogo, qualidade e linhagem", "Acesso governado e integrações reutilizáveis"],
      prerequisites: [],
      startAction: matureDataFoundation
        ? "Mapear lacunas de cobertura, qualidade e governança na base atual e priorizar a expansão para o próximo domínio de negócio."
        : "Começar agora por um domínio de negócio e organizar suas fontes, responsáveis, qualidade, acesso e arquitetura de lake ou warehouse.",
    },
    {
      id: "automation-agents",
      title: "Automation Agents",
      subtitle: "LLMs para automatizar trabalho e conhecimento",
      isFeatured: featuredTrack === "automation-agents",
      status: automationStatus,
      statusLabel: provenPortfolio ? "Escalar e reutilizar" : statusLabel(automationStatus),
      summary: provenPortfolio
        ? "A organização já tem experiência prática com agentes. O foco agora é expandir os fluxos que provaram valor, reutilizar integrações e controles e operar custo, qualidade e adoção como um portfólio."
        : automationStatus === "ready"
        ? "A organização reúne condições mínimas para testar agentes em um fluxo delimitado, com revisão humana e resultado observável."
        : "Agentes podem gerar valor, mas o primeiro piloto deve esperar ou acompanhar melhorias de processo, governança, adoção e integração.",
      examples: provenPortfolio
        ? ["Expandir agentes bem-sucedidos para novas áreas", "Reutilizar conhecimento, integrações e controles", "Operar qualidade, custo e adoção do portfólio"]
        : ["Atendimento e triagem assistidos", "Leitura e produção de documentos", "Agentes de conhecimento e fluxos internos"],
      prerequisites: automationChecks,
      startAction: provenPortfolio
        ? "Selecionar o agente com melhor resultado mensurável e expandi-lo para um fluxo adjacente, reaproveitando integrações, avaliações, controles e monitoramento."
        : "Selecionar uma tarefa repetitiva com entradas claras, exceções conhecidas, revisão humana e uma métrica de tempo ou qualidade.",
    },
    {
      id: "predictive-agents",
      title: "Predictive Agents",
      subtitle: "Machine Learning e Deep Learning tradicionais",
      isFeatured: featuredTrack === "predictive-agents",
      status: predictiveStatus,
      statusLabel: provenPortfolio && predictiveReady ? "Expandir portfólio" : statusLabel(predictiveStatus),
      summary: provenPortfolio && predictiveReady
        ? "A base de dados, o histórico e a experiência de entrega permitem ampliar o portfólio preditivo. A prioridade é levar modelos a mais decisões recorrentes e padronizar monitoramento, retreinamento e mensuração de valor."
        : predictiveStatus === "ready"
        ? "Dados e capacidade técnica permitem explorar modelos preditivos em decisões com histórico, resultado observável e rotina de monitoramento."
        : "Casos preditivos dependem de histórico, acesso e qualidade suficientes; sem isso, a incerteza do modelo tende a superar o valor esperado.",
      examples: provenPortfolio && predictiveReady
        ? ["Expandir previsão para novos produtos ou regiões", "Levar propensão e recomendação a mais jornadas", "Reutilizar variáveis, monitoramento e retreinamento"]
        : ["Previsão de demanda e capacidade", "Churn, propensão e recomendação", "Anomalias, risco e otimização"],
      prerequisites: predictiveChecks,
      startAction: provenPortfolio && predictiveReady
        ? "Priorizar a próxima decisão recorrente com impacto relevante e expandir o melhor padrão preditivo existente, com meta incremental e monitoramento comum ao portfólio."
        : "Escolher uma decisão recorrente com histórico suficiente e definir antecipadamente o resultado que o modelo deve melhorar.",
    },
  ];
}

export function getNextLevelTarget(result: AssessmentResult): NextLevelTarget {
  const currentIndex = LEVEL_ORDER.indexOf(result.level);
  const nextLabel = currentIndex >= 0 && currentIndex < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIndex + 1] : null;
  const thresholds: Record<string, number> = {
    "Prontidão Emergente": 40,
    "Prontidão Moderada": 60,
    "Prontidão Alta": 75,
    "Prontidão Avançada": 90,
  };
  const threshold = nextLabel ? thresholds[nextLabel] ?? null : null;
  return {
    label: nextLabel,
    threshold,
    scoreDelta: threshold === null ? 0 : Math.max(0, threshold - result.score),
  };
}

export function getQuestionById(id: string): Question | undefined {
  return SECTIONS.flatMap(section => section.questions).find(question => question.id === id);
}

export function getQuestionTargetOptions(question: SingleQuestion | MultiQuestion): string[] {
  return question.options.filter(option => !((option as { isNone?: boolean }).isNone)).map(option => option.label);
}
