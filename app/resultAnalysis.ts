import {
  AnswerRecord,
  AssessmentResult,
  getAllQuestions,
  getLevelLabel,
  getQuestionMax,
  getQuestionScore,
  getSections,
  isQuestionVisible,
  LEVEL_ORDER,
  LocalizedMultiQuestion,
  LocalizedQuestion,
  LocalizedSingleQuestion,
  PillarScore,
} from "./data";
import { Bilingual, DEFAULT_LANG, Lang, bi, pick } from "./i18n";
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
  /** Declarative rewrite of the question for display when kind is "strength" (e.g. "The company already..."). */
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

export const PILLAR_TITLES: Record<InsightPillarId, Bilingual> = {
  dados: bi("Dados", "Data"),
  estrategia: bi("Estratégia", "Strategy"),
  pessoas: bi("Pessoas e Cultura", "People and Culture"),
  governanca: bi("Governança e Processo", "Governance and Process"),
  tecnologia: bi("Tecnologia", "Technology"),
};

function pillarTitle(id: InsightPillarId, lang: Lang): string {
  return pick(PILLAR_TITLES[id], lang);
}

const PILLAR_REASON: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "Sem uma base confiável, iniciativas posteriores carregam incerteza, retrabalho e baixa confiança.",
    "Without a reliable foundation, later initiatives carry uncertainty, rework, and low confidence."
  ),
  estrategia: bi(
    "Sem direção e patrocínio, capacidade técnica tende a se dispersar em testes sem decisão clara.",
    "Without direction and sponsorship, technical capacity tends to scatter across tests with no clear decision."
  ),
  pessoas: bi(
    "Sem adoção e capacidade interna, soluções entregues não se transformam em mudança de trabalho.",
    "Without adoption and in-house capacity, delivered solutions don't turn into real changes to how work gets done."
  ),
  governanca: bi(
    "Sem responsabilidades e controles, a organização não consegue ampliar IA com exposição administrável.",
    "Without responsibilities and controls, the organization can't expand AI with manageable exposure."
  ),
  tecnologia: bi(
    "Sem integração e operação, bons protótipos permanecem fora dos fluxos que geram valor.",
    "Without integration and operation, good prototypes stay outside the flows that generate value."
  ),
};

const PILLAR_DEPENDENCY: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "Estratégia define o dado prioritário; Governança permite utilizá-lo com segurança.",
    "Strategy defines the priority data; Governance enables using it safely."
  ),
  estrategia: bi(
    "Orienta investimentos, dados, adoção, controles e escolhas técnicas.",
    "Guides investment, data, adoption, controls, and technical choices."
  ),
  pessoas: bi(
    "Depende de patrocínio, processo claro e uma solução integrada ao trabalho real.",
    "Depends on sponsorship, a clear process, and a solution integrated into real work."
  ),
  governanca: bi(
    "Atravessa Dados e Tecnologia e define o perímetro seguro para execução.",
    "Cuts across Data and Technology and defines the safe perimeter for execution."
  ),
  tecnologia: bi(
    "Depende de dados utilizáveis, controles mínimos e um caso de negócio priorizado.",
    "Depends on usable data, minimal controls, and a prioritized business case."
  ),
};

function toPillarId(id: string): InsightPillarId {
  return id in PILLAR_TITLES ? id as InsightPillarId : "dados";
}

