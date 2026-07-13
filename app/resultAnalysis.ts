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
  InsightPillarId,
  isWeakPillarScore,
  ResultInsight,
  selectResultInsights,
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
  /** Declarative rewrite of the question for display when kind is "strength" (e.g. "A empresa já..."). */
  strengthLabel: string | null;
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

// Declarative rewrite of each scored question, used in "Capacidades presentes"
// instead of echoing the interview question back at the reader.
const STRENGTH_PHRASING: Record<string, string> = {
  dados_q1: "Os dados coletados hoje já são suficientes e relevantes para apoiar as decisões mais importantes do negócio.",
  dados_q2: "Os dados já estão acessíveis às equipes e sistemas que precisam deles.",
  dados_q3: "A operação já consegue crescer sem depender apenas de contratar mais pessoas.",
  dados_q4: "A organização já acumula um histórico de dados relevante.",
  dados_q5: "As decisões já contam com dados disponíveis na velocidade necessária.",
  dados_q6: "A exposição a um eventual vazamento de dados já é considerada baixa ou controlada.",
  dados_q7: "Já existe confiança em tomar decisões com base nos dados fornecidos pela empresa.",
  est_q1: "A organização já definiu uma visão clara de como a IA pode gerar valor para o negócio.",
  est_q1a: "A liderança já mapeou as áreas e processos com maior potencial de retorno com IA.",
  est_q1a1: "Já existe um roadmap de IA documentado para os próximos 12 a 24 meses.",
  est_q1a1a: "Esse roadmap já é revisado e atualizado com regularidade.",
  est_q1b: "A liderança já entende o potencial e o valor econômico da IA.",
  est_q2: "A IA já é vista como algo além de testes isolados dentro da organização.",
  est_q3: "Os executivos já patrocinam ativamente as iniciativas de IA.",
  est_q3a: "As iniciativas de IA já avançam sem sofrer atrasos recorrentes.",
  pess_q1: "A liderança já comunica expectativas claras sobre a adoção de IA e os resultados esperados.",
  pess_q2: "As equipes já experimentam novas capacidades de IA com frequência.",
  pess_q2a: "Já existe um processo estruturado para testar e avaliar novas capacidades de IA.",
  pess_q3: "A organização já possui expertise interna em áreas relevantes para IA.",
  pess_q4: "Os colaboradores já são receptivos a mudanças em processos e tecnologias.",
  pess_q5: "A organização já aplica critérios claros para saber quando a IA é a solução certa.",
  pess_q5a: "Já existe um processo claro para priorizar iniciativas de IA.",
  pess_q6: "A empresa já investe ativamente em preparar os colaboradores para trabalhar com IA.",
  gov_q1: "Os processos críticos de negócio já estão bem documentados.",
  gov_q2: "Já existem diretrizes claras para gerenciar riscos de segurança e privacidade em iniciativas de IA.",
  tec_q1: "A empresa já executa um volume relevante de projetos de IA.",
  tec_q1b: "A empresa já conseguiria conectar os dados e sistemas necessários para lançar um piloto em prazo razoável.",
  tec_q1c: "Os projetos de IA já estão em desenvolvimento ativo ou em uso, não parados.",
  tec_q1d: "Os projetos já combinam abordagens de IA tradicional e generativa conforme a necessidade.",
  tec_q1e: "Os projetos de IA já se integram aos sistemas internos da empresa.",
  tec_q1f: "Algum projeto de IA já entregou resultado concreto e mensurável para o negócio.",
  tec_q1g: "Uma solução de IA que funciona bem já pode ser expandida para outras áreas sem reconstruir tudo do zero.",
  tec_q2a: "Os projetos de IA já são atualizados com frequência.",
  tec_q2b: "As soluções de IA já fazem parte de um ecossistema integrado, não são apenas iniciativas pontuais.",
  tec_q2c: "Os projetos já combinam abordagens de IA tradicional e generativa conforme a necessidade.",
  tec_q2d: "Os projetos de IA já se integram aos sistemas internos da empresa.",
  tec_q2e: "Algum projeto de IA já entregou resultado concreto e mensurável para o negócio.",
  tec_q2f: "Uma solução de IA que funciona bem já pode ser expandida para outras áreas sem reconstruir tudo do zero.",
};

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
      // A question only counts as a gap/risk when the chosen answer scored
      // below half of what it could be worth — a "good enough" answer isn't a gap.
      const kind: EvidenceKind = question.type === "text"
        ? "context"
        : question.type === "single" && question.riskFlag && (normalizedScore ?? 0) < 50
          ? "risk"
          : (normalizedScore ?? 0) >= 50 ? "strength" : "gap";

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
        strengthLabel: kind === "strength" ? STRENGTH_PHRASING[question.id] ?? null : null,
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
    // Only surface a gate when the chosen answer scored below half of what the
    // question could be worth — a strong answer shouldn't be told to go one
    // notch higher just because it wasn't the maximum option.
    .filter(item => item.normalizedScore !== null && item.normalizedScore < 50 && item.targetState)
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
    .map(item => `${item.question}: ${item.answer}`);
}

