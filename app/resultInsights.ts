// Personalized "Key insights" content for the results page.
//
// Each insight is anchored to one or more real question IDs / option values
// from SECTIONS in `app/data.ts`. An insight only "fires" when the user's
// actual answers satisfy every condition in `answerMatch`. This file does not
// change scoring, questions, or answer options — it only reads the
// AnswerRecord that already drives `calculatePillarScores`.
//
// How a trigger maps to the questionnaire:
//   - `eq(qId, ...values)`         -> single-select question equals one of these option values
//   - `includesAll(qId, ...values)` -> multi-select question has ALL of these option values selected
//   - `excludesAny(qId, ...values)` -> multi-select question has NONE of these option values selected
// All conditions inside one insight's `answerMatch` array are combined with AND.
//
// `priority` is the internal ranking used for selection (1 = critical blocker,
// 2 = other risk/gap, 3 = strength, 4 = meta/fallback filler) and is
// independent of `type`, which is only the badge shown on the card.
// `theme` groups insights that make a similar point, so the selector never
// shows two near-duplicates side by side.
//
// `title` and `insight` are bilingual (Bilingual). `trigger` and
// `scoreCondition` are maintainer-facing traceability notes, never rendered
// to the end user, so they stay in Portuguese only.

import { AnswerRecord, AssessmentResult, PillarScore, PILLAR_CONFIG, RECOMMENDATIONS, getPillarTier, hasDataFoundation } from "@/app/data";
import { Bilingual, DEFAULT_LANG, Lang, bi, pick } from "@/app/i18n";

export type InsightPillarId = "dados" | "estrategia" | "pessoas" | "governanca" | "tecnologia";

export type InsightBadge = "risco-critico" | "oportunidade" | "proximo-passo" | "forca-existente";

const INSIGHT_BADGE_LABEL: Record<InsightBadge, Bilingual> = {
  "risco-critico": bi("Risco prioritário", "Priority risk"),
  "oportunidade": bi("Oportunidade", "Opportunity"),
  "proximo-passo": bi("Próximo passo", "Next step"),
  "forca-existente": bi("Força existente", "Existing strength"),
};

export function getInsightBadgeLabel(badge: InsightBadge, lang: Lang = DEFAULT_LANG): string {
  return pick(INSIGHT_BADGE_LABEL[badge], lang);
}

// Groups the badge-level types into the three result-sheet sections requested
// by the business: critical risks read as gaps; both "opportunity" and
// "next step" badges are forward-looking actions to take; existing strengths
// stand on their own.
export type InsightCategory = "lacunas" | "oportunidades" | "forcas";

const CATEGORY_LABEL: Record<InsightCategory, Bilingual> = {
  lacunas: bi("Lacunas", "Gaps"),
  oportunidades: bi("Oportunidades", "Opportunities"),
  forcas: bi("Pontos Fortes", "Strengths"),
};

export function getCategoryLabel(category: InsightCategory, lang: Lang = DEFAULT_LANG): string {
  return pick(CATEGORY_LABEL[category], lang);
}

const TYPE_TO_CATEGORY: Record<InsightBadge, InsightCategory> = {
  "risco-critico": "lacunas",
  "oportunidade": "oportunidades",
  "proximo-passo": "oportunidades",
  "forca-existente": "forcas",
};

export function categoryOf(insight: { type: InsightBadge }): InsightCategory {
  return TYPE_TO_CATEGORY[insight.type];
}

export function getPillarLabel(pillar: InsightPillarId, lang: Lang = DEFAULT_LANG): string {
  const config = PILLAR_CONFIG.find(p => p.id === pillar);
  return config ? pick(config.title, lang) : pillar;
}

const PILLAR_ORDER: InsightPillarId[] = ["dados", "estrategia", "pessoas", "governanca", "tecnologia"];

export interface AnswerCondition {
  questionId: string;
  op: "equals" | "includesAll" | "excludesAny";
  values: number[];
}

function eq(questionId: string, ...values: number[]): AnswerCondition {
  return { questionId, op: "equals", values };
}
function includesAll(questionId: string, ...values: number[]): AnswerCondition {
  return { questionId, op: "includesAll", values };
}
function excludesAny(questionId: string, ...values: number[]): AnswerCondition {
  return { questionId, op: "excludesAny", values };
}

// Canonical, bilingual insight record. Selection logic (matching, ranking,
// deduping) operates entirely on this shape; text is only picked for the
// caller's language at the very end, in localizeInsight().
interface RawResultInsight {
  id: string;
  pillar: InsightPillarId;
  questionId: string;
  /** Human-readable description of the branch this insight covers (maintainer-facing, Portuguese only). */
  trigger: string;
  /** Original score annotation from the source insight doc, kept for traceability (maintainer-facing, Portuguese only). */
  scoreCondition: string;
  answerMatch: AnswerCondition[];
  priority: 1 | 2 | 3 | 4;
  type: InsightBadge;
  theme: string;
  title: Bilingual;
  insight: Bilingual;
}

// Localized result of selection: same shape, with title/insight already
// picked for the requested language.
export interface ResultInsight {
  id: string;
  pillar: InsightPillarId;
  questionId: string;
  trigger: string;
  scoreCondition: string;
  answerMatch: AnswerCondition[];
  priority: 1 | 2 | 3 | 4;
  type: InsightBadge;
  theme: string;
  title: string;
  insight: string;
}

function localizeInsight(insight: RawResultInsight, lang: Lang): ResultInsight {
  return { ...insight, title: pick(insight.title, lang), insight: pick(insight.insight, lang) };
}

