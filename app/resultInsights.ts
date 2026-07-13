// Personalized "Principais insights" content for the results page.
//
// Each ResultInsight is anchored to one or more real question IDs / option
// values from SECTIONS in `app/data.ts`. An insight only "fires" when the
// user's actual answers satisfy every condition in `answerMatch`. This file
// does not change scoring, questions, or answer options — it only reads the
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

import { AnswerRecord, AssessmentResult, PillarScore, PILLAR_CONFIG, RECOMMENDATIONS, getPillarTier } from "@/app/data";

export type InsightPillarId = "dados" | "estrategia" | "pessoas" | "governanca" | "tecnologia";

export type InsightBadge = "risco-critico" | "oportunidade" | "proximo-passo" | "forca-existente";

export const INSIGHT_BADGE_LABEL: Record<InsightBadge, string> = {
  "risco-critico": "Risco prioritário",
  "oportunidade": "Oportunidade",
  "proximo-passo": "Próximo passo",
  "forca-existente": "Força existente",
};

// Groups the badge-level types into the three result-sheet sections requested
// by the business: critical risks read as gaps; both "opportunity" and
// "next step" badges are forward-looking actions to take; existing strengths
// stand on their own.
export type InsightCategory = "lacunas" | "oportunidades" | "forcas";

export const CATEGORY_LABEL: Record<InsightCategory, string> = {
  lacunas: "Lacunas",
  oportunidades: "Oportunidades",
  forcas: "Pontos Fortes",
};

const TYPE_TO_CATEGORY: Record<InsightBadge, InsightCategory> = {
  "risco-critico": "lacunas",
  "oportunidade": "oportunidades",
  "proximo-passo": "oportunidades",
  "forca-existente": "forcas",
};

export function categoryOf(insight: ResultInsight): InsightCategory {
  return TYPE_TO_CATEGORY[insight.type];
}

export const PILLAR_LABEL = Object.fromEntries(
  PILLAR_CONFIG.map(p => [p.id, p.title])
) as Record<InsightPillarId, string>;

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

export interface ResultInsight {
  id: string;
  pillar: InsightPillarId;
  questionId: string;
  /** Human-readable description of the branch this insight covers (maintainer-facing). */
  trigger: string;
  /** Original score annotation from the source insight doc, kept for traceability. */
  scoreCondition: string;
  answerMatch: AnswerCondition[];
  priority: 1 | 2 | 3 | 4;
  type: InsightBadge;
  theme: string;
  title: string;
  insight: string;
}