export function getRiskSignals(answers: AnswerRecord, pillarScores: PillarScore[]): RiskSignal[] {
  const evidence = buildQuestionEvidence(answers);
  const scores = scoreMap(pillarScores);
  const insights = selectResultInsights(answers, pillarScores, { min: 5, max: 8 });

  return insights.map(insight => {
    const pillarScore = scores[insight.pillar] ?? 0;
    // A pillar's own aggregate score gates the band: a matched risco-critico
    // insight can't "block scale" or "weaken delivery" for a pillar that's
    // already scoring well, regardless of the insight's authored priority.
    const blocksScale = insight.type === "risco-critico" && pillarScore < 40;
    const band: RiskBand = blocksScale
      ? "blocks-scale"
      : insight.priority <= 2 && isWeakPillarScore(pillarScore) ? "weakens-delivery" : "monitor";
    return {
      id: insight.id,
      pillar: insight.pillar,
      pillarTitle: PILLAR_TITLES[insight.pillar],
      title: insight.title,
      detail: insight.insight,
      band,
      urgency: band === "blocks-scale" ? "Tratar agora" : band === "weakens-delivery" ? "Próximo ciclo" : "Monitorar",
      evidence: evidenceForInsight(insight, evidence),
    };
  }).sort((a, b) => {
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
  const automationStatus: OpportunityStatus = automationMet === automationChecks.length
    ? "ready" : automationMet >= 3 ? "prepare" : "defer";
  const predictiveStatus: OpportunityStatus = predictiveChecks.every(item => item.met)
    ? "ready" : scores.dados >= 40 && scores.tecnologia >= 40 ? "prepare" : "defer";

  return [
    {
      id: "data-foundation",
      title: "Data Foundation",
      subtitle: "Lake, warehouse, qualidade e governança",
      status: "recommended",
      statusLabel: statusLabel("recommended"),
      summary: "Data Foundation é a solução recomendada para qualquer nível de prontidão. Ela cria a base reutilizável para decisões, automações e modelos sem exigir uma maturidade mínima para começar.",
      examples: ["Lake ou warehouse orientado a domínios críticos", "Catálogo, qualidade e linhagem", "Acesso governado e integrações reutilizáveis"],
      prerequisites: [],
      startAction: "Começar agora por um domínio de negócio e organizar suas fontes, responsáveis, qualidade, acesso e arquitetura de lake ou warehouse.",
    },
    {
      id: "automation-agents",
      title: "Automation Agents",
      subtitle: "LLMs para automatizar trabalho e conhecimento",
      status: automationStatus,
      statusLabel: statusLabel(automationStatus),
      summary: automationStatus === "ready"
        ? "A organização reúne condições mínimas para testar agentes em um fluxo delimitado, com revisão humana e resultado observável."
        : "Agentes podem gerar valor, mas o primeiro piloto deve esperar ou acompanhar melhorias de processo, governança, adoção e integração.",
      examples: ["Atendimento e triagem assistidos", "Leitura e produção de documentos", "Agentes de conhecimento e fluxos internos"],
      prerequisites: automationChecks,
      startAction: "Selecionar uma tarefa repetitiva com entradas claras, exceções conhecidas, revisão humana e uma métrica de tempo ou qualidade.",
    },
    {
      id: "predictive-agents",
      title: "Predictive Agents",
      subtitle: "Machine Learning e Deep Learning tradicionais",
      status: predictiveStatus,
      statusLabel: statusLabel(predictiveStatus),
      summary: predictiveStatus === "ready"
        ? "Dados e capacidade técnica permitem explorar modelos preditivos em decisões com histórico, resultado observável e rotina de monitoramento."
        : "Casos preditivos dependem de histórico, acesso e qualidade suficientes; sem isso, a incerteza do modelo tende a superar o valor esperado.",
      examples: ["Previsão de demanda e capacidade", "Churn, propensão e recomendação", "Anomalias, risco e otimização"],
      prerequisites: predictiveChecks,
      startAction: "Escolher uma decisão recorrente com histórico suficiente e definir antecipadamente o resultado que o modelo deve melhorar.",
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