function selectedAnswer(q: LocalizedQuestion, answers: AnswerRecord): { label: string; note: string | null } | null {
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

function nextCapability(q: LocalizedQuestion, answers: AnswerRecord): string | null {
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

// Declarative rewrite of each scored question, used in "Existing capabilities"
// instead of echoing the interview question back at the reader.
const STRENGTH_PHRASING: Record<string, Bilingual> = {
  dados_q1: bi("Os dados coletados hoje já são suficientes e relevantes para apoiar as decisões mais importantes do negócio.", "The data collected today is already sufficient and relevant to support the business's most important decisions."),
  dados_q2: bi("Os dados já estão acessíveis às equipes e sistemas que precisam deles.", "Data is already accessible to the teams and systems that need it."),
  dados_q3: bi("A operação já consegue crescer sem depender apenas de contratar mais pessoas.", "The operation can already grow without depending only on hiring more people."),
  dados_q4: bi("A organização já acumula um histórico de dados relevante.", "The organization already has a relevant history of accumulated data."),
  dados_q5: bi("As decisões já contam com dados disponíveis na velocidade necessária.", "Decisions already have data available at the speed they need."),
  dados_q6: bi("A exposição a um eventual vazamento de dados já é considerada baixa ou controlada.", "Exposure to a potential data leak is already considered low or controlled."),
  dados_q7: bi("Já existe confiança em tomar decisões com base nos dados fornecidos pela empresa.", "There is already trust in making decisions based on the data the company provides."),
  est_q1: bi("A organização já definiu uma visão clara de como a IA pode gerar valor para o negócio.", "The organization has already defined a clear vision of how AI can generate value for the business."),
  est_q1a: bi("A liderança já mapeou as áreas e processos com maior potencial de retorno com IA.", "Leadership has already mapped the areas and processes with the greatest return potential with AI."),
  est_q1a1: bi("Já existe um roadmap de IA documentado para os próximos 12 a 24 meses.", "There is already a documented AI roadmap for the next 12 to 24 months."),
  est_q1a1a: bi("Esse roadmap já é revisado e atualizado com regularidade.", "That roadmap is already reviewed and updated regularly."),
  est_q1b: bi("A liderança já entende o potencial e o valor econômico da IA.", "Leadership already understands the potential and economic value of AI."),
  est_q2: bi("A IA já é vista como algo além de testes isolados dentro da organização.", "AI is already seen as more than isolated tests within the organization."),
  est_q3: bi("Os executivos já patrocinam ativamente as iniciativas de IA.", "Executives already actively sponsor AI initiatives."),
  est_q3a: bi("As iniciativas de IA já avançam sem sofrer atrasos recorrentes.", "AI initiatives already move forward without recurring delays."),
  pess_q1: bi("A liderança já comunica expectativas claras sobre a adoção de IA e os resultados esperados.", "Leadership already communicates clear expectations about AI adoption and expected results."),
  pess_q2: bi("As equipes já experimentam novas capacidades de IA com frequência.", "Teams already experiment with new AI capabilities frequently."),
  pess_q2a: bi("Já existe um processo estruturado para testar e avaliar novas capacidades de IA.", "There is already a structured process for testing and evaluating new AI capabilities."),
  pess_q3: bi("A organização já possui expertise interna em áreas relevantes para IA.", "The organization already has in-house expertise in areas relevant to AI."),
  pess_q4: bi("Os colaboradores já são receptivos a mudanças em processos e tecnologias.", "Employees are already receptive to changes in processes and technologies."),
  pess_q5: bi("A organização já aplica critérios claros para saber quando a IA é a solução certa.", "The organization already applies clear criteria to know when AI is the right solution."),
  pess_q5a: bi("Já existe um processo claro para priorizar iniciativas de IA.", "There is already a clear process for prioritizing AI initiatives."),
  pess_q6: bi("A empresa já investe ativamente em preparar os colaboradores para trabalhar com IA.", "The company already actively invests in preparing employees to work with AI."),
  gov_q1: bi("Os processos críticos de negócio já estão bem documentados.", "Critical business processes are already well documented."),
  gov_q2: bi("Já existem diretrizes claras para gerenciar riscos de segurança e privacidade em iniciativas de IA.", "There are already clear guidelines for managing security and privacy risks in AI initiatives."),
  tec_q1: bi("A empresa já executa um volume relevante de projetos de IA.", "The company already runs a meaningful volume of AI projects."),
  tec_q1b: bi("A empresa já conseguiria conectar os dados e sistemas necessários para lançar um piloto em prazo razoável.", "The company could already connect the necessary data and systems to launch a pilot within a reasonable time."),
  tec_q1c: bi("Os projetos de IA já estão em desenvolvimento ativo ou em uso, não parados.", "AI projects are already in active development or in use, not stalled."),
  tec_q1d: bi("Os projetos já combinam abordagens de IA tradicional e generativa conforme a necessidade.", "Projects already combine traditional and generative AI approaches as needed."),
  tec_q1e: bi("Os projetos de IA já se integram aos sistemas internos da empresa.", "AI projects already integrate with the company's internal systems."),
  tec_q1f: bi("Algum projeto de IA já entregou resultado concreto e mensurável para o negócio.", "Some AI project has already delivered a concrete, measurable result for the business."),
  tec_q1g: bi("Uma solução de IA que funciona bem já pode ser expandida para outras áreas sem reconstruir tudo do zero.", "An AI solution that works well can already be expanded to other areas without rebuilding everything from scratch."),
  tec_q2a: bi("Os projetos de IA já são atualizados com frequência.", "AI projects are already updated frequently."),
  tec_q2b: bi("As soluções de IA já fazem parte de um ecossistema integrado, não são apenas iniciativas pontuais.", "AI solutions are already part of an integrated ecosystem, not just one-off initiatives."),
  tec_q2c: bi("Os projetos já combinam abordagens de IA tradicional e generativa conforme a necessidade.", "Projects already combine traditional and generative AI approaches as needed."),
  tec_q2d: bi("Os projetos de IA já se integram aos sistemas internos da empresa.", "AI projects already integrate with the company's internal systems."),
  tec_q2e: bi("Algum projeto de IA já entregou resultado concreto e mensurável para o negócio.", "Some AI project has already delivered a concrete, measurable result for the business."),
  tec_q2f: bi("Uma solução de IA que funciona bem já pode ser expandida para outras áreas sem reconstruir tudo do zero.", "An AI solution that works well can already be expanded to other areas without rebuilding everything from scratch."),
};

export function buildQuestionEvidence(answers: AnswerRecord, lang: Lang = DEFAULT_LANG): QuestionEvidence[] {
  const evidence: QuestionEvidence[] = [];

  for (const section of getSections(lang)) {
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
        : question.type === "single" && (question as LocalizedSingleQuestion).riskFlag && (normalizedScore ?? 0) < 50
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
        strengthLabel: kind === "strength" && STRENGTH_PHRASING[question.id] ? pick(STRENGTH_PHRASING[question.id], lang) : null,
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

export function getReadinessProfile(pillarScores: PillarScore[], result: AssessmentResult, lang: Lang = DEFAULT_LANG): ReadinessProfile {
  const scores = scoreMap(pillarScores);
  const values = Object.values(scores);
  const spread = Math.max(...values) - Math.min(...values);
  const allPillarsStrong = values.every(score => score >= 75);
  const [weakestId] = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
  const weakestTitle = pillarTitle(weakestId as InsightPillarId, lang);

  // 85+ overall is a distinct top bracket from the 75+ "strong" bracket below —
  // it gets its own, more emphatic headline instead of sharing wording with a
  // company that just barely cleared the "strong" bar.
  if (result.score >= 85) {
    if (allPillarsStrong) {
      return lang === "en" ? {
        id: "excellence",
        title: "Excellence readiness",
        summary: "The overall score is among the highest possible, with all five capabilities consistently operating at an advanced level.",
        implication: "The priority is to sustain this standard and use current maturity to lead more ambitious AI initiatives.",
      } : {
        id: "excellence",
        title: "Prontidão de excelência",
        summary: "A pontuação geral está entre as mais altas possíveis, com as cinco capacidades operando em nível avançado de forma consistente.",
        implication: "A prioridade é sustentar esse padrão e usar a maturidade atual para liderar iniciativas mais ambiciosas de IA.",
      };
    }
    return lang === "en" ? {
      id: "excellence-with-focus",
      title: "Excellence readiness, one focus area",
      summary: `The overall score is among the highest possible; ${weakestTitle} is the only pillar that hasn't yet caught up to that level.`,
      implication: `Raising ${weakestTitle} to the same standard as the rest completes an already exceptional profile.`,
    } : {
      id: "excellence-with-focus",
      title: "Prontidão de excelência, atenção pontual",
      summary: `A pontuação geral está entre as mais altas possíveis; ${weakestTitle} é o único pilar que ainda não acompanha esse nível.`,
      implication: `Elevar ${weakestTitle} ao mesmo padrão dos demais completa um perfil já excepcional.`,
    };
  }
  if (allPillarsStrong) {
    return lang === "en" ? {
      id: "integrated",
      title: "Integrated readiness",
      summary: "The five capabilities are aligned enough to support a broader AI agenda.",
      implication: "The priority shifts from preparing the foundation to managing portfolio, value, risk, and continuous improvement.",
    } : {
      id: "integrated",
      title: "Prontidão integrada",
      summary: "As cinco capacidades estão suficientemente alinhadas para sustentar uma agenda mais ampla de IA.",
      implication: "A prioridade passa de preparar a base para gerir portfólio, valor, risco e melhoria contínua.",
    };
  }
  // A strong overall score (75+, the same "Strong" bar used per-pillar elsewhere)
  // should never surface a warning-toned headline — the profile below this
  // point exists to call out gaps/imbalances, which misrepresents a company
  // that's already doing well overall just because one pillar lags the rest.
  if (result.score >= 75) {
    return lang === "en" ? {
      id: "strong-with-focus",
      title: "Advanced readiness, one focus area",
      summary: `The overall score is strong and already supports a broad AI agenda; ${weakestTitle} is the only pillar still below the standard of the others.`,
      implication: `Consolidating ${weakestTitle} should unlock the potential already built in the other capabilities, without needing to restart the foundation.`,
    } : {
      id: "strong-with-focus",
      title: "Prontidão avançada, atenção pontual",
      summary: `A pontuação geral é forte e já sustenta uma agenda ampla de IA; ${weakestTitle} é o único pilar ainda abaixo do padrão dos demais.`,
      implication: `Consolidar ${weakestTitle} deve destravar o potencial já construído nas outras capacidades, sem exigir recomeçar a base.`,
    };
  }
  if (result.score >= 60 && scores.governanca < 40) {
    return lang === "en" ? {
      id: "governance-lag",
      title: "Scale ahead of governance",
      summary: "The organization already has the capacity to move forward, but controls and responsibilities aren't keeping up with that ambition.",
      implication: "Expanding initiatives now could increase exposure, rework, and decisions with no clear owner.",
    } : {
      id: "governance-lag",
      title: "Escala à frente da governança",
      summary: "A organização já reúne capacidade para avançar, mas controles e responsabilidades não acompanham essa ambição.",
      implication: "Ampliar iniciativas agora pode aumentar exposição, retrabalho e decisões sem dono claro.",
    };
  }
  if (scores.estrategia >= 60 && [scores.dados, scores.governanca, scores.tecnologia].some(score => score < 40)) {
    return lang === "en" ? {
      id: "ambition-gap",
      title: "Ambition ahead of the foundation",
      summary: "Strategic direction is more mature than the capabilities needed to deliver and sustain AI.",
      implication: "Value will come from reducing fundamental dependencies before multiplying pilots.",
    } : {
      id: "ambition-gap",
      title: "Ambição acima da base",
      summary: "A direção estratégica está mais madura do que as capacidades necessárias para entregar e sustentar IA.",
      implication: "O valor virá de reduzir dependências fundamentais antes de multiplicar pilotos.",
    };
  }
  if (scores.dados >= 60 && scores.tecnologia >= 60 && scores.estrategia < 40) {
    return lang === "en" ? {
      id: "direction-gap",
      title: "Capability without direction",
      summary: "Data and technology allow for progress, but a clear executive thesis to focus investment is still missing.",
      implication: "The next leap depends on prioritization, sponsorship, and objective value criteria.",
    } : {
      id: "direction-gap",
      title: "Capacidade sem direção",
      summary: "Dados e tecnologia permitem avançar, mas ainda falta uma tese executiva clara para concentrar investimento.",
      implication: "O próximo salto depende de priorização, patrocínio e critérios objetivos de valor.",
    };
  }
  if (scores.dados >= 60 && scores.tecnologia >= 60 && scores.pessoas < 40) {
    return lang === "en" ? {
      id: "adoption-gap",
      title: "Foundation ready, fragile adoption",
      summary: "Technical capability exists, but the organization isn't yet prepared to incorporate AI into real work.",
      implication: "Training, process design, and change management should accompany any new delivery.",
    } : {
      id: "adoption-gap",
      title: "Base pronta, adoção frágil",
      summary: "A capacidade técnica existe, mas a organização ainda não está preparada para incorporar IA ao trabalho real.",
      implication: "Treinamento, desenho de processo e gestão de mudança devem acompanhar qualquer nova entrega.",
    };
  }
  if (spread >= 25) {
    return lang === "en" ? {
      id: "uneven",
      title: "Uneven maturity",
      summary: "Some capabilities already support progress, while others still create meaningful dependencies.",
      implication: "The organization should use its strengths to unlock the weakest link, not scale everything at once.",
    } : {
      id: "uneven",
      title: "Maturidade incipiente",
      summary: "Algumas capacidades já sustentam avanço, enquanto outras ainda criam dependências relevantes.",
      implication: "A organização deve usar seus pontos fortes para destravar o elo mais fraco, não escalar tudo ao mesmo tempo.",
    };
  }
  if (result.score < 40) {
    return lang === "en" ? {
      id: "foundation",
      title: "Foundation under construction",
      summary: "Readiness still depends on the organization building fundamentals before more ambitious initiatives.",
      implication: "A first cycle should reduce uncertainty, assign owners, and build a well-scoped proof of value.",
    } : {
      id: "foundation",
      title: "Base em construção",
      summary: "A prontidão ainda depende da organização de fundamentos antes de iniciativas mais ambiciosas.",
      implication: "Um primeiro ciclo deve reduzir incerteza, definir donos e construir uma prova de valor delimitada.",
    };
  }
  return lang === "en" ? {
    id: "balanced",
    title: "Evolving foundation",
    summary: "Maturity is relatively balanced and allows for selective progress.",
    implication: "The best path is to validate a relevant case while strengthening the controls needed to repeat the result.",
  } : {
    id: "balanced",
    title: "Base em evolução",
    summary: "A maturidade é relativamente equilibrada e permite avançar de forma seletiva.",
    implication: "O melhor caminho é validar um caso relevante enquanto fortalece os controles necessários para repetir o resultado.",
  };
}

function blockerPillar(result: AssessmentResult): InsightPillarId | null {
  if (result.blockerPillar) return toPillarId(result.blockerPillar);
  if (!result.blocker) return null;
  if (result.blocker.includes("Dados") || result.blocker.includes("Data")) return "dados";
  if (result.blocker.includes("Governança") || result.blocker.includes("Governance")) return "governanca";
  if (result.blocker.includes("Tecnologia") || result.blocker.includes("Technology")) return "tecnologia";
  return null;
}

export function getCriticalPath(
  answers: AnswerRecord,
  pillarScores: PillarScore[],
  result: AssessmentResult,
  lang: Lang = DEFAULT_LANG,
): CriticalPathGate[] {
  const evidence = buildQuestionEvidence(answers, lang)
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

  const nextCapabilityFallback = lang === "en" ? "Next capability" : "Próxima capacidade";

  return selected.slice(0, 3).map(item => ({
    id: item.id,
    pillar: item.pillar,
    pillarTitle: pillarTitle(item.pillar, lang),
    question: item.question,
    currentState: item.answer,
    targetState: item.targetState ?? nextCapabilityFallback,
    reason: pick(PILLAR_REASON[item.pillar], lang),
    dependency: pick(PILLAR_DEPENDENCY[item.pillar], lang),
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

const URGENCY_LABEL: Record<RiskBand, Bilingual> = {
  "blocks-scale": bi("Tratar agora", "Address now"),
  "weakens-delivery": bi("Próximo ciclo", "Next cycle"),
  monitor: bi("Monitorar", "Monitor"),
};

export function getRiskSignals(answers: AnswerRecord, pillarScores: PillarScore[], lang: Lang = DEFAULT_LANG): RiskSignal[] {
  const evidence = buildQuestionEvidence(answers, lang);
  const scores = scoreMap(pillarScores);
  const insights = selectResultInsights(answers, pillarScores, { min: 5, max: 8 }, lang);

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
      pillarTitle: pillarTitle(insight.pillar, lang),
      title: insight.title,
      detail: insight.insight,
      band,
      urgency: pick(URGENCY_LABEL[band], lang),
      evidence: evidenceForInsight(insight, evidence),
    };
  }).sort((a, b) => {
    const order: Record<RiskBand, number> = { "blocks-scale": 0, "weakens-delivery": 1, monitor: 2 };
    if (order[a.band] !== order[b.band]) return order[a.band] - order[b.band];
    return scores[a.pillar] - scores[b.pillar];
  });
}

const STATUS_LABEL: Record<OpportunityStatus, Bilingual> = {
  recommended: bi("Solução recomendada", "Recommended solution"),
  priority: bi("Prioridade agora", "Priority now"),
  ready: bi("Pronto para explorar", "Ready to explore"),
  prepare: bi("Preparar a base", "Prepare the foundation"),
  defer: bi("Adiar por enquanto", "Defer for now"),
  maintain: bi("Manter e expandir", "Maintain and expand"),
};

function statusLabel(status: OpportunityStatus, lang: Lang): string {
  return pick(STATUS_LABEL[status], lang);
}

export function getOpportunityTracks(answers: AnswerRecord, pillarScores: PillarScore[], lang: Lang = DEFAULT_LANG): OpportunityTrack[] {
  const scores = scoreMap(pillarScores);
  const automationChecks = [
    { label: lang === "en" ? "Clear strategic direction" : "Direção estratégica clara", met: scores.estrategia >= 60 },
    { label: lang === "en" ? "Minimal adoption and in-house capacity" : "Adoção e capacidade interna mínimas", met: scores.pessoas >= 40 },
    { label: lang === "en" ? "Minimal AI controls" : "Controles mínimos de IA", met: scores.governanca >= 40 },
    { label: lang === "en" ? "Minimal technical integration and execution" : "Integração e execução técnica mínimas", met: scores.tecnologia >= 40 },
  ];
  const predictiveChecks = [
    { label: lang === "en" ? "Relevant and sufficient data" : "Dados relevantes e suficientes", met: answers.dados_q1 === 3 },
    { label: lang === "en" ? "Data accessible to teams and systems" : "Dados acessíveis para equipes e sistemas", met: typeof answers.dados_q2 === "number" && answers.dados_q2 >= 3 },
    { label: lang === "en" ? "At least one year of usable history" : "Ao menos um ano de histórico utilizável", met: typeof answers.dados_q4 === "number" && answers.dados_q4 >= 3 },
    { label: lang === "en" ? "Data maturity ≥ 60" : "Maturidade de Dados ≥ 60", met: scores.dados >= 60 },
    { label: lang === "en" ? "Technology ≥ 40" : "Tecnologia ≥ 40", met: scores.tecnologia >= 40 },
  ];
  // A data lake/warehouse or downstream data marts already in place means the
  // foundation has already been built — recommending it from scratch would be
  // redundant, so either answer disqualifies "recommended" in favor of "maintain".
  const dataFoundationChecks = [
    { label: lang === "en" ? "Structured data lake or warehouse" : "Data lake ou warehouse estruturado", met: answers.dados_q8 === 2 },
    { label: lang === "en" ? "Data marts ready for business consumption" : "Data marts prontos para consumo do negócio", met: answers.dados_q9 === 2 },
  ];
  const hasDataFoundation = dataFoundationChecks.some(item => item.met);

  const automationMet = automationChecks.filter(item => item.met).length;
  const automationStatus: OpportunityStatus = automationMet === automationChecks.length
    ? "ready" : automationMet >= 3 ? "prepare" : "defer";
  const predictiveStatus: OpportunityStatus = predictiveChecks.every(item => item.met)
    ? "ready" : scores.dados >= 40 && scores.tecnologia >= 40 ? "prepare" : "defer";
  const dataFoundationStatus: OpportunityStatus = hasDataFoundation ? "maintain" : "recommended";

  if (lang === "en") {
    return [
      {
        id: "data-foundation",
        title: "Data Foundation",
        subtitle: "Lake, warehouse, quality, and governance",
        status: dataFoundationStatus,
        statusLabel: statusLabel(dataFoundationStatus, lang),
        summary: hasDataFoundation
          ? "The organization already has a data lake, warehouse, or data marts in place. The priority now is to maintain quality and governance and extend coverage to new domains, not to rebuild the foundation from scratch."
          : "Data Foundation is the recommended solution at any readiness level. It creates the reusable foundation for decisions, automations, and models without requiring a minimum maturity to get started.",
        examples: ["A lake or warehouse oriented around critical domains", "Catalog, quality, and lineage", "Governed access and reusable integrations"],
        prerequisites: hasDataFoundation ? dataFoundationChecks : [],
        startAction: hasDataFoundation
          ? "Map coverage, quality, and governance gaps in the current foundation and prioritize extending it to the next business domain."
          : "Start now with one business domain and organize its sources, owners, quality, access, and lake or warehouse architecture.",
      },
      {
        id: "automation-agents",
        title: "Automation Agents",
        subtitle: "LLMs to automate work and knowledge",
        status: automationStatus,
        statusLabel: statusLabel(automationStatus, lang),
        summary: automationStatus === "ready"
          ? "The organization has the minimum conditions to test agents in a well-scoped flow, with human review and an observable outcome."
          : "Agents can generate value, but the first pilot should wait for, or run alongside, improvements in process, governance, adoption, and integration.",
        examples: ["Assisted support and triage", "Reading and producing documents", "Knowledge agents and internal workflows"],
        prerequisites: automationChecks,
        startAction: "Select a repetitive task with clear inputs, known exceptions, human review, and a time or quality metric.",
      },
      {
        id: "predictive-agents",
        title: "Predictive Agents",
        subtitle: "Traditional Machine Learning and Deep Learning",
        status: predictiveStatus,
        statusLabel: statusLabel(predictiveStatus, lang),
        summary: predictiveStatus === "ready"
          ? "Data and technical capacity allow for exploring predictive models in decisions with history, an observable outcome, and a monitoring routine."
          : "Predictive use cases depend on enough history, access, and quality; without that, model uncertainty tends to outweigh the expected value.",
        examples: ["Demand and capacity forecasting", "Churn, propensity, and recommendation", "Anomalies, risk, and optimization"],
        prerequisites: predictiveChecks,
        startAction: "Choose a recurring decision with enough history and define in advance the outcome the model should improve.",
      },
    ];
  }

  return [
    {
      id: "data-foundation",
      title: "Data Foundation",
      subtitle: "Lake, warehouse, qualidade e governança",
      status: dataFoundationStatus,
      statusLabel: statusLabel(dataFoundationStatus, lang),
      summary: hasDataFoundation
        ? "A organização já possui data lake, data warehouse ou data marts estruturados. A prioridade agora é manter a qualidade e a governança e ampliar a cobertura para novos domínios, não reconstruir a base do zero."
        : "Data Foundation é a solução recomendada para qualquer nível de prontidão. Ela cria a base reutilizável para decisões, automações e modelos sem exigir uma maturidade mínima para começar.",
      examples: ["Lake ou warehouse orientado a domínios críticos", "Catálogo, qualidade e linhagem", "Acesso governado e integrações reutilizáveis"],
      prerequisites: hasDataFoundation ? dataFoundationChecks : [],
      startAction: hasDataFoundation
        ? "Mapear lacunas de cobertura, qualidade e governança na base atual e priorizar a expansão para o próximo domínio de negócio."
        : "Começar agora por um domínio de negócio e organizar suas fontes, responsáveis, qualidade, acesso e arquitetura de lake ou warehouse.",
    },
    {
      id: "automation-agents",
      title: "Automation Agents",
      subtitle: "LLMs para automatizar trabalho e conhecimento",
      status: automationStatus,
      statusLabel: statusLabel(automationStatus, lang),
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
      statusLabel: statusLabel(predictiveStatus, lang),
      summary: predictiveStatus === "ready"
        ? "Dados e capacidade técnica permitem explorar modelos preditivos em decisões com histórico, resultado observável e rotina de monitoramento."
        : "Casos preditivos dependem de histórico, acesso e qualidade suficientes; sem isso, a incerteza do modelo tende a superar o valor esperado.",
      examples: ["Previsão de demanda e capacidade", "Churn, propensão e recomendação", "Anomalias, risco e otimização"],
      prerequisites: predictiveChecks,
      startAction: "Escolher uma decisão recorrente com histórico suficiente e definir antecipadamente o resultado que o modelo deve melhorar.",
    },
  ];
}

// Data Foundation has no prerequisites and is always viable, so it's the
// fallback recommendation — but only while it's still actually worth
// recommending. When the company already reported a data lake/warehouse or
// data marts, its status flips to "maintain" and it's dropped from the
// fallback entirely: recommending it again would be redundant, so the
// closer-to-ready of the two agent tracks is used instead, even if neither
// has fully cleared its checks yet — that's still the more useful "what's
// next" than repeating a track they've already built. When the company
// clears the bar for a higher-value track outright, that's the more useful
// "what to do now" — Predictive Agents outranks Automation Agents since its
// checks require a stronger data foundation to already be in place.
const READINESS_RANK: Record<OpportunityStatus, number> = {
  ready: 0, prepare: 1, defer: 2, recommended: 3, maintain: 4, priority: 5,
};

export function selectPrimaryRecommendation(tracks: OpportunityTrack[]): OpportunityTrack {
  const byId = Object.fromEntries(tracks.map(track => [track.id, track])) as Record<OpportunityTrack["id"], OpportunityTrack>;
  if (byId["predictive-agents"]?.status === "ready") return byId["predictive-agents"];
  if (byId["automation-agents"]?.status === "ready") return byId["automation-agents"];
  if (byId["data-foundation"]?.status !== "maintain") return byId["data-foundation"];
  return READINESS_RANK[byId["automation-agents"].status] <= READINESS_RANK[byId["predictive-agents"].status]
    ? byId["automation-agents"]
    : byId["predictive-agents"];
}

export function getNextLevelTarget(result: AssessmentResult, lang: Lang = DEFAULT_LANG): NextLevelTarget {
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
    label: nextLabel ? getLevelLabel(nextLabel, lang) : null,
    threshold,
    scoreDelta: threshold === null ? 0 : Math.max(0, threshold - result.score),
  };
}

export function getQuestionById(id: string, lang: Lang = DEFAULT_LANG): LocalizedQuestion | undefined {
  return getAllQuestions(lang).find(question => question.id === id);
}

export function getQuestionTargetOptions(question: LocalizedSingleQuestion | LocalizedMultiQuestion): string[] {
  return question.options.filter(option => !option.isNone).map(option => option.label);
}