export const RESULT_INSIGHTS: ResultInsight[] = [
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
    title: "Base de dados ainda não validada",
    insight: "Sua empresa ainda não consegue saber com clareza se está coletando os dados certos. Isso significa que qualquer iniciativa de IA partiria de uma base pouco validada ou teria que construir essa base de forma ad hoc. Antes de avançar para modelos ou automações mais complexas, faria sentido mapear os dados existentes em relação às decisões que o negócio realmente precisa tomar.",
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
    title: "Dados prontos para aplicar casos de uso",
    insight: "Uma base de dados relevante e suficiente reduz uma das principais incertezas antes de avançar com IA. Sua organização já superou a etapa de coleta e está, sob a ótica de dados, mais preparada para avaliar casos de uso com potencial real de aplicação.",
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
    title: "Dados isolados travam produção",
    insight: "Dados isolados e de difícil acesso costumam dificultar a passagem de iniciativas de IA da prova de conceito para a operação. O desafio aqui não parece estar apenas na modelagem, mas na forma como os dados estão organizados, acessados e disponibilizados. Esse é um ponto típico de Engenharia de Dados ou de Estratégia de Dados. A recomendação é tratar essa base primeiro, antes de avançar para modelos mais sofisticados.",
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
    title: "Acesso a dados pronto para MLOps",
    insight: "Quando os dados estão facilmente disponíveis para equipes e sistemas autorizados, a empresa reduz o atrito entre análise, decisão e execução. Essa disponibilidade cria uma base mais favorável para iniciativas de IA, porque os casos de uso podem partir de informações acessíveis e governadas, em vez de depender de coletas manuais ou integrações improvisadas.",
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
    title: "Crescimento ainda depende de mais pessoas",
    insight: "O crescimento ainda escala de forma linear com o número de pessoas, sinal de que parte da operação poderia estar mais automatizada. Essa é uma abertura para o uso de IA em geral, seja por meio de automação de processos, modelos preditivos, analytics avançado, agentes inteligentes ou IA generativa, dependendo do tipo de tarefa, dos dados disponíveis e do impacto esperado.",
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
    title: "Sem histórico, sem previsão confiável",
    insight: "Sem histórico de dados confiável, casos de uso preditivos como previsão de demanda, churn ou precificação dinâmica ficam limitados, porque há pouco padrão confiável para ser aprendido. O ponto de partida aqui é fortalecer a captura, o armazenamento e a confiabilidade do histórico antes de avançar para soluções mais sofisticadas de IA.",
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
    title: "Histórico de dados como ativo diferenciado",
    insight: "Anos de dados históricos confiáveis são um ativo importante para casos de uso baseados em padrões, como precificação, segmentação, previsão de demanda ou análise comportamental. Essa maturidade cria boas condições para explorar aplicações de IA com maior profundidade e menor incerteza inicial.",
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
    title: "Decisões mais rápidas que os dados",
    insight: "Quando os dados demoram para chegar, as decisões tendem a continuar dependendo de intuição, mesmo quando a empresa já possui informações relevantes armazenadas. Isso indica uma oportunidade de melhorar a camada de acesso, arquitetura e disponibilidade dos dados, para que a informação acompanhe melhor o ritmo da decisão.",
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
    title: "Baixa confiança trava a adoção de IA",
    insight: "Baixa confiança nos dados pode limitar a adoção de IA mesmo quando a tecnologia funciona bem. Se a liderança não confia nos números por trás das recomendações, a tendência é que modelos e dashboards sejam pouco utilizados. O próximo passo seria aumentar a transparência, qualidade e rastreabilidade dos dados antes de introduzir recomendações orientadas por IA.",
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
    title: "Sem visão nem patrocínio para IA",
    insight: "Essa combinação indica um risco estratégico relevante: a empresa ainda não definiu uma visão clara para IA e a liderança não tem clareza sobre o valor econômico possível. Nessa situação, um piloto técnico pode ter dificuldade de ganhar tração. O primeiro passo mais adequado seria alinhar a liderança em torno de casos de negócio, prioridades e critérios de retorno.",
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
    title: "Governança de IA em nível de conselho",
    insight: "Visão clara, casos de uso priorizados, roadmap documentado e revisão frequente indicam uma maturidade estratégica acima da média. Essa organização parece preparada para tratar IA como um portfólio de iniciativas, com governança, priorização e acompanhamento contínuo, em vez de depender apenas de pilotos isolados.",
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
    title: "Falta transformar análise em roadmap",
    insight: "A liderança já entende onde a IA pode gerar valor, mas esse entendimento ainda não foi traduzido em um plano com prazos, responsáveis e prioridades. Esse é um gap comum entre intenção estratégica e execução. O próximo passo seria estruturar um roadmap de 12 a 24 meses para transformar as oportunidades mapeadas em iniciativas executáveis.",
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
    title: "Experimentação pontual, sem estratégia",
    insight: "Testes pontuais são um estágio inicial comum e podem gerar aprendizados importantes. O cuidado é evitar que a experimentação fique desconectada de métricas de sucesso e prioridades de negócio. O próximo passo seria escolher um caso de uso bem delimitado, com objetivo claro, escopo controlado e critérios objetivos para decidir se ele deve avançar.",
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
    title: "IA como vantagem competitiva estrutural",
    insight: "Quando a IA já faz parte da proposta de valor da empresa, a prioridade deixa de ser apenas adoção e passa a ser sustentação da vantagem competitiva. Isso envolve proteger ativos de dados, fortalecer capacidades internas, melhorar governança e manter uma cadência consistente de evolução dos modelos e produtos.",
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
    title: "Sem patrocínio executivo",
    insight: "A falta de patrocínio executivo reduz bastante a chance de iniciativas de IA avançarem além de testes isolados. Mesmo com boa tecnologia, projetos podem perder prioridade se não houver dono, orçamento e apoio visível da liderança. O próximo passo seria construir um caso de negócio claro o suficiente para mobilizar um patrocinador executivo.",
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
    title: "Patrocínio executivo forte e visível",
    insight: "Patrocínio executivo forte e contínuo reduz um dos principais riscos organizacionais de escalar IA. Com liderança engajada, a empresa tem melhores condições de priorizar iniciativas, remover bloqueios e sustentar investimentos ao longo do tempo. Isso permite considerar projetos mais estruturados e de maior impacto.",
  },
  {
    id: "estrategia-08",
    pillar: "estrategia",
    questionId: "est_q3a",
    // NOTE: est_q3a is scored under the "governanca" pillar in calculatePillarScores
    // (see scorePillar override in app/data.ts), even though the question itself
    // lives inside the Estratégia section. Kept as pillar "estrategia" here to
    // match the source insight doc's own grouping (2.3 sub-branch) — see the
    // integration summary for this discrepancy.
    trigger: "est_q3 answered AND est_q3a = 1 (\"Quase sempre\" há atrasos)",
    scoreCondition: "0/4",
    answerMatch: [eq("est_q3", 1, 2, 3, 4, 5), eq("est_q3a", 1)],
    priority: 2,
    type: "risco-critico",
    theme: "estrategia-entrega",
    title: "Atrasos recorrentes apesar do patrocínio",
    insight: "Quando há patrocínio, mas as iniciativas atrasam com frequência, o gargalo pode estar menos na estratégia e mais na capacidade de execução. Isso pode envolver escopo, disponibilidade técnica, integração com sistemas, dados ou governança de entrega. O próximo passo seria diagnosticar onde os projetos travam antes de aumentar o número de iniciativas.",
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
    title: "Pipeline de inovação já em prática",
    insight: "Experimentação contínua, priorizada e medida indica uma cultura de inovação mais madura. A empresa não apenas testa novas possibilidades, mas também cria critérios para escalar, ajustar ou encerrar iniciativas. O próximo passo natural é fortalecer a passagem dos experimentos bem-sucedidos para produção, evitando que bons testes fiquem presos na fase de piloto.",
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
    title: "Nenhuma capacidade interna em dados ou IA",
    insight: "A ausência de capacidade interna em dados ou IA cria uma limitação importante para iniciar e sustentar projetos mais avançados. Isso não impede a empresa de avançar, mas indica que os primeiros passos devem ser bem delimitados e acompanhados de transferência de conhecimento, para evitar dependência excessiva ou iniciativas difíceis de manter.",
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
    title: "Base de dados sem capacidade de IA",
    insight: "Ter capacidade de Engenharia de Dados sem expertise em IA é uma base promissora, mas ainda incompleta. A empresa provavelmente já consegue organizar e disponibilizar dados, mas pode precisar de apoio para transformar essa base em modelos, automações ou produtos analíticos. O foco deveria ser conectar a maturidade de dados a casos de uso aplicáveis.",
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
    title: "Capacidade dupla: IA preditiva e generativa",
    insight: "Ter capacidade interna em IA tradicional e IA generativa abre caminhos complementares. A empresa pode explorar tanto casos baseados em padrões, como previsão, segmentação e precificação, quanto aplicações generativas, como atendimento, automação de conhecimento e processamento de linguagem natural. Essa combinação permite uma abordagem mais ampla e estratégica.",
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
    title: "Resistência cultural à mudança",
    insight: "Resistência cultural pode limitar a adoção de IA mesmo quando a solução técnica está bem construída. Se as equipes não entendem, confiam ou veem valor na mudança, a implementação tende a gerar pouco uso real. O próximo passo seria trabalhar comunicação, capacitação e pequenas vitórias visíveis antes de uma adoção ampla.",
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
    title: "Equipe altamente receptiva à IA",
    insight: "Alta receptividade das equipes é um acelerador importante para iniciativas de IA. Quando as pessoas estão abertas a testar novas formas de trabalho, a empresa tende a reduzir o atrito de adoção e aprender mais rápido. Isso permite considerar casos de uso um pouco mais ambiciosos, desde que bem priorizados e acompanhados.",
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
    title: "Sem critério para avaliar onde usar IA",
    insight: "Sem critérios claros para avaliar quando IA é a solução certa, a empresa pode priorizar casos de uso atraentes, mas pouco relevantes, ou deixar passar oportunidades com bom potencial. O próximo passo seria criar uma forma simples de avaliar oportunidades, considerando valor, viabilidade, risco, dados disponíveis e esforço de implementação.",
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
    title: "Falta capacitação formal em IA",
    insight: "A ausência de capacitação formal pode fazer com que a adoção fique atrás da implementação. Ferramentas e modelos podem até ser entregues, mas o impacto depende de as equipes saberem quando, como e por que utilizá-los. Qualquer iniciativa de IA deveria incluir algum nível de treinamento, documentação e transferência de conhecimento.",
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
    title: "Processos críticos não documentados",
    insight: "Processos críticos pouco documentados aumentam o risco de automações mal definidas, retrabalho e desalinhamento entre áreas. Antes de automatizar, é importante entender como o processo funciona hoje, onde estão as exceções e quais decisões precisam ser preservadas ou melhoradas. O próximo passo seria mapear os processos mais relevantes antes de avançar para automação.",
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
    title: "Processos prontos para automação",
    insight: "Processos bem documentados criam uma base favorável para automação e melhoria operacional. Quando fluxos, responsáveis e exceções estão claros, fica mais fácil avaliar onde IA, analytics ou automação tradicional podem gerar impacto. Isso reduz incerteza de escopo e facilita a transição entre diagnóstico e execução.",
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
    title: "Sem diretrizes de segurança para IA",
    insight: "A ausência de diretrizes, controles e responsáveis para IA cria um risco importante, especialmente quando há dados sensíveis, decisões automatizadas ou uso de IA generativa. Antes de escalar novas iniciativas, faria sentido definir responsabilidades, critérios de segurança, regras de uso e mecanismos de revisão. Isso ajuda a reduzir exposição e aumenta a confiança na adoção.",
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
    title: "Segurança de TI genérica, não específica de IA",
    insight: "Processos gerais de TI ajudam, mas podem não cobrir todos os riscos específicos de IA, como vazamento de dados por prompts, uso inadequado de informações sensíveis ou decisões automatizadas sem revisão humana. Essa resposta indica uma base parcial, mas também uma oportunidade de adaptar os controles existentes aos riscos próprios de IA.",
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
    title: "Governança de IA madura e específica",
    insight: "Governança específica para IA é uma vantagem importante, especialmente em setores regulados ou que lidam com dados sensíveis. Com responsabilidades, controles e processos bem definidos, a empresa tem mais segurança para avaliar casos de uso mais complexos, mantendo gestão de risco e compliance como parte da operação.",
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
    title: "Ponto de partida limpo, sem legado",
    insight: "Começar do zero exige cuidado, mas também permite desenhar a primeira iniciativa sem herdar decisões técnicas antigas. O caminho mais seguro seria iniciar com um caso de uso bem delimitado, escopo controlado e critérios claros de sucesso. Isso ajuda a criar aprendizado interno antes de pensar em um programa mais amplo.",
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
    title: "Base técnica pronta, sem projetos ainda",
    insight: "Mesmo sem projetos de IA iniciados, a empresa parece ter uma base técnica capaz de conectar dados e sistemas com os recursos atuais. Isso sugere que a barreira inicial pode estar mais em priorização, estratégia ou definição de caso de uso do que em infraestrutura. Com um bom recorte, a empresa pode avançar para um primeiro piloto com menos preparação técnica do que organizações que ainda precisam estruturar a base.",
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
    title: "Projetos de IA parados",
    insight: "Projetos de IA parados não significam necessariamente que a tecnologia falhou. Muitas vezes, o bloqueio está em escopo, dono do projeto, dados, integração, governança ou capacidade de entrega. O próximo passo seria revisar os projetos existentes, identificar o motivo da paralisação e decidir quais valem ser retomados, redesenhados ou encerrados.",
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
    title: "IA tradicional e generativa em paralelo",
    insight: "Trabalhar com IA tradicional e IA generativa em paralelo pode ser uma combinação saudável, desde que haja clareza sobre arquitetura, manutenção e integração. Sem algum nível de padronização, cada novo projeto pode adicionar complexidade operacional. O próximo passo seria definir práticas comuns para desenvolvimento, monitoramento e evolução dessas soluções.",
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
    title: "IA isolada dos sistemas centrais",
    insight: "Projetos de IA que não se integram aos sistemas centrais tendem a gerar valor de forma limitada. Mesmo quando funcionam bem, podem ficar restritos a poucos usuários ou depender de processos manuais para serem utilizados. Priorizar integração com sistemas como CRM, ERP, ferramentas internas ou fluxos operacionais ajuda a transformar uma prova de conceito em capacidade real de negócio.",
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
    title: "Arquitetura pensada para reuso",
    insight: "Projetar soluções de IA com reutilização e escala desde o início é um sinal positivo de maturidade técnica. Isso reduz o risco de criar iniciativas isoladas por área e aumenta a chance de reaproveitar componentes, dados, integrações e aprendizados em novos casos de uso. O próximo passo seria consolidar essas práticas para sustentar o crescimento do portfólio.",
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
    title: "Portfólio de IA sem manutenção",
    insight: "Ter vários projetos de IA sem uma cadência clara de atualização cria um risco silencioso. Modelos, regras e integrações podem perder aderência com o tempo, especialmente quando os dados, o mercado ou os processos mudam. Essa resposta sugere a necessidade de revisar a saúde do portfólio existente antes de adicionar novas iniciativas.",
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
    title: "Ecossistema de IA já integrado",
    insight: "Um ecossistema de IA integrado indica que a empresa já passou da fase de ferramentas isoladas e começou a construir uma capacidade mais estruturada. O próximo desafio passa a ser sustentar essa escala com governança, monitoramento, priorização e manutenção contínua. Nesse estágio, a maturidade operacional se torna tão importante quanto a criação de novos modelos.",
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
    title: "Volume de projetos sem resultado comprovado",
    insight: "Ter cinco ou mais projetos sem resultado mensurável claro sugere que os critérios de sucesso talvez não tenham sido definidos ou acompanhados de forma consistente. Isso não significa que os projetos não tenham valor, mas dificulta provar impacto e priorizar investimentos futuros. O próximo passo seria criar um framework de mensuração aplicado ao portfólio existente.",
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
    title: "Plataforma de IA pronta para escalar",
    insight: "Com cinco ou mais projetos e arquitetura reutilizável, a empresa já se aproxima de uma capacidade interna de plataforma de IA. A prioridade deixa de ser apenas provar valor inicial e passa a ser sustentar escala, governança, manutenção e reaproveitamento entre áreas. Isso exige processos mais maduros para decidir o que construir, como monitorar e como evoluir as soluções.",
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
    title: "Tecnologia é a dimensão mais decisiva",
    insight: "A diferença entre não ter projetos de IA e ter cinco ou mais representa um dos maiores saltos de maturidade dentro da dimensão Tecnologia. Essa diferença mostra como a experiência prática influencia o resultado final, especialmente porque tecnologia costuma ser mais observável do que dimensões como cultura ou estratégia. Vale destacar essa dimensão na página de resultados como um fator importante para entender o estágio atual da organização.",
  },
];

