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

import { AnswerRecord, PillarScore, PILLAR_CONFIG, RECOMMENDATIONS } from "@/app/data";

export type InsightPillarId = "dados" | "estrategia" | "pessoas" | "governanca" | "tecnologia";

export type InsightBadge = "risco-critico" | "oportunidade" | "proximo-passo" | "forca-existente";

export const INSIGHT_BADGE_LABEL: Record<InsightBadge, string> = {
  "risco-critico": "Risco crítico",
  "oportunidade": "Oportunidade",
  "proximo-passo": "Próximo passo",
  "forca-existente": "Força existente",
};

export const PILLAR_LABEL = Object.fromEntries(
  PILLAR_CONFIG.map(p => [p.id, p.title])
) as Record<InsightPillarId, string>;

const PILLAR_ORDER: InsightPillarId[] = ["dados", "estrategia", "pessoas", "governanca", "tecnologia"];

interface AnswerCondition {
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
    insight: "Sua empresa ainda não consegue saber com clareza se está coletando os dados certos. Isso significa que qualquer modelo de IA construído hoje partiria de uma base não validada. Antes de qualquer outra coisa, vocês se beneficiariam de um projeto de Estratégia Orientada a Dados, para mapear o que existe hoje em relação ao que as decisões do negócio realmente precisam.",
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
    insight: "Uma base de dados sólida e validada é o maior fator isolado de retorno em projetos de IA. Essa organização já superou a etapa de coleta e está pronta para aplicar casos de uso diretamente: segmentação (segMENTOR), precificação (priceGURU) ou modelos sob medida via MLaaS.",
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
    insight: "Dados isolados e de difícil acesso são a principal razão pela qual pilotos de IA travam logo após a prova de conceito: o modelo funciona na demonstração, mas não consegue ser alimentado em produção. Esse é um problema clássico de Engenharia de Dados, não de IA, e precisa ser resolvido antes de qualquer novo investimento em modelagem.",
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
    insight: "Acesso fácil e governado aos dados é exatamente a infraestrutura que um pipeline de MLOps pressupõe existir. Essa empresa pode pular a discussão de \"encanamento\" e ir direto para o deploy e o monitoramento de modelos.",
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
    insight: "O crescimento ainda escala de forma linear com o número de pessoas, sinal de que pouco da operação está automatizado. Essa é uma abertura direta para IA Generativa (automação de processos, agentes inteligentes), o tipo de caso de uso que mostra ROI mais rápido justamente por partir de uma base majoritariamente manual.",
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
    insight: "Sem histórico de dados confiável, casos de uso preditivos (previsão de demanda, churn, precificação dinâmica) simplesmente não são viáveis ainda, pois não há padrão a ser aprendido. O pré-requisito aqui é Engenharia de Dados, para começar a capturar e armazenar histórico desde já, antes mesmo de qualquer conversa sobre IA.",
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
    insight: "Anos de dados históricos confiáveis são exatamente o que alimenta produtos baseados em padrões, como priceGURU (padrões de precificação) e segMENTOR (segmentação comportamental). Esse é um ativo diferenciado que a maioria dos concorrentes não tem, vale a pena explorá-lo rapidamente.",
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
    insight: "Se demora muito para puxar os números, as decisões acabam sendo tomadas por intuição, independentemente de quanto dado exista armazenado. Isso é um problema de latência e arquitetura, melhor resolvido com trabalho de Engenharia de Dados na camada de acesso, não com mais um dashboard.",
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
    insight: "Baixa confiança nos dados costuma ser um bloqueio maior à adoção de IA do que a própria tecnologia: mesmo um modelo perfeito é ignorado se a liderança não confia nos números por trás dele. Isso pede uma etapa de qualidade e transparência dos dados (Consultoria de Big Data) antes de introduzir recomendações orientadas por IA, ou elas serão descartadas do mesmo jeito.",
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
    insight: "Essa é a combinação de maior risco em todo o assessment: nenhuma visão estratégica e a liderança não entende o valor econômico da IA. Um investimento em tecnologia aqui provavelmente estagnaria por falta de patrocínio. O primeiro passo correto é uma sessão de Consultoria de IA em nível executivo, focada em caso de negócio e ROI, não um piloto técnico.",
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
    insight: "Visão, casos de uso priorizados, roadmap documentado e cadência mensal de revisão: isso é governança de IA em nível de conselho, algo raro mesmo em empresas maiores. Essa organização está pronta para uma abordagem de portfólio (várias iniciativas em paralelo via MLOps), não para um piloto isolado.",
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
    insight: "A análise já foi feita (a liderança sabe onde está o retorno), mas ainda não virou um plano com datas e responsáveis, um gap comum de \"sabemos o que fazer, só não colocamos no papel\". Um workshop curto de Consultoria de IA para desenhar o roadmap transforma isso em um plano executável de 12 a 24 meses, provavelmente a ação de ROI mais rápido disponível para essa empresa.",
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
    insight: "É onde a maioria das empresas começa, e não é um lugar ruim de se estar: só significa que o próximo passo deve ser um piloto único e bem delimitado, com métrica de sucesso clara, em vez de um programa amplo. Uma prova de conceito contida (por exemplo, segMENTOR ou um caso de uso pequeno de IA Generativa) constrói o argumento interno para investimentos futuros.",
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
    insight: "Quando a IA está embutida na própria proposta de valor, a prioridade muda de \"adotar IA\" para \"proteger e ampliar a vantagem\": modelos proprietários, ativos de dados defensáveis e disciplina de MLOps para continuar lançando mais rápido do que os concorrentes conseguem copiar.",
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
    insight: "Falta de patrocínio executivo é um dos preditores mais confiáveis de projetos de IA que não conseguem escalar além do piloto, independentemente de quão boa seja a tecnologia. Recomenda-se começar com uma sessão de Consultoria de IA orientada a caso de negócio, com foco específico em conseguir um patrocinador executivo, em vez de uma proposta técnica mais ampla.",
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
    insight: "Patrocínio forte e visível é o sinal verde para apostas maiores: essa empresa pode justificar um contrato contínuo de MLOps ou MLaaS em vez de projetos pontuais, já que o risco organizacional de escalar já está mitigado.",
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
    insight: "O patrocínio existe, mas a entrega atrasa cronicamente, o que costuma ser um problema de capacidade técnica, não de estratégia. É exatamente a lacuna que o MLaaS foi desenhado para fechar: ele tira o risco de entrega das mãos do time interno em vez de pedir que ele construa uma capacidade que ainda não tem.",
  },
  {
    id: "estrategia-09",
    pillar: "pessoas",
    // NOTE: the source doc numbers this "2.5" under Estratégia, but the
    // underlying questions (pess_q2 / pess_q2a) are scored under the
    // "pessoas" pillar in app/data.ts (no scorePillar override). Tagged with
    // its real scoring pillar here so pillar caps/weakest-strongest logic
    // stay accurate — see the integration summary for this discrepancy.
    questionId: "pess_q2a",
    trigger: "pess_q2 = 5 (\"Continuamente\" experimenta) AND pess_q2a = 4 (processo priorizado, medido, com critério de escalar/encerrar)",
    scoreCondition: "combinação de topo",
    answerMatch: [eq("pess_q2", 5), eq("pess_q2a", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "pessoas-experimentacao",
    title: "Pipeline de inovação já em prática",
    insight: "Experimentação contínua e medida, com um processo claro de escalar ou encerrar, é um pipeline de inovação que a maioria das empresas nunca chega a construir. O próximo passo natural é formalizar isso em MLOps, para que experimentos bem-sucedidos vão para produção automaticamente, em vez de ficarem pilotos para sempre.",
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
    insight: "Zero capacidade interna em dados ou IA é exatamente a lacuna que o MLaaS existe para resolver: permite que a empresa consuma resultados de machine learning sem antes precisar contratar e montar um time interno, processo que pode levar mais de 12 meses até gerar qualquer valor.",
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
    insight: "Uma base de dados sólida sem capacidade de construir IA é uma combinação muito comum e muito fácil de resolver: a empresa não precisa contratar engenheiros de ML, precisa de um parceiro que faça a ponte dos dados até os modelos. Consultoria de IA combinada com MLaaS é o encaixe natural aqui.",
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
    insight: "Ter capacidade preditiva e generativa internamente ao mesmo tempo é relativamente raro e abre caminhos paralelos: casos de uso baseados em padrões (priceGURU, segMENTOR) junto com casos generativos (IA Generativa, PLN), sem precisar escolher um caminho primeiro.",
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
    insight: "Resistência cultural é, de forma consistente, uma causa maior de fracasso em projetos de IA do que a escolha da tecnologia. Isso deveria reordenar a sequência: gestão de mudança e vitórias pequenas e visíveis antes de qualquer implantação ampla de ferramentas, independentemente de quão pronta esteja a base de dados ou os sistemas.",
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
    insight: "Alta receptividade é um acelerador genuíno: essa empresa provavelmente consegue comprimir os prazos típicos de adoção e deveria ser mais ambiciosa no escopo do que um primeiro piloto \"seguro\" sugeriria.",
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
    insight: "Sem uma forma de avaliar se a IA é sequer a ferramenta certa para um problema específico, as organizações tendem a investir demais em casos de uso vistosos mas de baixo valor, ou a descartar a IA onde ela ajudaria de verdade. Um workshop curto de avaliação de oportunidades com a Consultoria de IA (horas, não meses) fecha essa lacuna a baixo custo antes de qualquer gasto técnico.",
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
    insight: "Independentemente da tecnologia implementada, a ausência de capacitação faz com que a adoção fique sempre atrás da implementação: as ferramentas são construídas, mas ninguém as usa. Qualquer projeto de entrega da SnowFox (Consultoria de IA, MLOps) deveria ser escopado com uma trilha de capacitação e transferência de conhecimento, não apenas com um entregável técnico.",
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
    insight: "Não dá para automatizar de forma confiável um processo que ninguém colocou no papel; processos não documentados são a razão mais comum de projetos de automação \"simples\" levarem o triplo do tempo previsto. Um mapeamento de processos (parte de Estratégia Orientada a Dados) deveria vir antes de qualquer compromisso de automação, não depois.",
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
    insight: "Processos totalmente documentados já estão prontos para automação como estão: essa empresa pode ir direto da decisão à construção com IA Generativa ou automação de fluxo de trabalho, com risco de escopo muito menor do que a maioria.",
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
    insight: "Essa é a resposta de maior risco em todo o assessment do ponto de vista de exposição negativa: implantar IA (especialmente IA generativa, que lida diretamente com dados sensíveis) sem controles de segurança ou privacidade é exatamente como acontecem vazamentos de dados e incidentes de compliance. Isso deveria ser um portão de entrada para qualquer nova iniciativa de IA: o trabalho de governança precisa acontecer antes do primeiro deploy em produção, não depois.",
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
    insight: "Segurança de TI genérica não cobre riscos específicos de IA, como injeção de prompt, vazamento de dados pelo modelo ou decisões automatizadas sem revisão humana. É uma lacuna parcial que vale a pena fechar com uma revisão de risco específica para IA antes de escalar além do piloto, um seguro barato perto do custo de um incidente.",
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
    insight: "Governança madura e específica para IA é uma vantagem competitiva real em setores regulados ou que lidam com dados sensíveis: essa empresa pode buscar casos de uso de maior risco (decisão financeira, saúde, dados pessoais) com muito menos atrito de compliance do que a maioria dos concorrentes.",
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
    insight: "Estar do zero, tanto no lado estratégico quanto no técnico, é na verdade a posição de partida mais simples para acertar o desenho, já que não há ferramentas legadas para contornar. Recomenda-se um piloto único e bem delimitado, de 60 a 90 dias (por exemplo, segMENTOR ou um caso de uso contido de IA Generativa), em vez de um programa de grande escala, justamente porque não há infraestrutura existente limitando a escolha.",
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
    insight: "Esse é um achado importante: a base técnica já está pronta mesmo sem nenhum projeto de IA iniciado, o que significa que a barreira aqui é organizacional e estratégica, não de infraestrutura. Essa empresa pode chegar a um piloto mais rápido do que a maioria, já que a etapa típica de 3 a 6 meses de preparação de dados provavelmente pode ser pulada.",
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
    insight: "Projetos de IA parados são extremamente comuns e raramente indicam falha da tecnologia; geralmente é uma questão de dono do projeto, escopo ou saída de quem liderava a iniciativa. Um projeto externo de MLOps costuma reviver um projeto parado de forma mais rápida e barata do que recomeçar do zero, assumindo diretamente a dívida técnica existente.",
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
    insight: "Rodar IA tradicional e IA generativa em paralelo é uma diversificação saudável, mas adiciona uma sobrecarga real de integração e manutenção se não for padronizada. Esse é o ponto em que MLOps deixa de ser opcional: sem ele, cada novo projeto adiciona atrito operacional em vez de somar valor.",
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
    insight: "Projetos de IA que vivem fora dos sistemas centrais (CRM, ERP, Slack) tendem a permanecer como \"IA invisível\": úteis para poucas pessoas, invisíveis para o negócio e os primeiros a serem cortados em uma revisão de orçamento. Priorizar o trabalho de integração agora é o que transforma uma prova de conceito em algo do qual a empresa realmente passa a depender.",
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
    insight: "Construir pensando em reutilização desde o início (em vez de soluções pontuais por área) é a diferença entre ter 4 projetos e ter 40 mais adiante. Esse é exatamente o momento de formalizar práticas de MLOps: a disciplina de arquitetura já existe, só falta um processo em torno dela para escalar.",
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
    insight: "Volume sem cadência de manutenção é um risco silencioso: modelos perdem precisão com o tempo (model drift) sem que ninguém perceba, até que uma métrica do negócio piore discretamente. É um sinal forte para uma auditoria de saúde de MLOps em todo o portfólio existente antes de adicionar qualquer coisa nova.",
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
    insight: "Um ecossistema de IA de fato integrado (não apenas várias ferramentas desconectadas) coloca essa organização à frente da grande maioria das empresas, de qualquer porte. O próximo investimento certo costuma ser uma capacidade de plataforma dedicada, MLOps em escala ou uma parceria de MLaaS, para sustentar a velocidade conforme o portfólio continua crescendo, em vez de mais soluções pontuais.",
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
    insight: "Cinco ou mais projetos sem nenhum resultado mensurável comprovado é uma armadilha comum e cara; geralmente significa que os critérios de sucesso nunca foram definidos previamente, não que os projetos falharam. Antes de construir mais, essa empresa precisa de um framework de mensuração de impacto aplicado retroativamente ao que já existe, ou o padrão simplesmente se repete em escala maior.",
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
    insight: "Com 5 ou mais projetos e arquitetura reutilizável e escalável, essa empresa opera mais como um time interno de plataforma de IA do que como uma série de experimentos. MLOps e, potencialmente, um arranjo de MLaaS cogerido passam a ser sobre sustentar e governar a escala, não sobre provar valor inicial, uma conversa diferente (e mais estratégica) da que a maioria das empresas está pronta para ter.",
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
    insight: "A diferença entre \"ainda não existem projetos\" e \"5 ou mais\" é o maior intervalo de pontuação de todo o assessment. Tecnologia costuma ser a dimensão com maior variância entre respondentes, pois, diferente de Estratégia ou Cultura, é a única dimensão observável de forma binária, não uma questão de grau — o fator com maior potencial de definir o resultado final de maturidade.",
  },
];

// ---------------------------------------------------------------------
// Generic pillar-level fallback, used only when a pillar has no specific
// branch insight matching the user's answers. Low-score text reuses the
// existing RECOMMENDATIONS copy from app/data.ts; high-score text is a
// short, generic filler (not part of the original 41 insights).
// ---------------------------------------------------------------------
const FALLBACK_HIGH_TEXT: Record<InsightPillarId, string> = {
  dados: "A maturidade em Dados observada aqui está entre os fatores que mais aceleram projetos de IA — vale explorar casos de uso aplicados enquanto essa vantagem existe.",
  estrategia: "A maturidade estratégica em IA observada aqui é o tipo de base que sustenta um portfólio de iniciativas, não apenas um piloto isolado.",
  pessoas: "A maturidade cultural e de capacitação em IA observada aqui reduz o risco de adoção lenta ao introduzir novas soluções.",
  governanca: "A maturidade de governança observada aqui permite avançar com iniciativas de IA de maior risco com menos atrito de compliance.",
  tecnologia: "A maturidade técnica observada aqui permite ir além de pilotos isolados rumo a uma plataforma de IA em escala.",
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
    title: `${PILLAR_LABEL[pillar]}: próximo passo recomendado`,
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
 * Picks 3-6 insights for the results page: critical blockers first, then
 * strengths, capped per pillar (2, or 3 for the clearly weakest/strongest
 * pillar) and deduped by theme. Falls back to generic pillar-level insights
 * if too few specific ones matched.
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

  const matched = RESULT_INSIGHTS
    .filter(i => insightMatches(i, answers))
    .sort((a, b) => a.priority - b.priority);

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

  // Pass 1: priority order (critical blockers first), respecting caps + theme dedup.
  for (const insight of matched) {
    if (selected.length >= max) break;
    tryAdd(insight);
  }

  // Make sure at least one strength insight appears when the user has mature
  // answers, even if the critical/gap insights already filled every slot.
  const hasStrength = selected.some(i => i.priority === 3);
  if (!hasStrength) {
    const topStrength = matched.find(i => i.priority === 3);
    if (topStrength) {
      if (selected.length < max) {
        tryAdd(topStrength, { ignorePillarCap: true, ignoreTheme: true });
      } else {
        let idx = -1;
        for (let i = selected.length - 1; i >= 0; i--) {
          if (selected[i].priority > 1) { idx = i; break; }
        }
        if (idx !== -1) {
          const removed = selected[idx];
          pillarCount[removed.pillar] = (pillarCount[removed.pillar] ?? 1) - 1;
          usedThemes.delete(removed.theme);
          selected.splice(idx, 1);
          tryAdd(topStrength, { ignorePillarCap: true, ignoreTheme: true });
        }
      }
    }
  }

  // Pass 2: still short of the minimum -> relax the per-pillar cap.
  if (selected.length < min) {
    for (const insight of matched) {
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

  return selected.slice(0, max);
}