const RESULT_INSIGHTS: RawResultInsight[] = [
  // ---------------------------------------------------------------------
  // 1. Dados
  // ---------------------------------------------------------------------
  {
    id: "dados-01",
    pillar: "dados",
    questionId: "dados_q1",
    trigger: "dados_q1 = 1 (dados insuficientes/pouco claros)",
    scoreCondition: "0/5",
    answerMatch: [eq("dados_q1", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "dados-suficiencia",
    title: bi("Base de dados ainda não validada", "Data foundation not yet validated"),
    insight: bi(
      "Sua empresa ainda não consegue saber com clareza se está coletando os dados certos. Isso significa que qualquer iniciativa de IA partiria de uma base pouco validada ou teria que construir essa base de forma ad hoc. Antes de avançar para modelos ou automações mais complexas, faria sentido mapear os dados existentes em relação às decisões que o negócio realmente precisa tomar.",
      "Your company still can't clearly tell whether it's collecting the right data. That means any AI initiative would start from a poorly validated foundation, or would have to build that foundation ad hoc. Before moving on to more complex models or automations, it would make sense to map existing data against the decisions the business actually needs to make."
    ),
  },
  {
    id: "dados-02",
    pillar: "dados",
    questionId: "dados_q1",
    trigger: "dados_q1 = 3 (dados relevantes e suficientes)",
    scoreCondition: "5/5",
    answerMatch: [eq("dados_q1", 3)],
    priority: 3,
    type: "forca-existente",
    theme: "dados-suficiencia",
    title: bi("Dados prontos para aplicar casos de uso", "Data ready to apply use cases"),
    insight: bi(
      "Uma base de dados relevante e suficiente reduz uma das principais incertezas antes de avançar com IA. Sua organização já superou a etapa de coleta e está, sob a ótica de dados, mais preparada para avaliar casos de uso com potencial real de aplicação.",
      "A relevant, sufficient data foundation removes one of the main uncertainties before moving forward with AI. Your organization has already gotten past the collection stage and, from a data standpoint, is better prepared to evaluate use cases with real potential for application."
    ),
  },
  {
    id: "dados-03",
    pillar: "dados",
    questionId: "dados_q2",
    trigger: "dados_q2 = 1 (dados isolados em sistemas/arquivos)",
    scoreCondition: "0/5",
    answerMatch: [eq("dados_q2", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "dados-acesso",
    title: bi("Dados isolados travam produção", "Siloed data blocks production"),
    insight: bi(
      "Dados isolados e de difícil acesso costumam dificultar a passagem de iniciativas de IA da prova de conceito para a operação. O desafio aqui não parece estar apenas na modelagem, mas na forma como os dados estão organizados, acessados e disponibilizados. Esse é um ponto típico de Engenharia de Dados ou de Estratégia de Dados. A recomendação é tratar essa base primeiro, antes de avançar para modelos mais sofisticados.",
      "Siloed, hard-to-access data usually makes it harder for AI initiatives to move from proof of concept into operation. The challenge here doesn't seem to be just about modeling, but about how the data is organized, accessed, and made available. This is a typical Data Engineering or Data Strategy issue. The recommendation is to address this foundation first, before moving on to more sophisticated models."
    ),
  },
  {
    id: "dados-04",
    pillar: "dados",
    questionId: "dados_q2",
    trigger: "dados_q2 = 5 (dados facilmente disponíveis)",
    scoreCondition: "5/5",
    answerMatch: [eq("dados_q2", 5)],
    priority: 3,
    type: "forca-existente",
    theme: "dados-acesso",
    title: bi("Acesso a dados pronto para MLOps", "Data access ready for MLOps"),
    insight: bi(
      "Quando os dados estão facilmente disponíveis para equipes e sistemas autorizados, a empresa reduz o atrito entre análise, decisão e execução. Essa disponibilidade cria uma base mais favorável para iniciativas de IA, porque os casos de uso podem partir de informações acessíveis e governadas, em vez de depender de coletas manuais ou integrações improvisadas.",
      "When data is easily available to authorized teams and systems, the company reduces friction between analysis, decision, and execution. That availability creates a more favorable foundation for AI initiatives, because use cases can start from accessible, governed information instead of depending on manual collection or improvised integrations."
    ),
  },
  {
    id: "dados-05",
    pillar: "dados",
    questionId: "dados_q3",
    trigger: "dados_q3 = 1 (\"Não\", não cresce sem aumentar o quadro)",
    scoreCondition: "0/5",
    answerMatch: [eq("dados_q3", 1)],
    priority: 1,
    type: "oportunidade",
    theme: "dados-escalabilidade",
    title: bi("Crescimento ainda depende de mais pessoas", "Growth still depends on more headcount"),
    insight: bi(
      "O crescimento ainda escala de forma linear com o número de pessoas, sinal de que parte da operação poderia estar mais automatizada. Essa é uma abertura para o uso de IA em geral, seja por meio de automação de processos, modelos preditivos, analytics avançado, agentes inteligentes ou IA generativa, dependendo do tipo de tarefa, dos dados disponíveis e do impacto esperado.",
      "Growth still scales linearly with headcount, a sign that part of the operation could be more automated. That's an opening for AI in general, whether through process automation, predictive models, advanced analytics, intelligent agents, or generative AI, depending on the type of task, the data available, and the expected impact."
    ),
  },
  {
    id: "dados-06",
    pillar: "dados",
    questionId: "dados_q4",
    trigger: "dados_q4 = 1 (sem histórico confiável)",
    scoreCondition: "0/5",
    answerMatch: [eq("dados_q4", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "dados-historico",
    title: bi("Sem histórico, sem previsão confiável", "No history, no reliable forecasting"),
    insight: bi(
      "Sem histórico de dados confiável, casos de uso preditivos como previsão de demanda, churn ou precificação dinâmica ficam limitados, porque há pouco padrão confiável para ser aprendido. O ponto de partida aqui é fortalecer a captura, o armazenamento e a confiabilidade do histórico antes de avançar para soluções mais sofisticadas de IA.",
      "Without a reliable data history, predictive use cases like demand forecasting, churn, or dynamic pricing are limited, because there's little reliable pattern to learn from. The starting point here is strengthening the capture, storage, and reliability of historical data before moving on to more sophisticated AI solutions."
    ),
  },
  {
    id: "dados-07",
    pillar: "dados",
    questionId: "dados_q4",
    trigger: "dados_q4 = 4 (vários anos de histórico confiável)",
    scoreCondition: "5/5",
    answerMatch: [eq("dados_q4", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "dados-historico",
    title: bi("Histórico de dados como ativo diferenciado", "Data history as a differentiated asset"),
    insight: bi(
      "Anos de dados históricos confiáveis são um ativo importante para casos de uso baseados em padrões, como precificação, segmentação, previsão de demanda ou análise comportamental. Essa maturidade cria boas condições para explorar aplicações de IA com maior profundidade e menor incerteza inicial.",
      "Years of reliable historical data are an important asset for pattern-based use cases, such as pricing, segmentation, demand forecasting, or behavioral analysis. That maturity creates good conditions for exploring AI applications with greater depth and less initial uncertainty."
    ),
  },
  {
    id: "dados-08",
    pillar: "dados",
    questionId: "dados_q5",
    trigger: "dados_q5 = 1 (\"Raramente\" consegue acessar dados na velocidade da decisão)",
    scoreCondition: "0/7",
    answerMatch: [eq("dados_q5", 1)],
    priority: 2,
    type: "risco-critico",
    theme: "dados-latencia",
    title: bi("Decisões mais rápidas que os dados", "Decisions move faster than the data"),
    insight: bi(
      "Quando os dados demoram para chegar, as decisões tendem a continuar dependendo de intuição, mesmo quando a empresa já possui informações relevantes armazenadas. Isso indica uma oportunidade de melhorar a camada de acesso, arquitetura e disponibilidade dos dados, para que a informação acompanhe melhor o ritmo da decisão.",
      "When data takes too long to arrive, decisions tend to keep relying on intuition, even when the company already has relevant information stored. That points to an opportunity to improve the data access layer, architecture, and availability, so information keeps pace with the speed of decision-making."
    ),
  },
  {
    id: "dados-09",
    pillar: "dados",
    questionId: "dados_q7",
    trigger: "dados_q7 = 1 (\"Nada confortável\" com decisões baseadas em dados)",
    scoreCondition: "0/4",
    answerMatch: [eq("dados_q7", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "dados-confianca",
    title: bi("Baixa confiança trava a adoção de IA", "Low trust blocks AI adoption"),
    insight: bi(
      "Baixa confiança nos dados pode limitar a adoção de IA mesmo quando a tecnologia funciona bem. Se a liderança não confia nos números por trás das recomendações, a tendência é que modelos e dashboards sejam pouco utilizados. O próximo passo seria aumentar a transparência, qualidade e rastreabilidade dos dados antes de introduzir recomendações orientadas por IA.",
      "Low trust in data can limit AI adoption even when the technology works well. If leadership doesn't trust the numbers behind the recommendations, models and dashboards tend to see little use. The next step would be increasing data transparency, quality, and traceability before introducing AI-driven recommendations."
    ),
  },

  // ---------------------------------------------------------------------
  // 2. Estratégia
  // ---------------------------------------------------------------------
  {
    id: "estrategia-01",
    pillar: "estrategia",
    questionId: "est_q1",
    trigger: "est_q1 = 3 (\"Não\" definiu visão) AND est_q1b = 3 (\"Não\" conhece potencial/valor econômico)",
    scoreCondition: "0",
    answerMatch: [eq("est_q1", 3), eq("est_q1b", 3)],
    priority: 1,
    type: "risco-critico",
    theme: "estrategia-visao",
    title: bi("Sem visão nem patrocínio para IA", "No vision or sponsorship for AI"),
    insight: bi(
      "Essa combinação indica um risco estratégico relevante: a empresa ainda não definiu uma visão clara para IA e a liderança não tem clareza sobre o valor econômico possível. Nessa situação, um piloto técnico pode ter dificuldade de ganhar tração. O primeiro passo mais adequado seria alinhar a liderança em torno de casos de negócio, prioridades e critérios de retorno.",
      "This combination points to a meaningful strategic risk: the company still hasn't defined a clear vision for AI, and leadership isn't clear on its possible economic value. In this situation, a technical pilot can struggle to gain traction. The most suitable first step would be aligning leadership around business cases, priorities, and return criteria."
    ),
  },
  {
    id: "estrategia-02",
    pillar: "estrategia",
    questionId: "est_q1a1a",
    trigger: "est_q1 = 1 (\"Sim\") AND est_q1a = 1 (\"Sim\") AND est_q1a1 = 1 (\"Sim\") AND est_q1a1a = 4 (\"Mensalmente ou mais\")",
    scoreCondition: "cadeia completa, pontuação máxima",
    answerMatch: [eq("est_q1", 1), eq("est_q1a", 1), eq("est_q1a1", 1), eq("est_q1a1a", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "estrategia-roadmap",
    title: bi("Governança de IA em nível de conselho", "Board-level AI governance"),
    insight: bi(
      "Visão clara, casos de uso priorizados, roadmap documentado e revisão frequente indicam uma maturidade estratégica acima da média. Essa organização parece preparada para tratar IA como um portfólio de iniciativas, com governança, priorização e acompanhamento contínuo, em vez de depender apenas de pilotos isolados.",
      "A clear vision, prioritized use cases, a documented roadmap, and frequent review point to above-average strategic maturity. This organization looks prepared to treat AI as a portfolio of initiatives, with governance, prioritization, and continuous tracking, rather than relying only on isolated pilots."
    ),
  },
  {
    id: "estrategia-03",
    pillar: "estrategia",
    questionId: "est_q1a1",
    trigger: "est_q1 = 1 (\"Sim\") AND est_q1a = 1 (\"Sim\") AND est_q1a1 = 2 (\"Não\" existe roadmap)",
    scoreCondition: "áreas mapeadas, roadmap ausente",
    answerMatch: [eq("est_q1", 1), eq("est_q1a", 1), eq("est_q1a1", 2)],
    priority: 2,
    type: "oportunidade",
    theme: "estrategia-roadmap",
    title: bi("Falta transformar análise em roadmap", "Analysis hasn't turned into a roadmap yet"),
    insight: bi(
      "A liderança já entende onde a IA pode gerar valor, mas esse entendimento ainda não foi traduzido em um plano com prazos, responsáveis e prioridades. Esse é um gap comum entre intenção estratégica e execução. O próximo passo seria estruturar um roadmap de 12 a 24 meses para transformar as oportunidades mapeadas em iniciativas executáveis.",
      "Leadership already understands where AI can generate value, but that understanding hasn't yet been translated into a plan with timelines, owners, and priorities. This is a common gap between strategic intent and execution. The next step would be structuring a 12-to-24-month roadmap to turn the mapped opportunities into executable initiatives."
    ),
  },
  {
    id: "estrategia-04",
    pillar: "estrategia",
    questionId: "est_q2",
    trigger: "est_q2 = 1 (Experimentação, sem estratégia definida)",
    scoreCondition: "0/7",
    answerMatch: [eq("est_q2", 1)],
    priority: 2,
    type: "proximo-passo",
    theme: "estrategia-maturidade",
    title: bi("Experimentação pontual, sem estratégia", "Ad hoc experimentation, no strategy"),
    insight: bi(
      "Testes pontuais são um estágio inicial comum e podem gerar aprendizados importantes. O cuidado é evitar que a experimentação fique desconectada de métricas de sucesso e prioridades de negócio. O próximo passo seria escolher um caso de uso bem delimitado, com objetivo claro, escopo controlado e critérios objetivos para decidir se ele deve avançar.",
      "Ad hoc tests are a common early stage and can produce important learnings. The care needed is to keep experimentation from becoming disconnected from success metrics and business priorities. The next step would be choosing a well-scoped use case, with a clear objective, controlled scope, and objective criteria for deciding whether it should move forward."
    ),
  },
  {
    id: "estrategia-05",
    pillar: "estrategia",
    questionId: "est_q2",
    trigger: "est_q2 = 4 (Vantagem competitiva central)",
    scoreCondition: "7/7",
    answerMatch: [eq("est_q2", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "estrategia-maturidade",
    title: bi("IA como vantagem competitiva estrutural", "AI as a structural competitive advantage"),
    insight: bi(
      "Quando a IA já faz parte da proposta de valor da empresa, a prioridade deixa de ser apenas adoção e passa a ser sustentação da vantagem competitiva. Isso envolve proteger ativos de dados, fortalecer capacidades internas, melhorar governança e manter uma cadência consistente de evolução dos modelos e produtos.",
      "When AI is already part of the company's value proposition, the priority shifts from just adoption to sustaining the competitive advantage. That involves protecting data assets, strengthening in-house capabilities, improving governance, and keeping a consistent cadence for evolving models and products."
    ),
  },
  {
    id: "estrategia-06",
    pillar: "estrategia",
    questionId: "est_q3",
    trigger: "est_q3 = 1 (\"De forma nenhuma\" há patrocínio executivo)",
    scoreCondition: "0/7",
    answerMatch: [eq("est_q3", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "estrategia-patrocinio",
    title: bi("Sem patrocínio executivo", "No executive sponsorship"),
    insight: bi(
      "A falta de patrocínio executivo reduz bastante a chance de iniciativas de IA avançarem além de testes isolados. Mesmo com boa tecnologia, projetos podem perder prioridade se não houver dono, orçamento e apoio visível da liderança. O próximo passo seria construir um caso de negócio claro o suficiente para mobilizar um patrocinador executivo.",
      "Lack of executive sponsorship greatly reduces the chance that AI initiatives move beyond isolated tests. Even with good technology, projects can lose priority without an owner, budget, and visible support from leadership. The next step would be building a business case clear enough to mobilize an executive sponsor."
    ),
  },
  {
    id: "estrategia-07",
    pillar: "estrategia",
    questionId: "est_q3",
    trigger: "est_q3 = 5 (\"De forma consistente e visível\")",
    scoreCondition: "7/7",
    answerMatch: [eq("est_q3", 5)],
    priority: 3,
    type: "forca-existente",
    theme: "estrategia-patrocinio",
    title: bi("Patrocínio executivo forte e visível", "Strong, visible executive sponsorship"),
    insight: bi(
      "Patrocínio executivo forte e contínuo reduz um dos principais riscos organizacionais de escalar IA. Com liderança engajada, a empresa tem melhores condições de priorizar iniciativas, remover bloqueios e sustentar investimentos ao longo do tempo. Isso permite considerar projetos mais estruturados e de maior impacto.",
      "Strong, ongoing executive sponsorship reduces one of the main organizational risks of scaling AI. With engaged leadership, the company is better positioned to prioritize initiatives, remove blockers, and sustain investment over time. That makes it possible to consider more structured, higher-impact projects."
    ),
  },
  {
    id: "estrategia-08",
    pillar: "estrategia",
    questionId: "est_q3a",
    // NOTE: est_q3a is scored under the "governanca" pillar in calculatePillarScores
    // (see scorePillar override in app/data.ts), even though the question itself
    // lives inside the Estratégia section. Kept as pillar "estrategia" here to
    // match the source insight doc's own grouping (2.3 sub-branch).
    trigger: "est_q3 answered AND est_q3a = 1 (\"Quase sempre\" há atrasos)",
    scoreCondition: "0/4",
    answerMatch: [eq("est_q3", 1, 2, 3, 4, 5), eq("est_q3a", 1)],
    priority: 2,
    type: "risco-critico",
    theme: "estrategia-entrega",
    title: bi("Atrasos recorrentes apesar do patrocínio", "Recurring delays despite sponsorship"),
    insight: bi(
      "Quando há patrocínio, mas as iniciativas atrasam com frequência, o gargalo pode estar menos na estratégia e mais na capacidade de execução. Isso pode envolver escopo, disponibilidade técnica, integração com sistemas, dados ou governança de entrega. O próximo passo seria diagnosticar onde os projetos travam antes de aumentar o número de iniciativas.",
      "When there's sponsorship but initiatives keep getting delayed, the bottleneck may be less about strategy and more about execution capacity. That can involve scope, technical availability, systems integration, data, or delivery governance. The next step would be diagnosing where projects get stuck before increasing the number of initiatives."
    ),
  },
  {
    id: "estrategia-09",
    pillar: "estrategia",
    // pess_q2 / pess_q2a keep their original ids for continuity, but as of
    // the pillar-ordered questionnaire revision they live in the Estratégia
    // section and score under the "estrategia" pillar in app/data.ts.
    questionId: "pess_q2a",
    trigger: "pess_q2 = 5 (\"Continuamente\" experimenta) AND pess_q2a = 4 (processo priorizado, medido, com critério de escalar/encerrar)",
    scoreCondition: "combinação de topo",
    answerMatch: [eq("pess_q2", 5), eq("pess_q2a", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "pessoas-experimentacao",
    title: bi("Pipeline de inovação já em prática", "Innovation pipeline already in practice"),
    insight: bi(
      "Experimentação contínua, priorizada e medida indica uma cultura de inovação mais madura. A empresa não apenas testa novas possibilidades, mas também cria critérios para escalar, ajustar ou encerrar iniciativas. O próximo passo natural é fortalecer a passagem dos experimentos bem-sucedidos para produção, evitando que bons testes fiquem presos na fase de piloto.",
      "Continuous, prioritized, measured experimentation points to a more mature innovation culture. The company doesn't just test new possibilities, it also sets criteria for scaling, adjusting, or ending initiatives. The natural next step is strengthening the path from successful experiments into production, so good tests don't stay stuck at the pilot stage."
    ),
  },

  // ---------------------------------------------------------------------
  // 3. Pessoas e Cultura
  // ---------------------------------------------------------------------
  {
    id: "pessoas-01",
    pillar: "pessoas",
    questionId: "pess_q3",
    trigger: "pess_q3 inclui apenas \"Nenhuma das anteriores\"",
    scoreCondition: "0",
    answerMatch: [includesAll("pess_q3", 5)],
    priority: 1,
    type: "risco-critico",
    theme: "pessoas-capacidade",
    title: bi("Nenhuma capacidade interna em dados ou IA", "No in-house data or AI capability"),
    insight: bi(
      "A ausência de capacidade interna em dados ou IA cria uma limitação importante para iniciar e sustentar projetos mais avançados. Isso não impede a empresa de avançar, mas indica que os primeiros passos devem ser bem delimitados e acompanhados de transferência de conhecimento, para evitar dependência excessiva ou iniciativas difíceis de manter.",
      "The lack of in-house data or AI capability creates an important limitation for starting and sustaining more advanced projects. That doesn't stop the company from moving forward, but it does mean the first steps should be well-scoped and paired with knowledge transfer, to avoid excessive dependency or initiatives that are hard to maintain."
    ),
  },
  {
    id: "pessoas-02",
    pillar: "pessoas",
    questionId: "pess_q3",
    trigger: "pess_q3 inclui \"Engenharia de Dados\" e não inclui IA generativa nem IA tradicional",
    scoreCondition: "n/a",
    answerMatch: [includesAll("pess_q3", 1), excludesAny("pess_q3", 2, 3)],
    priority: 2,
    type: "oportunidade",
    theme: "pessoas-capacidade",
    title: bi("Base de dados sem capacidade de IA", "Data foundation without AI capability"),
    insight: bi(
      "Ter capacidade de Engenharia de Dados sem expertise em IA é uma base promissora, mas ainda incompleta. A empresa provavelmente já consegue organizar e disponibilizar dados, mas pode precisar de apoio para transformar essa base em modelos, automações ou produtos analíticos. O foco deveria ser conectar a maturidade de dados a casos de uso aplicáveis.",
      "Having Data Engineering capability without AI expertise is a promising but still incomplete foundation. The company can likely already organize and make data available, but may need support turning that foundation into models, automations, or analytical products. The focus should be connecting data maturity to applicable use cases."
    ),
  },
  {
    id: "pessoas-03",
    pillar: "pessoas",
    questionId: "pess_q3",
    trigger: "pess_q3 inclui \"Engenharia de IA generativa\" e \"Engenharia de IA tradicional\"",
    scoreCondition: "n/a",
    answerMatch: [includesAll("pess_q3", 2, 3)],
    priority: 3,
    type: "forca-existente",
    theme: "pessoas-capacidade",
    title: bi("Capacidade dupla: IA preditiva e generativa", "Dual capability: predictive and generative AI"),
    insight: bi(
      "Ter capacidade interna em IA tradicional e IA generativa abre caminhos complementares. A empresa pode explorar tanto casos baseados em padrões, como previsão, segmentação e precificação, quanto aplicações generativas, como atendimento, automação de conhecimento e processamento de linguagem natural. Essa combinação permite uma abordagem mais ampla e estratégica.",
      "Having in-house capability in both traditional and generative AI opens up complementary paths. The company can explore both pattern-based cases, like forecasting, segmentation, and pricing, and generative applications, like support, knowledge automation, and natural language processing. This combination allows for a broader, more strategic approach."
    ),
  },
  {
    id: "pessoas-04",
    pillar: "pessoas",
    questionId: "pess_q4",
    trigger: "pess_q4 = 1 (colaboradores \"Resistentes\")",
    scoreCondition: "0/2",
    answerMatch: [eq("pess_q4", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "pessoas-cultura",
    title: bi("Resistência cultural à mudança", "Cultural resistance to change"),
    insight: bi(
      "Resistência cultural pode limitar a adoção de IA mesmo quando a solução técnica está bem construída. Se as equipes não entendem, confiam ou veem valor na mudança, a implementação tende a gerar pouco uso real. O próximo passo seria trabalhar comunicação, capacitação e pequenas vitórias visíveis antes de uma adoção ampla.",
      "Cultural resistance can limit AI adoption even when the technical solution is well built. If teams don't understand, trust, or see value in the change, implementation tends to generate little real use. The next step would be working on communication, training, and small, visible wins before a broad rollout."
    ),
  },
  {
    id: "pessoas-05",
    pillar: "pessoas",
    questionId: "pess_q4",
    trigger: "pess_q4 = 5 (\"Altamente receptivos\")",
    scoreCondition: "2/2",
    answerMatch: [eq("pess_q4", 5)],
    priority: 3,
    type: "forca-existente",
    theme: "pessoas-cultura",
    title: bi("Equipe altamente receptiva à IA", "Team highly receptive to AI"),
    insight: bi(
      "Alta receptividade das equipes é um acelerador importante para iniciativas de IA. Quando as pessoas estão abertas a testar novas formas de trabalho, a empresa tende a reduzir o atrito de adoção e aprender mais rápido. Isso permite considerar casos de uso um pouco mais ambiciosos, desde que bem priorizados e acompanhados.",
      "High team receptiveness is an important accelerator for AI initiatives. When people are open to trying new ways of working, the company tends to reduce adoption friction and learn faster. That makes it possible to consider slightly more ambitious use cases, as long as they're well prioritized and tracked."
    ),
  },
  {
    id: "pessoas-06",
    pillar: "pessoas",
    questionId: "pess_q5",
    trigger: "pess_q5 = 1 (sem conhecimento suficiente para avaliar se IA é a ferramenta adequada)",
    scoreCondition: "0/4",
    answerMatch: [eq("pess_q5", 1)],
    priority: 2,
    type: "oportunidade",
    theme: "pessoas-avaliacao",
    title: bi("Sem critério para avaliar onde usar IA", "No criteria for assessing where to use AI"),
    insight: bi(
      "Sem critérios claros para avaliar quando IA é a solução certa, a empresa pode priorizar casos de uso atraentes, mas pouco relevantes, ou deixar passar oportunidades com bom potencial. O próximo passo seria criar uma forma simples de avaliar oportunidades, considerando valor, viabilidade, risco, dados disponíveis e esforço de implementação.",
      "Without clear criteria for assessing when AI is the right solution, the company can prioritize appealing but not-very-relevant use cases, or miss opportunities with good potential. The next step would be creating a simple way to evaluate opportunities, considering value, feasibility, risk, available data, and implementation effort."
    ),
  },
  {
    id: "pessoas-07",
    pillar: "pessoas",
    questionId: "pess_q6",
    trigger: "pess_q6 = 1 (sem programas formais de treinamento em IA)",
    scoreCondition: "0/2.5",
    answerMatch: [eq("pess_q6", 1)],
    priority: 2,
    type: "oportunidade",
    theme: "pessoas-capacitacao",
    title: bi("Falta capacitação formal em IA", "Lack of formal AI upskilling"),
    insight: bi(
      "A ausência de capacitação formal pode fazer com que a adoção fique atrás da implementação. Ferramentas e modelos podem até ser entregues, mas o impacto depende de as equipes saberem quando, como e por que utilizá-los. Qualquer iniciativa de IA deveria incluir algum nível de treinamento, documentação e transferência de conhecimento.",
      "The lack of formal upskilling can leave adoption lagging behind implementation. Tools and models may even be delivered, but their impact depends on teams knowing when, how, and why to use them. Any AI initiative should include some level of training, documentation, and knowledge transfer."
    ),
  },

  // ---------------------------------------------------------------------
  // 4. Governança e Processo
  // ---------------------------------------------------------------------
  {
    id: "governanca-01",
    pillar: "governanca",
    questionId: "gov_q1",
    trigger: "gov_q1 = 1 (processos críticos \"Não documentados\")",
    scoreCondition: "0/5",
    answerMatch: [eq("gov_q1", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "governanca-documentacao",
    title: bi("Processos críticos não documentados", "Critical processes not documented"),
    insight: bi(
      "Processos críticos pouco documentados aumentam o risco de automações mal definidas, retrabalho e desalinhamento entre áreas. Antes de automatizar, é importante entender como o processo funciona hoje, onde estão as exceções e quais decisões precisam ser preservadas ou melhoradas. O próximo passo seria mapear os processos mais relevantes antes de avançar para automação.",
      "Poorly documented critical processes increase the risk of poorly defined automations, rework, and misalignment between areas. Before automating, it's important to understand how the process works today, where the exceptions are, and which decisions need to be preserved or improved. The next step would be mapping the most relevant processes before moving on to automation."
    ),
  },
  {
    id: "governanca-02",
    pillar: "governanca",
    questionId: "gov_q1",
    trigger: "gov_q1 = 4 (\"Totalmente documentados\")",
    scoreCondition: "5/5",
    answerMatch: [eq("gov_q1", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "governanca-documentacao",
    title: bi("Processos prontos para automação", "Processes ready for automation"),
    insight: bi(
      "Processos bem documentados criam uma base favorável para automação e melhoria operacional. Quando fluxos, responsáveis e exceções estão claros, fica mais fácil avaliar onde IA, analytics ou automação tradicional podem gerar impacto. Isso reduz incerteza de escopo e facilita a transição entre diagnóstico e execução.",
      "Well-documented processes create a favorable foundation for automation and operational improvement. When flows, owners, and exceptions are clear, it becomes easier to assess where AI, analytics, or traditional automation can generate impact. That reduces scope uncertainty and makes the transition from diagnosis to execution easier."
    ),
  },
  {
    id: "governanca-03",
    pillar: "governanca",
    questionId: "gov_q2",
    trigger: "gov_q2 = 1 (sem diretrizes, controles ou responsáveis de segurança de IA)",
    scoreCondition: "0/6",
    answerMatch: [eq("gov_q2", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "governanca-seguranca",
    title: bi("Sem diretrizes de segurança para IA", "No AI security guidelines"),
    insight: bi(
      "A ausência de diretrizes, controles e responsáveis para IA cria um risco importante, especialmente quando há dados sensíveis, decisões automatizadas ou uso de IA generativa. Antes de escalar novas iniciativas, faria sentido definir responsabilidades, critérios de segurança, regras de uso e mecanismos de revisão. Isso ajuda a reduzir exposição e aumenta a confiança na adoção.",
      "The absence of AI guidelines, controls, and owners creates a significant risk, especially where there's sensitive data, automated decisions, or generative AI use. Before scaling new initiatives, it would make sense to define responsibilities, security criteria, usage rules, and review mechanisms. That helps reduce exposure and builds confidence in adoption."
    ),
  },
  {
    id: "governanca-04",
    pillar: "governanca",
    questionId: "gov_q2",
    trigger: "gov_q2 = 2 (riscos tratados por TI genérica, sem abordagem específica de IA)",
    scoreCondition: "3/6",
    answerMatch: [eq("gov_q2", 2)],
    priority: 2,
    type: "oportunidade",
    theme: "governanca-seguranca",
    title: bi("Segurança de TI genérica, não específica de IA", "Generic IT security, not AI-specific"),
    insight: bi(
      "Processos gerais de TI ajudam, mas podem não cobrir todos os riscos específicos de IA, como vazamento de dados por prompts, uso inadequado de informações sensíveis ou decisões automatizadas sem revisão humana. Essa resposta indica uma base parcial, mas também uma oportunidade de adaptar os controles existentes aos riscos próprios de IA.",
      "General IT processes help, but may not cover every AI-specific risk, such as data leaks through prompts, inappropriate use of sensitive information, or automated decisions without human review. This answer points to a partial foundation, but also an opportunity to adapt existing controls to AI's own risks."
    ),
  },
  {
    id: "governanca-05",
    pillar: "governanca",
    questionId: "gov_q2",
    trigger: "gov_q2 = 3 (responsabilidades e controles claramente definidos e adaptados a riscos de IA)",
    scoreCondition: "6/6",
    answerMatch: [eq("gov_q2", 3)],
    priority: 3,
    type: "forca-existente",
    theme: "governanca-seguranca",
    title: bi("Governança de IA madura e específica", "Mature, AI-specific governance"),
    insight: bi(
      "Governança específica para IA é uma vantagem importante, especialmente em setores regulados ou que lidam com dados sensíveis. Com responsabilidades, controles e processos bem definidos, a empresa tem mais segurança para avaliar casos de uso mais complexos, mantendo gestão de risco e compliance como parte da operação.",
      "AI-specific governance is an important advantage, especially in regulated sectors or ones that handle sensitive data. With well-defined responsibilities, controls, and processes, the company is better positioned to evaluate more complex use cases, keeping risk management and compliance as part of the operation."
    ),
  },

  // ---------------------------------------------------------------------
  // 5. Tecnologia
  // ---------------------------------------------------------------------
  {
    id: "tecnologia-01",
    pillar: "tecnologia",
    questionId: "tec_q1b",
    trigger: "tec_q1 = 1 (ainda não existem projetos) AND tec_q1b = 1 (\"Não\", começaria do zero)",
    scoreCondition: "0",
    answerMatch: [eq("tec_q1", 1), eq("tec_q1b", 1)],
    priority: 2,
    type: "oportunidade",
    theme: "tecnologia-maturidade-inicial",
    title: bi("Ponto de partida limpo, sem legado", "Clean starting point, no legacy"),
    insight: bi(
      "Começar do zero exige cuidado, mas também permite desenhar a primeira iniciativa sem herdar decisões técnicas antigas. O caminho mais seguro seria iniciar com um caso de uso bem delimitado, escopo controlado e critérios claros de sucesso. Isso ajuda a criar aprendizado interno antes de pensar em um programa mais amplo.",
      "Starting from scratch requires care, but it also means designing the first initiative without inheriting old technical decisions. The safest path would be starting with a well-scoped use case, controlled scope, and clear success criteria. That helps build in-house learning before thinking about a broader program."
    ),
  },
  {
    id: "tecnologia-02",
    pillar: "tecnologia",
    questionId: "tec_q1b",
    trigger: "tec_q1 = 1 (ainda não existem projetos) AND tec_q1b = 3 (\"Sim\", conseguiria conectar dados/sistemas)",
    scoreCondition: "3.5",
    answerMatch: [eq("tec_q1", 1), eq("tec_q1b", 3)],
    priority: 3,
    type: "forca-existente",
    theme: "tecnologia-maturidade-inicial",
    title: bi("Base técnica pronta, sem projetos ainda", "Technical foundation ready, no projects yet"),
    insight: bi(
      "Mesmo sem projetos de IA iniciados, a empresa parece ter uma base técnica capaz de conectar dados e sistemas com os recursos atuais. Isso sugere que a barreira inicial pode estar mais em priorização, estratégia ou definição de caso de uso do que em infraestrutura. Com um bom recorte, a empresa pode avançar para um primeiro piloto com menos preparação técnica do que organizações que ainda precisam estruturar a base.",
      "Even without any AI projects started, the company appears to have a technical foundation capable of connecting data and systems with current resources. That suggests the initial barrier may be more about prioritization, strategy, or use-case definition than infrastructure. With the right scope, the company can move to a first pilot with less technical preparation than organizations that still need to build their foundation."
    ),
  },
  {
    id: "tecnologia-03",
    pillar: "tecnologia",
    questionId: "tec_q1c",
    trigger: "tec_q1 = 2 (1 a 4 projetos) AND tec_q1c = 1 (\"Parados\")",
    scoreCondition: "0/2",
    answerMatch: [eq("tec_q1", 2), eq("tec_q1c", 1)],
    priority: 2,
    type: "risco-critico",
    theme: "tecnologia-execucao",
    title: bi("Projetos de IA parados", "Stalled AI projects"),
    insight: bi(
      "Projetos de IA parados não significam necessariamente que a tecnologia falhou. Muitas vezes, o bloqueio está em escopo, dono do projeto, dados, integração, governança ou capacidade de entrega. O próximo passo seria revisar os projetos existentes, identificar o motivo da paralisação e decidir quais valem ser retomados, redesenhados ou encerrados.",
      "Stalled AI projects don't necessarily mean the technology failed. Often the blocker is scope, project ownership, data, integration, governance, or delivery capacity. The next step would be reviewing existing projects, identifying the reason for the stall, and deciding which are worth resuming, redesigning, or closing."
    ),
  },
  {
    id: "tecnologia-04",
    pillar: "tecnologia",
    questionId: "tec_q1d",
    trigger: "tec_q1 = 2 (1 a 4 projetos) AND tec_q1d = 4 (\"Misto\", IA tradicional e generativa)",
    scoreCondition: "2/2",
    answerMatch: [eq("tec_q1", 2), eq("tec_q1d", 4)],
    priority: 2,
    type: "proximo-passo",
    theme: "tecnologia-arquitetura",
    title: bi("IA tradicional e generativa em paralelo", "Traditional and generative AI running in parallel"),
    insight: bi(
      "Trabalhar com IA tradicional e IA generativa em paralelo pode ser uma combinação saudável, desde que haja clareza sobre arquitetura, manutenção e integração. Sem algum nível de padronização, cada novo projeto pode adicionar complexidade operacional. O próximo passo seria definir práticas comuns para desenvolvimento, monitoramento e evolução dessas soluções.",
      "Working with traditional and generative AI in parallel can be a healthy combination, as long as there's clarity on architecture, maintenance, and integration. Without some level of standardization, each new project can add operational complexity. The next step would be defining common practices for developing, monitoring, and evolving these solutions."
    ),
  },
  {
    id: "tecnologia-05",
    pillar: "tecnologia",
    questionId: "tec_q1e",
    trigger: "tec_q1 = 2 (1 a 4 projetos) AND tec_q1e = 1 (sem integração a sistemas internos)",
    scoreCondition: "0/2",
    answerMatch: [eq("tec_q1", 2), eq("tec_q1e", 1)],
    priority: 2,
    type: "risco-critico",
    theme: "tecnologia-integracao",
    title: bi("IA isolada dos sistemas centrais", "AI isolated from core systems"),
    insight: bi(
      "Projetos de IA que não se integram aos sistemas centrais tendem a gerar valor de forma limitada. Mesmo quando funcionam bem, podem ficar restritos a poucos usuários ou depender de processos manuais para serem utilizados. Priorizar integração com sistemas como CRM, ERP, ferramentas internas ou fluxos operacionais ajuda a transformar uma prova de conceito em capacidade real de negócio.",
      "AI projects that don't integrate with core systems tend to generate limited value. Even when they work well, they can stay restricted to a few users or depend on manual processes to be used. Prioritizing integration with systems like CRM, ERP, internal tools, or operational workflows helps turn a proof of concept into real business capability."
    ),
  },
  {
    id: "tecnologia-06",
    pillar: "tecnologia",
    questionId: "tec_q1g",
    trigger: "tec_q1 = 2 (1 a 4 projetos) AND tec_q1g = 3 (soluções reutilizáveis e escaláveis)",
    scoreCondition: "2/2",
    answerMatch: [eq("tec_q1", 2), eq("tec_q1g", 3)],
    priority: 3,
    type: "forca-existente",
    theme: "tecnologia-arquitetura",
    title: bi("Arquitetura pensada para reuso", "Architecture designed for reuse"),
    insight: bi(
      "Projetar soluções de IA com reutilização e escala desde o início é um sinal positivo de maturidade técnica. Isso reduz o risco de criar iniciativas isoladas por área e aumenta a chance de reaproveitar componentes, dados, integrações e aprendizados em novos casos de uso. O próximo passo seria consolidar essas práticas para sustentar o crescimento do portfólio.",
      "Designing AI solutions for reuse and scale from the start is a positive sign of technical maturity. That reduces the risk of creating isolated initiatives per area and increases the chance of reusing components, data, integrations, and learnings in new use cases. The next step would be consolidating these practices to sustain portfolio growth."
    ),
  },
  {
    id: "tecnologia-07",
    pillar: "tecnologia",
    questionId: "tec_q2a",
    trigger: "tec_q1 = 3 (5 ou mais projetos) AND tec_q2a = 1 (não são atualizados com frequência)",
    scoreCondition: "0/2",
    answerMatch: [eq("tec_q1", 3), eq("tec_q2a", 1)],
    priority: 2,
    type: "risco-critico",
    theme: "tecnologia-manutencao",
    title: bi("Portfólio de IA sem manutenção", "Unmaintained AI portfolio"),
    insight: bi(
      "Ter vários projetos de IA sem uma cadência clara de atualização cria um risco silencioso. Modelos, regras e integrações podem perder aderência com o tempo, especialmente quando os dados, o mercado ou os processos mudam. Essa resposta sugere a necessidade de revisar a saúde do portfólio existente antes de adicionar novas iniciativas.",
      "Having several AI projects without a clear update cadence creates a silent risk. Models, rules, and integrations can lose fit over time, especially when data, the market, or processes change. This answer suggests the need to review the health of the existing portfolio before adding new initiatives."
    ),
  },
  {
    id: "tecnologia-08",
    pillar: "tecnologia",
    questionId: "tec_q2b",
    trigger: "tec_q1 = 3 (5 ou mais projetos) AND tec_q2b = 3 (\"Ecossistema integrado\")",
    scoreCondition: "2/2",
    answerMatch: [eq("tec_q1", 3), eq("tec_q2b", 3)],
    priority: 3,
    type: "forca-existente",
    theme: "tecnologia-integracao",
    title: bi("Ecossistema de IA já integrado", "AI ecosystem already integrated"),
    insight: bi(
      "Um ecossistema de IA integrado indica que a empresa já passou da fase de ferramentas isoladas e começou a construir uma capacidade mais estruturada. O próximo desafio passa a ser sustentar essa escala com governança, monitoramento, priorização e manutenção contínua. Nesse estágio, a maturidade operacional se torna tão importante quanto a criação de novos modelos.",
      "An integrated AI ecosystem shows the company has already moved past the stage of isolated tools and started building a more structured capability. The next challenge becomes sustaining that scale with governance, monitoring, prioritization, and ongoing maintenance. At this stage, operational maturity becomes just as important as building new models."
    ),
  },
  {
    id: "tecnologia-09",
    pillar: "tecnologia",
    questionId: "tec_q2e",
    trigger: "tec_q1 = 3 (5 ou mais projetos) AND tec_q2e = 1 (nenhum resultado mensurável entregue)",
    scoreCondition: "0/1",
    answerMatch: [eq("tec_q1", 3), eq("tec_q2e", 1)],
    priority: 1,
    type: "risco-critico",
    theme: "tecnologia-resultados",
    title: bi("Volume de projetos sem resultado comprovado", "High project volume with no proven result"),
    insight: bi(
      "Ter cinco ou mais projetos sem resultado mensurável claro sugere que os critérios de sucesso talvez não tenham sido definidos ou acompanhados de forma consistente. Isso não significa que os projetos não tenham valor, mas dificulta provar impacto e priorizar investimentos futuros. O próximo passo seria criar um framework de mensuração aplicado ao portfólio existente.",
      "Having five or more projects with no clear measurable result suggests success criteria may not have been defined or tracked consistently. That doesn't mean the projects have no value, but it makes it harder to prove impact and prioritize future investment. The next step would be creating a measurement framework applied to the existing portfolio."
    ),
  },
  {
    id: "tecnologia-10",
    pillar: "tecnologia",
    questionId: "tec_q2f",
    trigger: "tec_q1 = 3 (5 ou mais projetos) AND tec_q2f = 3 (soluções reutilizáveis e escaláveis)",
    scoreCondition: "2/2",
    answerMatch: [eq("tec_q1", 3), eq("tec_q2f", 3)],
    priority: 3,
    type: "forca-existente",
    theme: "tecnologia-arquitetura",
    title: bi("Plataforma de IA pronta para escalar", "AI platform ready to scale"),
    insight: bi(
      "Com cinco ou mais projetos e arquitetura reutilizável, a empresa já se aproxima de uma capacidade interna de plataforma de IA. A prioridade deixa de ser apenas provar valor inicial e passa a ser sustentar escala, governança, manutenção e reaproveitamento entre áreas. Isso exige processos mais maduros para decidir o que construir, como monitorar e como evoluir as soluções.",
      "With five or more projects and a reusable architecture, the company is already approaching an in-house AI platform capability. The priority shifts from just proving initial value to sustaining scale, governance, maintenance, and reuse across areas. That requires more mature processes for deciding what to build, how to monitor, and how to evolve the solutions."
    ),
  },
  {
    id: "tecnologia-11",
    pillar: "tecnologia",
    questionId: "tec_q1",
    // Meta/editorial observation about the pillar itself rather than a specific
    // recommendation — kept as low-priority filler, only surfaced when little
    // else is available.
    trigger: "tec_q1 respondido (qualquer valor)",
    scoreCondition: "0 versus 4 pontos-base",
    answerMatch: [eq("tec_q1", 1, 2, 3)],
    priority: 4,
    type: "proximo-passo",
    theme: "tecnologia-meta",
    title: bi("Tecnologia é a dimensão mais decisiva", "Technology is the most decisive dimension"),
    insight: bi(
      "A diferença entre não ter projetos de IA e ter cinco ou mais representa um dos maiores saltos de maturidade dentro da dimensão Tecnologia. Essa diferença mostra como a experiência prática influencia o resultado final, especialmente porque tecnologia costuma ser mais observável do que dimensões como cultura ou estratégia. Vale destacar essa dimensão na página de resultados como um fator importante para entender o estágio atual da organização.",
      "The gap between having no AI projects and having five or more represents one of the biggest maturity jumps within the Technology dimension. That gap shows how much hands-on experience shapes the final result, especially because technology tends to be more observable than dimensions like culture or strategy. It's worth highlighting this dimension on the results page as an important factor for understanding the organization's current stage."
    ),
  },
];

// ---------------------------------------------------------------------
// Generic pillar-level fallback, used only when a pillar has no specific
// branch insight matching the user's answers. Low-score text reuses the
// existing RECOMMENDATIONS copy from app/data.ts; high-score text is a
// short, generic filler used only when specific answer-driven insights are sparse.
// ---------------------------------------------------------------------
const FALLBACK_HIGH_TEXT: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "A maturidade em Dados observada aqui reduz uma das principais incertezas de projetos de IA. Vale priorizar casos de uso com impacto mensurável enquanto essa base está disponível.",
    "The Data maturity observed here removes one of the main uncertainties in AI projects. It's worth prioritizing use cases with measurable impact while this foundation is available."
  ),
  estrategia: bi(
    "A maturidade estratégica observada aqui permite tratar IA como um portfólio de iniciativas, com prioridades e acompanhamento de valor, não apenas como experimentos isolados.",
    "The strategic maturity observed here makes it possible to treat AI as a portfolio of initiatives, with priorities and value tracking, not just as isolated experiments."
  ),
  pessoas: bi(
    "A maturidade cultural e de capacitação observada aqui reduz o risco de adoção lenta e favorece ciclos mais rápidos de teste, aprendizado e incorporação.",
    "The cultural and upskilling maturity observed here reduces the risk of slow adoption and favors faster cycles of testing, learning, and adoption."
  ),
  governanca: bi(
    "A maturidade de governança observada aqui permite avaliar iniciativas mais complexas com menos atrito, desde que controles e responsabilidades continuem claros.",
    "The governance maturity observed here makes it possible to evaluate more complex initiatives with less friction, as long as controls and responsibilities stay clear."
  ),
  tecnologia: bi(
    "A maturidade técnica observada aqui permite avançar além de pilotos isolados, com foco em integração, monitoramento, reutilização e escala.",
    "The technical maturity observed here makes it possible to move beyond isolated pilots, with a focus on integration, monitoring, reuse, and scale."
  ),
};

function buildFallbackInsight(pillar: InsightPillarId, tier: "low" | "high"): RawResultInsight {
  const ptLabel = getPillarLabel(pillar, "pt");
  const enLabel = getPillarLabel(pillar, "en");
  return {
    id: `fallback-${pillar}-${tier}`,
    pillar,
    questionId: "",
    trigger: `nenhum insight específico correspondeu; fallback de nível de pilar (${tier} score)`,
    scoreCondition: tier,
    answerMatch: [],
    priority: 4,
    type: tier === "low" ? "proximo-passo" : "forca-existente",
    theme: `fallback-${pillar}`,
    title: tier === "low"
      ? bi(`${ptLabel}: próximo passo recomendado`, `${enLabel}: recommended next step`)
      : bi(`${ptLabel}: força identificada`, `${enLabel}: identified strength`),
    insight: tier === "low" ? RECOMMENDATIONS[pillar] : FALLBACK_HIGH_TEXT[pillar],
  };
}

const FALLBACK_INSIGHTS: Record<InsightPillarId, { low: RawResultInsight; high: RawResultInsight }> =
  Object.fromEntries(
    PILLAR_ORDER.map(p => [p, { low: buildFallbackInsight(p, "low"), high: buildFallbackInsight(p, "high") }])
  ) as Record<InsightPillarId, { low: RawResultInsight; high: RawResultInsight }>;

// ---------------------------------------------------------------------
// Matching + selection
// ---------------------------------------------------------------------

function conditionMet(cond: AnswerCondition, answers: AnswerRecord): boolean {
  const answer = answers[cond.questionId];
  if (answer === undefined || answer === null) return false;
  if (cond.op === "equals") {
    return typeof answer === "number" && cond.values.includes(answer);
  }
  const selected = Array.isArray(answer) ? (answer as number[]) : [];
  if (cond.op === "includesAll") {
    return cond.values.every(v => selected.includes(v));
  }
  // excludesAny
  return !cond.values.some(v => selected.includes(v));
}

function insightMatches(insight: RawResultInsight, answers: AnswerRecord): boolean {
  return insight.answerMatch.every(cond => conditionMet(cond, answers));
}

export interface SelectInsightsOptions {
  min?: number;
  max?: number;
}

/**
 * Picks 3-6 insights for the results page. The selector favors specific,
 * answer-driven diagnostics over generic observations, gives the weakest
 * pillar a chance to appear, includes a strength when the answers support it,
 * and dedupes nearby ideas by theme.
 */
export function selectResultInsights(
  answers: AnswerRecord,
  pillarScores: PillarScore[],
  options: SelectInsightsOptions = {},
  lang: Lang = DEFAULT_LANG
): ResultInsight[] {
  const { min = 3, max = 6 } = options;
  if (pillarScores.length === 0) return [];

  const scoreById = Object.fromEntries(pillarScores.map(p => [p.id, p.score])) as Record<InsightPillarId, number>;
  const weakestPillar = pillarScores.reduce((a, b) => (b.score < a.score ? b : a)).id as InsightPillarId;
  const strongestPillar = pillarScores.reduce((a, b) => (b.score > a.score ? b : a)).id as InsightPillarId;

  function compareMatchedInsights(a: RawResultInsight, b: RawResultInsight) {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aScore = scoreById[a.pillar] ?? 0;
    const bScore = scoreById[b.pillar] ?? 0;
    if (a.priority === 3 && aScore !== bScore) return bScore - aScore;
    if (a.priority !== 3 && aScore !== bScore) return aScore - bScore;
    return PILLAR_ORDER.indexOf(a.pillar) - PILLAR_ORDER.indexOf(b.pillar);
  }

  const matched = RESULT_INSIGHTS
    .filter(i => insightMatches(i, answers))
    .sort(compareMatchedInsights);
  const specificMatched = matched.filter(i => i.priority < 4);

  const selected: RawResultInsight[] = [];
  const pillarCount: Partial<Record<InsightPillarId, number>> = {};
  const usedThemes = new Set<string>();

  function capFor(pillar: InsightPillarId) {
    return pillar === weakestPillar || pillar === strongestPillar ? 3 : 2;
  }

  function tryAdd(insight: RawResultInsight, opts: { ignorePillarCap?: boolean; ignoreTheme?: boolean } = {}) {
    if (selected.some(s => s.id === insight.id)) return false;
    if (!opts.ignoreTheme && usedThemes.has(insight.theme)) return false;
    const count = pillarCount[insight.pillar] ?? 0;
    if (!opts.ignorePillarCap && count >= capFor(insight.pillar)) return false;
    selected.push(insight);
    pillarCount[insight.pillar] = count + 1;
    usedThemes.add(insight.theme);
    return true;
  }

  function rebuildSelectionState() {
    for (const pillar of PILLAR_ORDER) delete pillarCount[pillar];
    usedThemes.clear();
    for (const insight of selected) {
      pillarCount[insight.pillar] = (pillarCount[insight.pillar] ?? 0) + 1;
      usedThemes.add(insight.theme);
    }
  }

  function removeSelectedAt(index: number) {
    selected.splice(index, 1);
    rebuildSelectionState();
  }

  function forceInclude(insight: RawResultInsight) {
    if (selected.some(s => s.id === insight.id)) return false;
    if (selected.length < max) {
      return tryAdd(insight, { ignorePillarCap: true, ignoreTheme: true });
    }

    let replaceIdx = -1;
    for (let i = selected.length - 1; i >= 0; i--) {
      if (selected[i].pillar !== insight.pillar && selected[i].priority > insight.priority) {
        replaceIdx = i;
        break;
      }
    }
    if (replaceIdx === -1) {
      for (let i = selected.length - 1; i >= 0; i--) {
        const canLoseSlot = selected[i].pillar !== weakestPillar && selected[i].pillar !== strongestPillar;
        if (canLoseSlot && selected[i].priority >= 3) {
          replaceIdx = i;
          break;
        }
      }
    }
    if (replaceIdx === -1 && insight.priority === 3) {
      for (let i = selected.length - 1; i >= 0; i--) {
        if (selected[i].pillar !== weakestPillar && selected[i].priority > 1) {
          replaceIdx = i;
          break;
        }
      }
    }
    if (replaceIdx === -1) return false;

    removeSelectedAt(replaceIdx);
    return tryAdd(insight, { ignorePillarCap: true, ignoreTheme: true });
  }

  // Pass 1: specific answer-driven insights first, respecting caps + theme dedup.
  for (const insight of specificMatched) {
    if (selected.length >= max) break;
    tryAdd(insight);
  }

  // Make sure the weakest pillar is represented when a specific diagnostic
  // exists. If not, add a generic next step only when there is still room.
  if (!selected.some(i => i.pillar === weakestPillar)) {
    const weakestSpecific = specificMatched.find(i => i.pillar === weakestPillar);
    if (weakestSpecific) {
      forceInclude(weakestSpecific);
    } else if (selected.length < max) {
      const tier = scoreById[weakestPillar] >= 60 ? "high" : "low";
      tryAdd(FALLBACK_INSIGHTS[weakestPillar][tier], { ignorePillarCap: true, ignoreTheme: true });
    }
  }

  // Make sure at least one strength insight appears when the user has mature
  // answers, even if the critical/gap insights already filled every slot.
  const hasStrength = selected.some(i => i.priority === 3);
  if (!hasStrength) {
    const topStrength = specificMatched.find(i => i.priority === 3);
    if (topStrength) {
      forceInclude(topStrength);
    }
  }

  // Pass 2: still short of the minimum -> relax the per-pillar cap.
  if (selected.length < min) {
    for (const insight of specificMatched) {
      if (selected.length >= min) break;
      tryAdd(insight, { ignorePillarCap: true });
    }
  }

  // Pass 3: still short -> generic pillar-level fallback, weakest pillar first.
  if (selected.length < min) {
    const pillarOrder = [weakestPillar, ...PILLAR_ORDER.filter(p => p !== weakestPillar)];
    for (const pillar of pillarOrder) {
      if (selected.length >= min) break;
      if (pillarCount[pillar]) continue;
      const tier = scoreById[pillar] >= 60 ? "high" : "low";
      tryAdd(FALLBACK_INSIGHTS[pillar][tier], { ignorePillarCap: true, ignoreTheme: true });
    }
  }

  // Pass 4: only if still short, allow low-priority editorial observations.
  if (selected.length < min) {
    for (const insight of matched.filter(i => i.priority === 4)) {
      if (selected.length >= min) break;
      tryAdd(insight, { ignorePillarCap: true });
    }
  }

  return selected.slice(0, max).map(insight => localizeInsight(insight, lang));
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function safeClientText(text: string, lang: Lang) {
  const cleaned = cleanText(text);
  if (lang === "en") {
    return cleaned
      .replace(/pipeline/gi, "initiative sequence")
      .replace(/ingestion/gi, "data intake")
      .replace(/lakehouse/gi, "analytics base")
      .replace(/medallion/gi, "layered model")
      .replace(/data mesh/gi, "distributed data model")
      .replace(/governance/gi, "clear accountability rules");
  }
  return cleaned
    .replace(/pipeline/gi, "sequência de iniciativas")
    .replace(/ingestão/gi, "entrada de dados")
    .replace(/lakehouse/gi, "base analítica")
    .replace(/medallion/gi, "modelo em camadas")
    .replace(/data mesh/gi, "modelo distribuído de dados")
    .replace(/governança/gi, "regras claras de responsabilidade");
}

export interface QuarterlyRecommendation {
  id: "q1" | "q2" | "q3";
  period: string;
  focus: string;
  title: string;
  action: string;
  outcome: string;
  ownerRole: string;
  dependency: string;
  effort: string;
  successMetric: string;
}

interface QuarterlyPillarAction {
  stabilizeTitle: Bilingual;
  stabilizeAction: Bilingual;
  stabilizeOutcome: Bilingual;
  pilotTitle: Bilingual;
  pilotAction: Bilingual;
  pilotOutcome: Bilingual;
  scaleTitle: Bilingual;
  scaleAction: Bilingual;
  scaleOutcome: Bilingual;
}

const QUARTERLY_PILLAR_ACTIONS: Record<InsightPillarId, QuarterlyPillarAction> = {
  dados: {
    stabilizeTitle: bi("Estabilizar a base de dados", "Stabilize the data foundation"),
    stabilizeAction: bi("mapear fontes críticas, responsáveis, qualidade, acesso e histórico necessário para os casos de uso mais importantes", "map critical sources, owners, quality, access, and the history needed for the most important use cases"),
    stabilizeOutcome: bi("uma base mínima confiável para escolher pilotos sem retrabalho de coleta e integração", "a minimum reliable foundation for choosing pilots without collection and integration rework"),
    pilotTitle: bi("Transformar dados em caso de uso", "Turn data into a use case"),
    pilotAction: bi("escolher um fluxo em que dados disponíveis apoiem uma decisão relevante, definir métrica de valor e preparar o dataset governado", "choose a flow where available data supports a relevant decision, define a value metric, and prepare the governed dataset"),
    pilotOutcome: bi("um caso priorizado com dados rastreáveis e critérios claros de viabilidade", "a prioritized case with traceable data and clear feasibility criteria"),
    scaleTitle: bi("Criar rotina de dados para escala", "Create a data routine for scale"),
    scaleAction: bi("documentar padrões de acesso, atualização, qualidade e monitoramento para reutilizar dados em novas iniciativas", "document access, update, quality, and monitoring standards to reuse data in new initiatives"),
    scaleOutcome: bi("menos dependência de coletas manuais e mais velocidade para novos casos de uso", "less dependence on manual collection and more speed for new use cases"),
  },
  estrategia: {
    stabilizeTitle: bi("Alinhar liderança e tese de valor", "Align leadership and the value thesis"),
    stabilizeAction: bi("definir patrocinador, problema de negócio, métrica econômica e critérios para decidir quais oportunidades de IA merecem investimento", "define a sponsor, business problem, economic metric, and criteria for deciding which AI opportunities deserve investment"),
    stabilizeOutcome: bi("um ponto de vista executivo claro sobre onde IA deve gerar valor primeiro", "a clear executive point of view on where AI should generate value first"),
    pilotTitle: bi("Converter intenção em roadmap", "Turn intent into a roadmap"),
    pilotAction: bi("priorizar dois ou três casos de uso, atribuir donos, definir prazos e conectar cada iniciativa a uma métrica de resultado", "prioritize two or three use cases, assign owners, set timelines, and tie each initiative to an outcome metric"),
    pilotOutcome: bi("um roadmap executável de curto prazo, com menos dependência de iniciativas isoladas", "an executable short-term roadmap, with less dependence on isolated initiatives"),
    scaleTitle: bi("Instalar cadência de portfólio", "Set up a portfolio cadence"),
    scaleAction: bi("revisar mensalmente progresso, valor capturado, riscos e decisões de continuidade, pausa ou escala dos casos de uso", "review progress, captured value, risks, and continue/pause/scale decisions for use cases on a monthly basis"),
    scaleOutcome: bi("IA gerida como portfólio, não como coleção de experimentos desconectados", "AI managed as a portfolio, not as a collection of disconnected experiments"),
  },
  pessoas: {
    stabilizeTitle: bi("Preparar equipes para adoção", "Prepare teams for adoption"),
    stabilizeAction: bi("identificar usuários-chave, lacunas de conhecimento, resistências e rituais de comunicação antes de introduzir novas soluções", "identify key users, knowledge gaps, resistance, and communication rituals before introducing new solutions"),
    stabilizeOutcome: bi("menos atrito de mudança e mais clareza sobre como a IA entra no trabalho real", "less change friction and more clarity on how AI fits into real work"),
    pilotTitle: bi("Rodar capacitação aplicada", "Run applied upskilling"),
    pilotAction: bi("treinar os times envolvidos no piloto, criar critérios simples de uso e coletar feedback semanal sobre adoção e barreiras", "train the teams involved in the pilot, create simple usage criteria, and collect weekly feedback on adoption and barriers"),
    pilotOutcome: bi("equipes capazes de testar IA com responsabilidade e transformar aprendizado em melhoria operacional", "teams capable of testing AI responsibly and turning learning into operational improvement"),
    scaleTitle: bi("Formalizar playbook de adoção", "Formalize an adoption playbook"),
    scaleAction: bi("documentar práticas, exemplos, responsáveis e materiais de treinamento para replicar a adoção em novas áreas", "document practices, examples, owners, and training materials to replicate adoption in new areas"),
    scaleOutcome: bi("capacidade interna mais consistente para absorver novas iniciativas de IA", "more consistent in-house capacity to absorb new AI initiatives"),
  },
  governanca: {
    stabilizeTitle: bi("Definir controles mínimos de IA", "Define minimum AI controls"),
    stabilizeAction: bi("estabelecer responsáveis, regras de uso, critérios de segurança, revisão humana e tratamento de dados sensíveis", "establish owners, usage rules, security criteria, human review, and handling of sensitive data"),
    stabilizeOutcome: bi("um perímetro claro para avançar sem aumentar exposição operacional, legal ou reputacional", "a clear perimeter for moving forward without increasing operational, legal, or reputational exposure"),
    pilotTitle: bi("Aplicar governança no piloto", "Apply governance in the pilot"),
    pilotAction: bi("incorporar controles de risco, privacidade, documentação de processo e critérios de aprovação dentro do primeiro caso de uso", "build risk controls, privacy, process documentation, and approval criteria into the first use case"),
    pilotOutcome: bi("um modelo de entrega que já nasce auditável e mais fácil de repetir", "a delivery model that's auditable from the start and easier to repeat"),
    scaleTitle: bi("Criar revisão recorrente", "Create a recurring review"),
    scaleAction: bi("manter cadência de revisão de riscos, responsáveis, qualidade dos processos e decisões automatizadas ou assistidas por IA", "maintain a review cadence for risks, owners, process quality, and AI-automated or AI-assisted decisions"),
    scaleOutcome: bi("governança suficiente para sustentar escala sem travar a execução", "enough governance to sustain scale without blocking execution"),
  },
  tecnologia: {
    stabilizeTitle: bi("Definir base técnica de execução", "Define a technical execution foundation"),
    stabilizeAction: bi("avaliar integrações, ambientes, dados, segurança e caminho de produção antes de escolher novas ferramentas ou modelos", "assess integrations, environments, data, security, and the path to production before choosing new tools or models"),
    stabilizeOutcome: bi("um desenho técnico realista para tirar iniciativas do protótipo", "a realistic technical design for moving initiatives past the prototype stage"),
    pilotTitle: bi("Entregar piloto integrado", "Deliver an integrated pilot"),
    pilotAction: bi("implementar um caso de uso limitado, conectado aos sistemas necessários e medido por adoção, qualidade e impacto operacional", "implement a limited use case, connected to the necessary systems and measured by adoption, quality, and operational impact"),
    pilotOutcome: bi("prova de valor observável, com menos dependência de processos manuais", "an observable proof of value, with less dependence on manual processes"),
    scaleTitle: bi("Padronizar operação de IA", "Standardize AI operations"),
    scaleAction: bi("definir práticas de monitoramento, atualização, reutilização, documentação e suporte para soluções em produção", "define monitoring, update, reuse, documentation, and support practices for solutions in production"),
    scaleOutcome: bi("um caminho mais previsível para escalar modelos, automações e integrações", "a more predictable path for scaling models, automations, and integrations"),
  },
};

type QuarterlyTier = "stabilize" | "pilot" | "scale";

// Picks how far along a pillar already is so Q2/Q3 read as the next step for
// that maturity, instead of always describing a first pilot or a first scale-up.
function quarterlyTier(score: number): QuarterlyTier {
  if (score < 40) return "stabilize";
  if (score < 75) return "pilot";
  return "scale";
}

function quarterlyTierCopy(entry: QuarterlyPillarAction, tier: QuarterlyTier) {
  return {
    title: entry[`${tier}Title`],
    action: entry[`${tier}Action`],
    outcome: entry[`${tier}Outcome`],
  };
}

// Q1 is framed as either building the data foundation from zero or extending
// one that already exists — an org that already has a lake/warehouse or data
// marts shouldn't be told to "start now" as if beginning its AI journey.
const DATA_FOUNDATION_Q1 = {
  start: {
    focus: bi("Iniciar Data Foundation", "Start Data Foundation"),
    title: bi("Construir a base de dados para IA", "Build the data foundation for AI"),
    action: bi(
      "Começar agora por um domínio de negócio e estruturar lake ou warehouse, qualidade, catálogo, acesso e governança como uma base reutilizável.",
      "Start now with one business domain and structure a lake or warehouse, quality, catalog, access, and governance as a reusable foundation."
    ),
    outcome: bi(
      "dados confiáveis e acessíveis para decisões, automações e modelos futuros",
      "reliable, accessible data for future decisions, automations, and models"
    ),
    dependency: bi("Nenhuma pré-condição de maturidade", "No maturity precondition"),
  },
  extend: {
    focus: bi("Consolidar Data Foundation", "Consolidate Data Foundation"),
    title: bi("Ampliar a base de dados para novos domínios", "Extend the data foundation to new domains"),
    action: bi(
      "Mapear lacunas de cobertura, qualidade e governança na base atual e priorizar a expansão para o próximo domínio de negócio.",
      "Map coverage, quality, and governance gaps in the current foundation and prioritize extending it to the next business domain."
    ),
    outcome: bi(
      "cobertura mais ampla de dados confiáveis, prontos para sustentar novas decisões, automações e modelos",
      "broader coverage of reliable data, ready to support new decisions, automations, and models"
    ),
    dependency: bi("Lacunas de cobertura da base atual mapeadas", "Coverage gaps in the current foundation mapped"),
  },
};

interface ActionMetaEntry {
  ownerRole: Bilingual;
  dependency: Bilingual;
  successMetric: Bilingual;
}

const ACTION_META: Record<InsightPillarId, ActionMetaEntry> = {
  dados: {
    ownerRole: bi("Liderança de Dados e Analytics", "Data and Analytics leadership"),
    dependency: bi("Fontes críticas e responsáveis identificados", "Critical sources and owners identified"),
    successMetric: bi("Dados prioritários com dono, critério de qualidade e acesso medido", "Priority data with an owner, a quality criterion, and measured access"),
  },
  estrategia: {
    ownerRole: bi("Patrocinador executivo de IA", "AI executive sponsor"),
    dependency: bi("Problema de negócio e tese de valor acordados", "Business problem and value thesis agreed on"),
    successMetric: bi("Casos priorizados com responsável, benefício esperado e critério de decisão", "Prioritized cases with an owner, expected benefit, and decision criteria"),
  },
  pessoas: {
    ownerRole: bi("Pessoas, Change e liderança da área piloto", "People, Change, and pilot-area leadership"),
    dependency: bi("Usuários-chave e fluxo de trabalho selecionados", "Key users and workflow selected"),
    successMetric: bi("Adoção ativa, barreiras registradas e capacitação concluída", "Active adoption, barriers logged, and training completed"),
  },
  governanca: {
    ownerRole: bi("Risco, Jurídico, Segurança e Tecnologia", "Risk, Legal, Security, and Technology"),
    dependency: bi("Responsáveis e apetite de risco definidos", "Owners and risk appetite defined"),
    successMetric: bi("Controles mínimos aplicados e decisões críticas com revisão humana", "Minimum controls applied and critical decisions with human review"),
  },
  tecnologia: {
    ownerRole: bi("CTO, Engenharia ou Plataforma", "CTO, Engineering, or Platform"),
    dependency: bi("Caso de uso, sistemas e caminho de produção definidos", "Use case, systems, and path to production defined"),
    successMetric: bi("Piloto integrado, monitorado e utilizado em um fluxo real", "Integrated pilot, monitored and used in a real workflow"),
  },
};

const EFFORT_LABEL = {
  medium: bi("Médio", "Medium"),
  high: bi("Alto", "High"),
};

function toPillarId(id: string): InsightPillarId {
  return PILLAR_ORDER.includes(id as InsightPillarId) ? id as InsightPillarId : "dados";
}

// A pillar already at "Forte"/"Avançado" tier shouldn't be called out as a
// risk or gap even if some individual answer matched a risco-critico insight —
// the aggregate score says it isn't actually weak.
export function isWeakPillarScore(score: number): boolean {
  const tier = getPillarTier(score).key;
  return tier !== "high" && tier !== "advanced";
}

export interface ExecutiveSummary {
  strengths: string;
  opportunities: string;
}

const EXEC_PILLAR_LABEL: Record<InsightPillarId, Bilingual> = {
  dados: bi("Dados", "Data"),
  estrategia: bi("Estratégia", "Strategy"),
  pessoas: bi("Pessoas e Cultura", "People and Culture"),
  governanca: bi("Processos e responsabilidades", "Processes and accountability"),
  tecnologia: bi("Tecnologia", "Technology"),
};

const EXEC_READINESS_STANCE: Record<string, Bilingual> = {
  "Prontidão Baixa": bi(
    "A empresa ainda tem uma base frágil para usar dados e IA em decisões relevantes.",
    "The company still has a fragile foundation for using data and AI in meaningful decisions."
  ),
  "Prontidão Emergente": bi(
    "A empresa já iniciou sua jornada, mas a base ainda é inconsistente para sustentar IA em escala.",
    "The company has already started its journey, but the foundation is still inconsistent for sustaining AI at scale."
  ),
  "Prontidão Moderada": bi(
    "A empresa tem uma base intermediária: consegue avançar em iniciativas selecionadas, mas ainda depende de pontos frágeis.",
    "The company has an intermediate foundation: it can move forward on selected initiatives, but still depends on fragile points."
  ),
  "Prontidão Alta": bi(
    "A empresa está bem posicionada para ampliar o uso de dados e IA, com pontos específicos que merecem atenção para sustentar esse ritmo.",
    "The company is well positioned to expand its use of data and AI, with specific points that deserve attention to sustain that pace."
  ),
  "Prontidão Avançada": bi(
    "A empresa apresenta maturidade alta para usar dados e IA de forma mais ampla.",
    "The company shows high maturity for using data and AI more broadly."
  ),
};

// When the overall score already reads strong (>= 75), the executive summary's
// FIRST paragraph should stay entirely positive — no caveats or points of
// attention (those belong in paragraph 2). Only "Prontidão Alta" carries a
// caution clause in its default stance; this drops it for the strong case.
const EXEC_READINESS_STANCE_POSITIVE: Record<string, Bilingual> = {
  "Prontidão Alta": bi(
    "A empresa está bem posicionada para ampliar o uso de dados e IA.",
    "The company is well positioned to expand its use of data and AI."
  ),
};

const EXEC_RISK_TEXT: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "decisões podem continuar sendo tomadas com informações incompletas, lentas ou contraditórias",
    "decisions may keep being made with incomplete, slow, or contradictory information"
  ),
  estrategia: bi(
    "investimentos em IA podem virar testes isolados, sem prioridade executiva ou retorno claro",
    "AI investments may turn into isolated tests, with no executive priority or clear return"
  ),
  pessoas: bi(
    "as equipes podem não adotar as soluções, mesmo quando a tecnologia funcionar",
    "teams may not adopt the solutions, even when the technology works"
  ),
  governanca: bi(
    "a empresa pode ampliar IA sem regras claras de responsabilidade, aumentando exposição e retrabalho",
    "the company may expand AI without clear accountability rules, increasing exposure and rework"
  ),
  tecnologia: bi(
    "projetos podem ficar presos em pilotos, sem chegar à operação do dia a dia",
    "projects may stay stuck in pilots, never reaching day-to-day operation"
  ),
};

// Why the strongest pillar being strong actually matters — paired with the
// strongest pillar's name in the "strengths" paragraph of the executive summary.
const EXEC_STRENGTH_TEXT: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "Isso é uma vantagem real: dados confiáveis reduzem retrabalho e dão à liderança confiança para decidir com base em evidência, não em intuição.",
    "That's a real advantage: reliable data reduces rework and gives leadership the confidence to decide based on evidence, not intuition."
  ),
  estrategia: bi(
    "Isso é uma vantagem real: ter direção clara evita que investimento em IA vire uma coleção de experimentos desconectados, e concentra energia onde o retorno é maior.",
    "That's a real advantage: having clear direction keeps AI investment from turning into a collection of disconnected experiments, and focuses energy where the return is highest."
  ),
  pessoas: bi(
    "Isso é uma vantagem real: equipes dispostas a adotar novas ferramentas são o que transforma tecnologia disponível em mudança de trabalho de fato.",
    "That's a real advantage: teams willing to adopt new tools are what turns available technology into an actual change in how work gets done."
  ),
  governanca: bi(
    "Isso é uma vantagem real: regras claras de responsabilidade permitem escalar iniciativas de IA sem acumular risco desnecessário para clientes e liderança.",
    "That's a real advantage: clear accountability rules make it possible to scale AI initiatives without piling up unnecessary risk for customers and leadership."
  ),
  tecnologia: bi(
    "Isso é uma vantagem real: uma base técnica sólida é o que permite que pilotos promissores cheguem à operação do dia a dia, em vez de ficarem presos em testes.",
    "That's a real advantage: a solid technical foundation is what lets promising pilots reach day-to-day operation, instead of staying stuck in testing."
  ),
};

const EXEC_OPPORTUNITY_TEXT: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "A empresa já trata dados como insumo relevante para suas decisões. Na visão da Snowfox, falta dar mais consistência a esse acesso, para reduzir o tempo perdido reconciliando informações antes de agir.",
    "The company already treats data as a relevant input for its decisions. In Snowfox's view, what's missing is making that access more consistent, to reduce time lost reconciling information before acting."
  ),
  estrategia: bi(
    "A liderança já demonstra compromisso real com IA como prioridade de negócio. Na visão da Snowfox, falta concentrar esse investimento nos casos de uso com maior retorno, em vez de dispersar energia em iniciativas isoladas.",
    "Leadership already shows real commitment to AI as a business priority. In Snowfox's view, what's missing is focusing that investment on the highest-return use cases, instead of spreading energy across isolated initiatives."
  ),
  pessoas: bi(
    "As equipes já demonstram abertura para adotar IA no dia a dia. Na visão da Snowfox, falta transformar essa abertura em mudança real de trabalho, não apenas em ferramenta disponível para poucos usuários.",
    "Teams already show openness to adopting AI day to day. In Snowfox's view, what's missing is turning that openness into a real change in how work gets done, not just a tool available to a few users."
  ),
  governanca: bi(
    "A empresa já opera com um nível saudável de controle sobre suas iniciativas de IA. Na visão da Snowfox, falta consolidar essas regras para avançar sem criar riscos desnecessários para clientes, equipes e liderança.",
    "The company already operates with a healthy level of control over its AI initiatives. In Snowfox's view, what's missing is consolidating those rules to move forward without creating unnecessary risk for customers, teams, and leadership."
  ),
  tecnologia: bi(
    "A base tecnológica atual já sustenta iniciativas de IA com solidez. Na visão da Snowfox, falta garantir que os pilotos sejam desenhados desde o início para virar solução usada na rotina da empresa.",
    "The current technology foundation already solidly supports AI initiatives. In Snowfox's view, what's missing is making sure pilots are designed from the start to become a solution used in the company's day-to-day routine."
  ),
};

// For a pillar already at "Avançado" (90%+), telling the company it's missing
// something reads as false — there's no real gap left to close. The copy here
// shifts from "close a gap" to "sustain and scale", per Alessandro's feedback
// that top scorers need forward-looking guidance, not a fabricated weakness.
const EXEC_OPPORTUNITY_ADVANCED_TEXT: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "Dados já opera como um ativo maduro para decisões. O ganho a partir daqui vem de continuar dando atenção a essa base, escalar as soluções que já existem e acompanhar de perto as novas capacidades de IA para encontrar casos de uso ainda mais poderosos.",
    "Data already operates as a mature asset for decisions. From here, the gain comes from continuing to invest in this foundation, scaling the solutions that already exist, and closely tracking new AI capabilities to find even more powerful use cases."
  ),
  estrategia: bi(
    "A liderança já trata IA como prioridade estratégica clara. O ganho a partir daqui vem de sustentar esse patrocínio, escalar os casos de uso que já provaram retorno e revisar o portfólio com regularidade para não perder o timing de novas oportunidades.",
    "Leadership already treats AI as a clear strategic priority. From here, the gain comes from sustaining that sponsorship, scaling the use cases that have already proven return, and reviewing the portfolio regularly to not miss the timing on new opportunities."
  ),
  pessoas: bi(
    "As equipes já adotam IA como parte natural do trabalho. O ganho a partir daqui vem de levar essa cultura para novas áreas, formalizar quem lidera a evolução contínua e manter o time atualizado sobre as capacidades de IA mais recentes.",
    "Teams already adopt AI as a natural part of their work. From here, the gain comes from taking that culture to new areas, formalizing who leads continuous evolution, and keeping the team up to date on the latest AI capabilities."
  ),
  governanca: bi(
    "A empresa já opera com regras de responsabilidade e controle consolidadas. O ganho a partir daqui vem de usar essa base de confiança para escalar iniciativas com mais velocidade, sem reabrir discussões básicas de governança a cada novo projeto.",
    "The company already operates with consolidated accountability and control rules. From here, the gain comes from using that foundation of trust to scale initiatives faster, without reopening basic governance discussions with every new project."
  ),
  tecnologia: bi(
    "A base tecnológica já sustenta IA em produção com solidez. O ganho a partir daqui vem de escalar o que já funciona para mais times e casos de uso, mantendo a arquitetura pronta para incorporar novas capacidades assim que surgirem.",
    "The technology foundation already solidly supports AI in production. From here, the gain comes from scaling what already works to more teams and use cases, keeping the architecture ready to incorporate new capabilities as they emerge."
  ),
};

// Mirror of the "advanced" tier at the opposite extreme: below 20%, the
// company isn't missing consistency — it's missing the basics. The copy
// names the starting point instead of a mid-journey gap.
const EXEC_OPPORTUNITY_CRITICAL_TEXT: Record<InsightPillarId, Bilingual> = {
  dados: bi(
    "A empresa ainda não tem uma base mínima de dados confiável para sustentar decisões ou iniciativas de IA. Este é o ponto de partida: estruturar acesso, qualidade e governança básica sobre os dados mais críticos do negócio antes de qualquer piloto de IA.",
    "The company doesn't yet have a minimum reliable data foundation to support decisions or AI initiatives. This is the starting point: structuring access, quality, and basic governance over the business's most critical data before any AI pilot."
  ),
  estrategia: bi(
    "IA ainda não tem prioridade real na liderança nem investimento definido. Este é o ponto de partida: eleger um único caso de uso de alto impacto e garantir patrocínio executivo explícito, em vez de dispersar esforço em múltiplas frentes.",
    "AI still doesn't have real priority with leadership or defined investment. This is the starting point: choosing a single high-impact use case and securing explicit executive sponsorship, instead of spreading effort across multiple fronts."
  ),
  pessoas: bi(
    "As equipes ainda não têm preparo nem abertura para adotar IA no dia a dia. Este é o ponto de partida: capacitar um grupo piloto e mostrar valor concreto e rápido antes de tentar uma adoção mais ampla.",
    "Teams still aren't prepared or open to adopting AI day to day. This is the starting point: training a pilot group and showing concrete, fast value before attempting broader adoption."
  ),
  governanca: bi(
    "A empresa ainda não tem regras mínimas de responsabilidade sobre o uso de IA. Este é o ponto de partida: definir papéis, aprovações e limites básicos antes de ampliar qualquer iniciativa, para não acumular risco desde o início.",
    "The company still doesn't have minimum accountability rules for AI use. This is the starting point: defining roles, approvals, and basic limits before expanding any initiative, to avoid accumulating risk from the start."
  ),
  tecnologia: bi(
    "A base tecnológica ainda não sustenta nem os pilotos mais simples de IA. Este é o ponto de partida: garantir infraestrutura básica de dados e sistemas antes de investir em soluções mais sofisticadas.",
    "The technology foundation doesn't yet support even the simplest AI pilots. This is the starting point: securing basic data and systems infrastructure before investing in more sophisticated solutions."
  ),
};

export function buildExecutiveSummary({
  answers,
  pillarScores,
  result,
  strongest,
  weakest,
  lang = DEFAULT_LANG,
}: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  result: AssessmentResult;
  strongest: PillarScore;
  weakest: PillarScore;
  lang?: Lang;
}): ExecutiveSummary {
  const insights = selectResultInsights(answers, pillarScores, { min: 3, max: 5 }, lang);
  const scoreByPillar = Object.fromEntries(pillarScores.map(p => [p.id, p.score])) as Record<InsightPillarId, number>;
  const isWeakPillar = (pillar: InsightPillarId) => isWeakPillarScore(scoreByPillar[pillar] ?? 0);
  // Only trust a matched risk/gap insight to pick the "opportunity" pillar
  // when that pillar's own aggregate score still agrees it's weak — otherwise
  // fall back to the pillar that is genuinely the lowest scoring one.
  const attention =
    insights.find(i => i.type === "risco-critico" && isWeakPillar(i.pillar)) ??
    insights.find(i => i.priority <= 2 && isWeakPillar(i.pillar)) ??
    insights.find(i => i.pillar === weakest.id);
  const weakestPillar = toPillarId(weakest.id);
  const strongestPillar = toPillarId(strongest.id);
  const opportunityPillar = attention?.pillar ?? weakestPillar;
  const opportunityScore = scoreByPillar[opportunityPillar] ?? weakest.score;
  // Every pillar clearing the "Forte" bar means there's nothing genuinely
  // weak to flag — paragraph 2 should stay positive, not manufacture a gap.
  const allPillarsStrong = !isWeakPillar(weakestPillar);
  // The overall score reading strong (same bar) is a softer signal than every
  // single pillar clearing it: there's still a real gap here, but a company
  // already scoring well shouldn't get the same alarm-toned consequence
  // clause as one that's still building its foundation.
  const overallIsStrong = result.score >= 75;
  // When every pillar ties (most commonly all at 100), strongest and weakest
  // resolve to the same pillar — naming it as both the highlight and the gap
  // in the same sentence reads as self-contradictory, so this needs its own copy.
  const noDifferentiation = strongest.score === weakest.score;
  // Score >= 75 (overallIsStrong): open paragraph 1 with a positive-only stance
  // so nothing negative appears in the executive summary's first paragraph.
  const stanceSource = (overallIsStrong && EXEC_READINESS_STANCE_POSITIVE[result.level]) || EXEC_READINESS_STANCE[result.level];
  const stance = stanceSource ? pick(stanceSource, lang) : "";

  let strengths: string;
  if (!isWeakPillar(strongestPillar)) {
    strengths = noDifferentiation
      ? lang === "en"
        ? `${stance} All five capabilities are at the same level, all at a strong or advanced tier, a balanced foundation for expanding AI use.`
        : `${stance} As cinco capacidades estão no mesmo nível, todas em patamar forte ou avançado, uma base equilibrada para ampliar o uso de IA.`
      : `${stance} ${pick(EXEC_PILLAR_LABEL[strongestPillar], lang)}${lang === "en" ? " stands out as the most mature pillar" : " se destaca como o pilar mais maduro"} (${strongest.score}%). ${pick(EXEC_STRENGTH_TEXT[strongestPillar], lang)}`;
  } else {
    // Not even the strongest pillar clears the bar — nothing genuine to
    // celebrate yet, so don't fabricate a highlight.
    strengths = strongest.score < 20
      ? lang === "en"
        ? `${stance} No pillar goes beyond a minimal foundation; the priority is structuring the basics of data, processes, and accountability before any AI initiative.`
        : `${stance} Nenhum pilar ultrapassa uma base mínima; a prioridade é estruturar fundamentos de dados, processos e responsabilidades antes de qualquer iniciativa de IA.`
      : lang === "en"
        ? `${stance} No pillar has reached a consistent level yet; the priority is strengthening the basic capabilities before accelerating AI initiatives.`
        : `${stance} Nenhum pilar atingiu um nível consistente até aqui; a prioridade é fortalecer as capacidades básicas antes de acelerar iniciativas de IA.`;
  }

  let opportunities: string;
  if (allPillarsStrong) {
    opportunities = noDifferentiation
      ? (lang === "en"
        ? "All capabilities are at the same high level, with no single point of attention. The focus should be maintaining consistency and capturing the value already available, rather than fixing weaknesses."
        : "Todas as capacidades estão no mesmo nível elevado, sem um ponto de atenção isolado. O foco deve ser manter a consistência e capturar o retorno já disponível, em vez de corrigir fragilidades.")
      : lang === "en"
        ? `${pick(EXEC_PILLAR_LABEL[opportunityPillar], lang)} is the pillar with the most room to grow (${opportunityScore}%), even though it's already at a healthy level. ${pick(EXEC_OPPORTUNITY_ADVANCED_TEXT[opportunityPillar], lang)}`
        : `${pick(EXEC_PILLAR_LABEL[opportunityPillar], lang)} é o pilar com mais espaço para evoluir (${opportunityScore}%), ainda que já em um nível saudável. ${pick(EXEC_OPPORTUNITY_ADVANCED_TEXT[opportunityPillar], lang)}`;
  } else {
    const isCritical = opportunityScore < 20;
    const leadIn = lang === "en"
      ? isCritical
        ? `The most urgent point is ${pick(EXEC_PILLAR_LABEL[opportunityPillar], lang)} (${opportunityScore}%).`
        : `The biggest opportunity is in ${pick(EXEC_PILLAR_LABEL[opportunityPillar], lang)} (${opportunityScore}%).`
      : isCritical
        ? `O ponto mais urgente é ${pick(EXEC_PILLAR_LABEL[opportunityPillar], lang)} (${opportunityScore}%).`
        : `A maior oportunidade está em ${pick(EXEC_PILLAR_LABEL[opportunityPillar], lang)} (${opportunityScore}%).`;
    const gapText = pick(isCritical ? EXEC_OPPORTUNITY_CRITICAL_TEXT[opportunityPillar] : EXEC_OPPORTUNITY_TEXT[opportunityPillar], lang);
    // Subtle criticism when the overall score already reads strong: name the
    // gap and why it matters, but skip the alarm-toned consequence clause.
    const consequence = overallIsStrong ? "" : lang === "en"
      ? ` Without progress here, ${pick(EXEC_RISK_TEXT[opportunityPillar], lang)}.`
      : ` Sem avançar aqui, ${pick(EXEC_RISK_TEXT[opportunityPillar], lang)}.`;
    opportunities = `${leadIn} ${gapText}${consequence}`;
  }

  return {
    strengths: safeClientText(strengths, lang),
    opportunities: safeClientText(opportunities, lang),
  };
}

export function buildQuarterlyRecommendations({
  answers,
  pillarScores,
  result,
  strongest,
  weakest,
  lang = DEFAULT_LANG,
}: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  result: AssessmentResult;
  strongest: PillarScore;
  weakest: PillarScore;
  lang?: Lang;
}): QuarterlyRecommendation[] {
  const insights = selectResultInsights(answers, pillarScores, { min: 3, max: 6 }, lang);
  const attention =
    insights.find(i => i.type === "risco-critico") ??
    insights.find(i => i.priority <= 2) ??
    insights.find(i => i.pillar === weakest.id);
  const opportunity = insights.find(i =>
    i.id !== attention?.id &&
    (i.type === "oportunidade" || i.type === "proximo-passo")
  );
  const strength = insights.find(i => i.priority === 3);

  const weakestPillar = toPillarId(weakest.id);
  const strongestPillar = toPillarId(strongest.id);
  const secondPillar = opportunity?.pillar ?? weakestPillar;
  const thirdPillar = strength?.pillar ?? strongestPillar;
  const secondCopy = QUARTERLY_PILLAR_ACTIONS[secondPillar];
  const thirdCopy = QUARTERLY_PILLAR_ACTIONS[thirdPillar];

  // Each quarter's copy tier (stabilize/pilot/scale) follows that specific
  // pillar's own score, so a company that's already mature there gets asked
  // to scale, not to run a first pilot as if starting from zero.
  const scoreByPillar = Object.fromEntries(pillarScores.map(p => [p.id, p.score])) as Record<InsightPillarId, number>;
  const secondTierCopy = quarterlyTierCopy(secondCopy, quarterlyTier(scoreByPillar[secondPillar] ?? weakest.score));
  const thirdTierCopy = quarterlyTierCopy(thirdCopy, quarterlyTier(scoreByPillar[thirdPillar] ?? strongest.score));

  // Q1 talks about building the data foundation from zero or extending one
  // that's already there, depending on what the company actually reported.
  const q1Copy = hasDataFoundation(answers) ? DATA_FOUNDATION_Q1.extend : DATA_FOUNDATION_Q1.start;

  if (lang === "en") {
    return [
      {
        id: "q1",
        period: "Next quarter",
        focus: pick(q1Copy.focus, lang),
        title: pick(q1Copy.title, lang),
        action: pick(q1Copy.action, lang),
        outcome: pick(q1Copy.outcome, lang),
        ownerRole: pick(ACTION_META.dados.ownerRole, lang),
        dependency: pick(q1Copy.dependency, lang),
        effort: pick(EFFORT_LABEL.medium, lang),
        successMetric: pick(ACTION_META.dados.successMetric, lang),
      },
      {
        id: "q2",
        period: "Following quarter",
        focus: safeClientText(`Execute ${pick(EXEC_PILLAR_LABEL[secondPillar], lang)}`, lang),
        title: safeClientText(opportunity?.title ?? pick(secondTierCopy.title, lang), lang),
        action: safeClientText(`Turn last quarter's learning into execution: ${pick(secondTierCopy.action, lang)}.`, lang),
        outcome: safeClientText(pick(secondTierCopy.outcome, lang), lang),
        ownerRole: pick(ACTION_META[secondPillar].ownerRole, lang),
        dependency: `Completion of the first quarter; ${pick(ACTION_META[secondPillar].dependency, lang).toLowerCase()}`,
        effort: pick(EFFORT_LABEL.medium, lang),
        successMetric: pick(ACTION_META[secondPillar].successMetric, lang),
      },
      {
        id: "q3",
        period: "Third quarter",
        focus: safeClientText(`Scale ${pick(EXEC_PILLAR_LABEL[thirdPillar], lang)}`, lang),
        title: safeClientText(strength ? `Scale from ${strength.title}` : pick(thirdTierCopy.title, lang), lang),
        action: safeClientText(`Use this foundation to expand maturity: ${pick(thirdTierCopy.action, lang)}.`, lang),
        outcome: safeClientText(pick(thirdTierCopy.outcome, lang), lang),
        ownerRole: pick(ACTION_META[thirdPillar].ownerRole, lang),
        dependency: `Previous quarter's work documented; ${pick(ACTION_META[thirdPillar].dependency, lang).toLowerCase()}`,
        effort: pick(EFFORT_LABEL.high, lang),
        successMetric: pick(ACTION_META[thirdPillar].successMetric, lang),
      },
    ];
  }

  return [
    {
      id: "q1",
      period: "Próximo trimestre",
      focus: pick(q1Copy.focus, lang),
      title: pick(q1Copy.title, lang),
      action: pick(q1Copy.action, lang),
      outcome: pick(q1Copy.outcome, lang),
      ownerRole: pick(ACTION_META.dados.ownerRole, lang),
      dependency: pick(q1Copy.dependency, lang),
      effort: pick(EFFORT_LABEL.medium, lang),
      successMetric: pick(ACTION_META.dados.successMetric, lang),
    },
    {
      id: "q2",
      period: "Trimestre seguinte",
      focus: safeClientText(`Executar ${pick(EXEC_PILLAR_LABEL[secondPillar], lang)}`, lang),
      title: safeClientText(opportunity?.title ?? pick(secondTierCopy.title, lang), lang),
      action: safeClientText(`Converter o aprendizado do trimestre anterior em execução: ${pick(secondTierCopy.action, lang)}.`, lang),
      outcome: safeClientText(pick(secondTierCopy.outcome, lang), lang),
      ownerRole: pick(ACTION_META[secondPillar].ownerRole, lang),
      dependency: `Conclusão do primeiro trimestre; ${pick(ACTION_META[secondPillar].dependency, lang).toLocaleLowerCase("pt-BR")}`,
      effort: pick(EFFORT_LABEL.medium, lang),
      successMetric: pick(ACTION_META[secondPillar].successMetric, lang),
    },
    {
      id: "q3",
      period: "Terceiro trimestre",
      focus: safeClientText(`Escalar ${pick(EXEC_PILLAR_LABEL[thirdPillar], lang)}`, lang),
      title: safeClientText(strength ? `Escalar a partir de ${strength.title}` : pick(thirdTierCopy.title, lang), lang),
      action: safeClientText(`Usar essa base para ampliar a maturidade: ${pick(thirdTierCopy.action, lang)}.`, lang),
      outcome: safeClientText(pick(thirdTierCopy.outcome, lang), lang),
      ownerRole: pick(ACTION_META[thirdPillar].ownerRole, lang),
      dependency: `Trabalho do trimestre anterior documentado; ${pick(ACTION_META[thirdPillar].dependency, lang).toLocaleLowerCase("pt-BR")}`,
      effort: pick(EFFORT_LABEL.high, lang),
      successMetric: pick(ACTION_META[thirdPillar].successMetric, lang),
    },
  ];
}