// ---------------------------------------------------------------------
// Generic pillar-level fallback, used only when a pillar has no specific
// branch insight matching the user's answers. Low-score text reuses the
// existing RECOMMENDATIONS copy from app/data.ts; high-score text is a
// short, generic filler used only when specific answer-driven insights are sparse.
// ---------------------------------------------------------------------
const FALLBACK_HIGH_TEXT: Record<InsightPillarId, string> = {
  dados: "A maturidade em Dados observada aqui reduz uma das principais incertezas de projetos de IA. Vale priorizar casos de uso com impacto mensurável enquanto essa base está disponível.",
  estrategia: "A maturidade estratégica observada aqui permite tratar IA como um portfólio de iniciativas, com prioridades e acompanhamento de valor, não apenas como experimentos isolados.",
  pessoas: "A maturidade cultural e de capacitação observada aqui reduz o risco de adoção lenta e favorece ciclos mais rápidos de teste, aprendizado e incorporação.",
  governanca: "A maturidade de governança observada aqui permite avaliar iniciativas mais complexas com menos atrito, desde que controles e responsabilidades continuem claros.",
  tecnologia: "A maturidade técnica observada aqui permite avançar além de pilotos isolados, com foco em integração, monitoramento, reutilização e escala.",
};

function buildFallbackInsight(pillar: InsightPillarId, tier: "low" | "high"): ResultInsight {
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
    title: tier === "low" ? `${PILLAR_LABEL[pillar]}: próximo passo recomendado` : `${PILLAR_LABEL[pillar]}: força identificada`,
    insight: tier === "low" ? RECOMMENDATIONS[pillar] : FALLBACK_HIGH_TEXT[pillar],
  };
}

const FALLBACK_INSIGHTS: Record<InsightPillarId, { low: ResultInsight; high: ResultInsight }> =
  Object.fromEntries(
    PILLAR_ORDER.map(p => [p, { low: buildFallbackInsight(p, "low"), high: buildFallbackInsight(p, "high") }])
  ) as Record<InsightPillarId, { low: ResultInsight; high: ResultInsight }>;

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

export function insightMatches(insight: ResultInsight, answers: AnswerRecord): boolean {
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
  options: SelectInsightsOptions = {}
): ResultInsight[] {
  const { min = 3, max = 6 } = options;
  if (pillarScores.length === 0) return [];

  const scoreById = Object.fromEntries(pillarScores.map(p => [p.id, p.score])) as Record<InsightPillarId, number>;
  const weakestPillar = pillarScores.reduce((a, b) => (b.score < a.score ? b : a)).id as InsightPillarId;
  const strongestPillar = pillarScores.reduce((a, b) => (b.score > a.score ? b : a)).id as InsightPillarId;

  function compareMatchedInsights(a: ResultInsight, b: ResultInsight) {
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

  const selected: ResultInsight[] = [];
  const pillarCount: Partial<Record<InsightPillarId, number>> = {};
  const usedThemes = new Set<string>();

  function capFor(pillar: InsightPillarId) {
    return pillar === weakestPillar || pillar === strongestPillar ? 3 : 2;
  }

  function tryAdd(insight: ResultInsight, opts: { ignorePillarCap?: boolean; ignoreTheme?: boolean } = {}) {
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

  function forceInclude(insight: ResultInsight) {
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

  return selected.slice(0, max);
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function safeClientText(text: string) {
  return cleanText(text)
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
  effort: "Baixo" | "Médio" | "Alto";
  successMetric: string;
}

interface QuarterlyPillarAction {
  stabilizeTitle: string;
  stabilizeAction: string;
  stabilizeOutcome: string;
  pilotTitle: string;
  pilotAction: string;
  pilotOutcome: string;
  scaleTitle: string;
  scaleAction: string;
  scaleOutcome: string;
}

const QUARTERLY_PILLAR_ACTIONS: Record<InsightPillarId, QuarterlyPillarAction> = {
  dados: {
    stabilizeTitle: "Estabilizar a base de dados",
    stabilizeAction: "mapear fontes críticas, responsáveis, qualidade, acesso e histórico necessário para os casos de uso mais importantes",
    stabilizeOutcome: "uma base mínima confiável para escolher pilotos sem retrabalho de coleta e integração",
    pilotTitle: "Transformar dados em caso de uso",
    pilotAction: "escolher um fluxo em que dados disponíveis apoiem uma decisão relevante, definir métrica de valor e preparar o dataset governado",
    pilotOutcome: "um caso priorizado com dados rastreáveis e critérios claros de viabilidade",
    scaleTitle: "Criar rotina de dados para escala",
    scaleAction: "documentar padrões de acesso, atualização, qualidade e monitoramento para reutilizar dados em novas iniciativas",
    scaleOutcome: "menos dependência de coletas manuais e mais velocidade para novos casos de uso",
  },
  estrategia: {
    stabilizeTitle: "Alinhar liderança e tese de valor",
    stabilizeAction: "definir patrocinador, problema de negócio, métrica econômica e critérios para decidir quais oportunidades de IA merecem investimento",
    stabilizeOutcome: "um ponto de vista executivo claro sobre onde IA deve gerar valor primeiro",
    pilotTitle: "Converter intenção em roadmap",
    pilotAction: "priorizar dois ou três casos de uso, atribuir donos, definir prazos e conectar cada iniciativa a uma métrica de resultado",
    pilotOutcome: "um roadmap executável de curto prazo, com menos dependência de iniciativas isoladas",
    scaleTitle: "Instalar cadência de portfólio",
    scaleAction: "revisar mensalmente progresso, valor capturado, riscos e decisões de continuidade, pausa ou escala dos casos de uso",
    scaleOutcome: "IA gerida como portfólio, não como coleção de experimentos desconectados",
  },
  pessoas: {
    stabilizeTitle: "Preparar equipes para adoção",
    stabilizeAction: "identificar usuários-chave, lacunas de conhecimento, resistências e rituais de comunicação antes de introduzir novas soluções",
    stabilizeOutcome: "menos atrito de mudança e mais clareza sobre como a IA entra no trabalho real",
    pilotTitle: "Rodar capacitação aplicada",
    pilotAction: "treinar os times envolvidos no piloto, criar critérios simples de uso e coletar feedback semanal sobre adoção e barreiras",
    pilotOutcome: "equipes capazes de testar IA com responsabilidade e transformar aprendizado em melhoria operacional",
    scaleTitle: "Formalizar playbook de adoção",
    scaleAction: "documentar práticas, exemplos, responsáveis e materiais de treinamento para replicar a adoção em novas áreas",
    scaleOutcome: "capacidade interna mais consistente para absorver novas iniciativas de IA",
  },
  governanca: {
    stabilizeTitle: "Definir controles mínimos de IA",
    stabilizeAction: "estabelecer responsáveis, regras de uso, critérios de segurança, revisão humana e tratamento de dados sensíveis",
    stabilizeOutcome: "um perímetro claro para avançar sem aumentar exposição operacional, legal ou reputacional",
    pilotTitle: "Aplicar governança no piloto",
    pilotAction: "incorporar controles de risco, privacidade, documentação de processo e critérios de aprovação dentro do primeiro caso de uso",
    pilotOutcome: "um modelo de entrega que já nasce auditável e mais fácil de repetir",
    scaleTitle: "Criar revisão recorrente",
    scaleAction: "manter cadência de revisão de riscos, responsáveis, qualidade dos processos e decisões automatizadas ou assistidas por IA",
    scaleOutcome: "governança suficiente para sustentar escala sem travar a execução",
  },
  tecnologia: {
    stabilizeTitle: "Definir base técnica de execução",
    stabilizeAction: "avaliar integrações, ambientes, dados, segurança e caminho de produção antes de escolher novas ferramentas ou modelos",
    stabilizeOutcome: "um desenho técnico realista para tirar iniciativas do protótipo",
    pilotTitle: "Entregar piloto integrado",
    pilotAction: "implementar um caso de uso limitado, conectado aos sistemas necessários e medido por adoção, qualidade e impacto operacional",
    pilotOutcome: "prova de valor observável, com menos dependência de processos manuais",
    scaleTitle: "Padronizar operação de IA",
    scaleAction: "definir práticas de monitoramento, atualização, reutilização, documentação e suporte para soluções em produção",
    scaleOutcome: "um caminho mais previsível para escalar modelos, automações e integrações",
  },
};

const ACTION_META: Record<InsightPillarId, { ownerRole: string; dependency: string; successMetric: string }> = {
  dados: {
    ownerRole: "Liderança de Dados e Analytics",
    dependency: "Fontes críticas e responsáveis identificados",
    successMetric: "Dados prioritários com dono, critério de qualidade e acesso medido",
  },
  estrategia: {
    ownerRole: "Patrocinador executivo de IA",
    dependency: "Problema de negócio e tese de valor acordados",
    successMetric: "Casos priorizados com responsável, benefício esperado e critério de decisão",
  },
  pessoas: {
    ownerRole: "Pessoas, Change e liderança da área piloto",
    dependency: "Usuários-chave e fluxo de trabalho selecionados",
    successMetric: "Adoção ativa, barreiras registradas e capacitação concluída",
  },
  governanca: {
    ownerRole: "Risco, Jurídico, Segurança e Tecnologia",
    dependency: "Responsáveis e apetite de risco definidos",
    successMetric: "Controles mínimos aplicados e decisões críticas com revisão humana",
  },
  tecnologia: {
    ownerRole: "CTO, Engenharia ou Plataforma",
    dependency: "Caso de uso, sistemas e caminho de produção definidos",
    successMetric: "Piloto integrado, monitorado e utilizado em um fluxo real",
  },
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
  currentSituation: string[];
  risks: string[];
  opportunity: string[];
  immediateRecommendation: string[];
}

const EXEC_PILLAR_LABEL: Record<InsightPillarId, string> = {
  dados: "Dados",
  estrategia: "Estratégia",
  pessoas: "Pessoas e Cultura",
  governanca: "Processos e responsabilidades",
  tecnologia: "Tecnologia",
};

const EXEC_READINESS_STANCE: Record<string, string> = {
  "Prontidão Baixa": "A empresa ainda tem uma base frágil para usar dados e IA em decisões relevantes.",
  "Prontidão Emergente": "A empresa já iniciou sua jornada, mas a base ainda é inconsistente para sustentar IA em escala.",
  "Prontidão Moderada": "A empresa tem uma base intermediária: consegue avançar em iniciativas selecionadas, mas ainda depende de pontos frágeis.",
  "Prontidão Alta": "A empresa está bem posicionada para ampliar o uso de dados e IA, desde que trate os pontos mais frágeis antes de escalar.",
  "Prontidão Avançada": "A empresa apresenta maturidade alta para usar dados e IA de forma mais ampla.",
};

const EXEC_RISK_TEXT: Record<InsightPillarId, string> = {
  dados: "Decisões podem continuar sendo tomadas com informações incompletas, lentas ou contraditórias",
  estrategia: "Investimentos em IA podem virar testes isolados, sem prioridade executiva ou retorno claro",
  pessoas: "As equipes podem não adotar as soluções, mesmo quando a tecnologia funcionar",
  governanca: "A empresa pode ampliar IA sem regras claras de responsabilidade, aumentando exposição e retrabalho",
  tecnologia: "Projetos podem ficar presos em pilotos, sem chegar à operação do dia a dia",
};

const EXEC_NO_RISK_TEXT =
  "Nenhum pilar apresenta risco crítico no momento: todos estão em nível forte ou avançado. O foco deve ser manter a consistência e capturar o retorno já disponível, em vez de corrigir fragilidades.";

const EXEC_OPPORTUNITY_TEXT: Record<InsightPillarId, string> = {
  dados: "A empresa já trata dados como insumo relevante para suas decisões. Na visão da Snowfox, falta dar mais consistência a esse acesso, para reduzir o tempo perdido reconciliando informações antes de agir.",
  estrategia: "A liderança já demonstra compromisso real com IA como prioridade de negócio. Na visão da Snowfox, falta concentrar esse investimento nos casos de uso com maior retorno, em vez de dispersar energia em iniciativas isoladas.",
  pessoas: "As equipes já demonstram abertura para adotar IA no dia a dia. Na visão da Snowfox, falta transformar essa abertura em mudança real de trabalho, não apenas em ferramenta disponível para poucos usuários.",
  governanca: "A empresa já opera com um nível saudável de controle sobre suas iniciativas de IA. Na visão da Snowfox, falta consolidar essas regras para avançar sem criar riscos desnecessários para clientes, equipes e liderança.",
  tecnologia: "A base tecnológica atual já sustenta iniciativas de IA com solidez. Na visão da Snowfox, falta garantir que os pilotos sejam desenhados desde o início para virar solução usada na rotina da empresa.",
};

function uniquePillars(pillars: Array<InsightPillarId | undefined>): InsightPillarId[] {
  const unique: InsightPillarId[] = [];
  for (const pillar of pillars) {
    if (pillar && !unique.includes(pillar)) unique.push(pillar);
  }
  return unique;
}

function buildExecutiveRiskPillars(
  insights: ResultInsight[],
  pillarScores: PillarScore[],
  weakest: PillarScore,
): InsightPillarId[] {
  const scoreById = Object.fromEntries(pillarScores.map(p => [p.id, p.score])) as Record<InsightPillarId, number>;
  const isWeak = (pillar: InsightPillarId) => isWeakPillarScore(scoreById[pillar] ?? 0);

  // Only a matched risk/gap insight whose pillar score actually agrees that
  // it's weak counts — a single low answer inside an otherwise strong pillar
  // isn't a real risk for the executive summary.
  const insightPillars = insights
    .filter(i => i.priority <= 2 && isWeak(i.pillar))
    .map(i => i.pillar);
  const rankedWeakPillars = [...pillarScores]
    .filter(p => isWeak(toPillarId(p.id)))
    .sort((a, b) => a.score - b.score)
    .map(p => toPillarId(p.id));
  const weakestIfWeak = isWeak(toPillarId(weakest.id)) ? [toPillarId(weakest.id)] : [];

  // No forced padding to 3 entries: if fewer pillars (or none) are genuinely
  // weak, the risk list should reflect that instead of fabricating risks.
  return uniquePillars([...insightPillars, ...weakestIfWeak, ...rankedWeakPillars]).slice(0, 3);
}

export function buildExecutiveSummary({
  answers,
  pillarScores,
  result,
  strongest,
  weakest,
}: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  result: AssessmentResult;
  strongest: PillarScore;
  weakest: PillarScore;
}): ExecutiveSummary {
  const insights = selectResultInsights(answers, pillarScores, { min: 3, max: 5 });
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
  const scoreGap = Math.max(0, strongest.score - weakest.score);
  const riskPillars = buildExecutiveRiskPillars(insights, pillarScores, weakest);
  const weakestIsStrong = !isWeakPillar(weakestPillar);

  return {
    currentSituation: [
      safeClientText(EXEC_READINESS_STANCE[result.level] ?? "A leitura da empresa depende dos pontos fortes e fracos identificados no diagnóstico."),
      weakestIsStrong
        ? safeClientText(`A pontuação geral foi ${result.score}/100; todos os pilares avaliados estão em nível forte ou avançado, com destaque para ${EXEC_PILLAR_LABEL[strongestPillar]} (${strongest.score}%) e ${EXEC_PILLAR_LABEL[weakestPillar]} como o que ainda tem mais espaço para evoluir (${weakest.score}%).`)
        : safeClientText(`A pontuação geral foi ${result.score}/100; o ponto mais forte é ${EXEC_PILLAR_LABEL[strongestPillar]} (${strongest.score}%) e o principal limitador é ${EXEC_PILLAR_LABEL[weakestPillar]} (${weakest.score}%).`),
      weakestIsStrong
        ? safeClientText(`Como todos os pilares já estão em nível forte, o ganho vem menos de corrigir uma fragilidade e mais de manter consistência, aprofundar o uso e capturar o retorno já disponível.`)
        : scoreGap >= 25
          ? safeClientText(`Na prática, a capacidade em ${EXEC_PILLAR_LABEL[strongestPillar]} pode acelerar os primeiros movimentos, enquanto a limitação em ${EXEC_PILLAR_LABEL[weakestPillar]} tende a gerar retrabalho, lentidão ou risco nas iniciativas que dependerem dela.`)
          : safeClientText(`Como os pilares estão relativamente próximos, o ganho virá menos de corrigir um único ponto e mais de coordenar prioridades, responsáveis e métricas durante a execução.`),
    ],
    risks: riskPillars.length > 0
      ? riskPillars.map(pillar => safeClientText(EXEC_RISK_TEXT[pillar]))
      : [safeClientText(EXEC_NO_RISK_TEXT)],
    opportunity: [
      safeClientText(`A maior oportunidade está em ${EXEC_PILLAR_LABEL[opportunityPillar]} (${scoreByPillar[opportunityPillar] ?? weakest.score}%).`),
      safeClientText(EXEC_OPPORTUNITY_TEXT[opportunityPillar]),
    ],
    immediateRecommendation: [
      safeClientText("Adote Data Foundation como a primeira solução: uma base reutilizável de lake ou warehouse, qualidade, catálogo, acesso e governança para sustentar decisões e produtos de IA."),
      safeClientText("Ela pode começar imediatamente, sem pré-requisito de maturidade, a partir de um único domínio de negócio com fontes e responsáveis claramente identificados."),
    ],
  };
}

export function buildQuarterlyRecommendations({
  answers,
  pillarScores,
  result,
  strongest,
  weakest,
}: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  result: AssessmentResult;
  strongest: PillarScore;
  weakest: PillarScore;
}): QuarterlyRecommendation[] {
  const insights = selectResultInsights(answers, pillarScores, { min: 3, max: 6 });
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

  return [
    {
      id: "q1",
      period: "Próximo trimestre",
      focus: "Iniciar Data Foundation",
      title: "Construir a base de dados para IA",
      action: "Começar agora por um domínio de negócio e estruturar lake ou warehouse, qualidade, catálogo, acesso e governança como uma base reutilizável.",
      outcome: "dados confiáveis e acessíveis para decisões, automações e modelos futuros",
      ownerRole: ACTION_META.dados.ownerRole,
      dependency: "Nenhuma pré-condição de maturidade",
      effort: "Médio",
      successMetric: ACTION_META.dados.successMetric,
    },
    {
      id: "q2",
      period: "Trimestre seguinte",
      focus: safeClientText(`Executar ${EXEC_PILLAR_LABEL[secondPillar]}`),
      title: safeClientText(opportunity?.title ?? secondCopy.pilotTitle),
      action: safeClientText(`Converter o aprendizado do trimestre anterior em execução: ${secondCopy.pilotAction}.`),
      outcome: safeClientText(secondCopy.pilotOutcome),
      ownerRole: ACTION_META[secondPillar].ownerRole,
      dependency: `Conclusão do primeiro trimestre; ${ACTION_META[secondPillar].dependency.toLocaleLowerCase("pt-BR")}`,
      effort: "Médio",
      successMetric: ACTION_META[secondPillar].successMetric,
    },
    {
      id: "q3",
      period: "Terceiro trimestre",
      focus: safeClientText(`Escalar ${EXEC_PILLAR_LABEL[thirdPillar]}`),
      title: safeClientText(strength ? `Escalar a partir de ${strength.title}` : thirdCopy.scaleTitle),
      action: safeClientText(`Usar essa base para ampliar a maturidade: ${thirdCopy.scaleAction}.`),
      outcome: safeClientText(thirdCopy.scaleOutcome),
      ownerRole: ACTION_META[thirdPillar].ownerRole,
      dependency: `Aprendizados do piloto documentados; ${ACTION_META[thirdPillar].dependency.toLocaleLowerCase("pt-BR")}`,
      effort: "Alto",
      successMetric: ACTION_META[thirdPillar].successMetric,
    },
  ];
}
