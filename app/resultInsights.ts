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

import { AnswerRecord, AssessmentResult, PillarScore, PILLAR_CONFIG, RECOMMENDATIONS } from "@/app/data";

export type InsightPillarId = "dados" | "estrategia" | "pessoas" | "governanca" | "tecnologia";

export type InsightBadge = "risco-critico" | "oportunidade" | "proximo-passo" | "forca-existente";

export const INSIGHT_BADGE_LABEL: Record<InsightBadge, string> = {
  "risco-critico": "Risco prioritário",
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
    insight: "A empresa ainda não tem clareza se coleta os dados certos para apoiar as decisões mais importantes. Isso torna qualquer iniciativa de IA mais frágil, porque o modelo pode partir de uma base incompleta ou pouco representativa. O próximo passo é mapear quais decisões críticas dependem de dados e comparar essa necessidade com as fontes disponíveis hoje.",
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
    insight: "A organização já parece ter uma base de dados relevante para decisões de negócio. Isso reduz uma das principais incertezas de projetos de IA e permite avançar para casos de uso aplicados, como segmentação, previsão, recomendação ou otimização de processos, desde que haja critérios claros de impacto e governança.",
  },
  {
    id: "dados-12",
    pillar: "dados",
    questionId: "dados_q1",
    trigger: "dados_q1 = 2 (alguns dados relevantes, mas ainda incompletos)",
    scoreCondition: "2.5/5",
    answerMatch: [eq("dados_q1", 2)],
    priority: 2,
    type: "oportunidade",
    theme: "dados-suficiencia",
    title: "Dados parcialmente úteis, ainda com lacunas",
    insight: "A empresa já coleta alguns dados relevantes, mas decisões importantes ainda dependem de informações incompletas, análises manuais ou suposições. Antes de avançar para casos de IA mais complexos, vale identificar quais lacunas afetam as decisões prioritárias e resolver primeiro as fontes mais críticas.",
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
    insight: "Dados isolados e de difícil acesso costumam impedir que pilotos cheguem à produção. O modelo pode funcionar em uma demonstração, mas não consegue ser alimentado de forma confiável no dia a dia. Antes de investir em novas modelagens, vale resolver integrações, permissões e disponibilidade das fontes críticas.",
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
    title: "Acesso a dados pronto para operação",
    insight: "Acesso fácil e governado aos dados é uma base importante para colocar modelos em operação. Com esse fundamento, a organização pode concentrar energia em priorização, monitoramento e adoção, em vez de gastar os primeiros ciclos apenas desbloqueando fontes de dados.",
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
    insight: "O crescimento ainda parece depender de aumentar o quadro na mesma proporção, sinal de que há processos manuais ou pouco padronizados. Esse é um bom ponto para investigar automações de alto impacto, especialmente em tarefas repetitivas, triagem, atendimento, análise ou geração de documentos.",
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
    insight: "Sem histórico confiável, casos de uso preditivos, como previsão de demanda, churn ou precificação, ainda terão baixa sustentação. O foco inicial deve ser capturar, organizar e preservar histórico nas áreas críticas, para que a empresa crie uma base de aprendizado antes de depender de previsões automatizadas.",
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
    insight: "Anos de dados históricos confiáveis são um ativo importante para identificar padrões, testar hipóteses e construir modelos preditivos. Essa vantagem tende a ser difícil de copiar rapidamente, então vale transformar esse histórico em casos de uso mensuráveis antes que ele fique subutilizado.",
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
    insight: "Quando os dados chegam tarde, as decisões acabam voltando para intuição, mesmo que exista bastante informação armazenada. O problema parece menos relacionado à quantidade de dados e mais à velocidade de acesso, arquitetura e clareza sobre a fonte oficial de cada indicador.",
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
    insight: "Baixa confiança nos dados pode bloquear a adoção de IA mesmo quando a solução técnica funciona. Se as pessoas não confiam nos números de origem, tendem a ignorar recomendações automatizadas. O foco deve ser qualidade, rastreabilidade e transparência dos dados antes de escalar decisões orientadas por IA.",
  },
  {
    id: "dados-10",
    pillar: "dados",
    questionId: "dados_q6",
    trigger: "dados_q6 = 1 ou 2 (impacto alto ou muito alto de vazamento)",
    scoreCondition: "0 a 1.33/5",
    answerMatch: [eq("dados_q6", 1, 2)],
    priority: 1,
    type: "risco-critico",
    theme: "dados-seguranca",
    title: "Exposição de dados exige controle antes de escalar",
    insight: "Se um vazamento teria impacto financeiro, regulatório ou reputacional relevante, iniciativas de IA precisam nascer com controles de acesso, privacidade e revisão bem definidos. O risco não impede a adoção, mas muda a ordem das prioridades: governança e segurança devem vir antes de uso amplo de dados sensíveis.",
  },
  {
    id: "dados-11",
    pillar: "dados",
    questionId: "dados_q6",
    trigger: "dados_q6 = 4 (impacto mínimo de vazamento)",
    scoreCondition: "5/5",
    answerMatch: [eq("dados_q6", 4)],
    priority: 3,
    type: "forca-existente",
    theme: "dados-seguranca",
    title: "Baixa exposição facilita primeiros casos de uso",
    insight: "Quando o impacto provável de um vazamento é limitado, a empresa tem mais espaço para começar por casos de uso de menor risco. Ainda assim, é importante manter controles proporcionais, porque a exposição pode aumentar conforme novas fontes de dados e integrações entram no escopo.",
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
    insight: "Essa combinação indica alto risco organizacional: não há visão estratégica clara e a liderança ainda não compreende bem o valor econômico da IA. Um piloto técnico iniciado nesse contexto pode perder força por falta de prioridade executiva. O próximo passo deve ser alinhar tese de valor, objetivos de negócio e critérios de decisão antes de escolher uma solução.",
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
    title: "Governança estratégica bem definida",
    insight: "Visão, áreas priorizadas, roadmap documentado e revisão frequente formam uma base estratégica madura. A organização provavelmente já pode tratar IA como um portfólio de iniciativas, com critérios de prioridade, responsáveis e acompanhamento de valor, em vez de depender apenas de pilotos isolados.",
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
    insight: "A liderança já identificou onde a IA pode gerar retorno, mas isso ainda não virou um plano executável. Esse é um gap de tradução entre intenção e execução. O próximo passo é transformar as oportunidades em roadmap, com prioridades, responsáveis, dependências, métricas e horizonte de 12 a 24 meses.",
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
    insight: "Esse é um estágio comum de entrada: a empresa testa IA, mas ainda sem direção consistente. O próximo passo não precisa ser um programa amplo; tende a ser mais efetivo escolher um caso de uso bem delimitado, com métrica de sucesso clara, dono definido e critério objetivo para decidir se a iniciativa deve escalar.",
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
    insight: "Quando a IA já faz parte da proposta de valor, a prioridade muda de adoção para sustentação da vantagem. Isso exige proteger ativos de dados, acompanhar desempenho dos modelos, manter cadência de melhoria e garantir que a capacidade não dependa de iniciativas isoladas ou pessoas específicas.",
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
    insight: "Sem patrocínio executivo, projetos de IA tendem a ficar restritos a experimentos locais, mesmo quando a tecnologia funciona. Antes de ampliar o escopo, é importante definir quem será responsável por priorizar, remover bloqueios e defender o investimento com base em valor de negócio.",
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
    insight: "Patrocínio forte e visível reduz o risco organizacional de escalar IA. Com apoio executivo, a empresa tende a ter mais capacidade de priorizar recursos, resolver dependências entre áreas e sustentar iniciativas que exigem mudança de processo, não apenas desenvolvimento técnico.",
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
    insight: "Quando as iniciativas atrasam com frequência, o problema pode estar menos na estratégia e mais na capacidade de execução: disponibilidade técnica, dependências de dados, governança de aprovação ou escopo pouco claro. Vale identificar o gargalo dominante antes de iniciar novas frentes, para não acumular mais iniciativas paradas.",
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
    insight: "Experimentação contínua e medida, com critérios para escalar ou encerrar, indica uma boa disciplina de inovação. O próximo passo é garantir que os aprendizados virem ativos reutilizáveis: documentação, métricas, padrões técnicos e um caminho claro para levar experimentos bem-sucedidos à produção.",
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
    insight: "A ausência de capacidade interna em dados ou IA aumenta o risco de depender demais de fornecedores, ferramentas soltas ou iniciativas sem dono técnico. A empresa pode começar com apoio externo, mas precisa definir quem internamente será capaz de priorizar, validar resultados e absorver conhecimento ao longo do tempo.",
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
    insight: "Ter engenharia de dados sem capacidade de IA é uma posição melhor do que parece: a fundação já existe, mas ainda falta transformar dados em modelos, automações ou recomendações. O caminho mais eficiente tende a ser começar por casos de uso pequenos e formar capacidade interna enquanto os primeiros projetos avançam.",
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
    insight: "Ter capacidade interna tanto em IA preditiva quanto generativa abre caminhos complementares: modelos baseados em padrões, automações com linguagem natural, assistentes internos e melhorias em decisões operacionais. A prioridade passa a ser coordenação, reutilização e escolha dos casos de maior valor, não apenas aquisição de capacidade.",
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
    insight: "Resistência cultural pode comprometer projetos de IA mesmo quando a solução técnica é adequada. Isso sugere começar com casos de uso mais visíveis, de baixo atrito e com benefícios claros para os colaboradores, antes de propor mudanças amplas em processos ou ferramentas.",
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
    insight: "Alta receptividade reduz o risco de adoção lenta e aumenta a chance de aprendizado rápido. A organização pode ser um pouco mais ambiciosa no desenho dos pilotos, desde que mantenha métricas claras, comunicação transparente e suporte para as equipes afetadas.",
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
    insight: "Sem critérios claros para decidir quando IA é adequada, a organização pode priorizar casos de uso chamativos, mas pouco relevantes, ou ignorar oportunidades com alto impacto. Vale criar uma matriz simples de avaliação, combinando valor esperado, viabilidade de dados, risco, esforço e dependência operacional.",
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
    insight: "Sem capacitação formal, a adoção pode ficar atrás da implementação: ferramentas são disponibilizadas, mas o uso real permanece baixo. Iniciativas de IA devem incluir treinamento, comunicação, transferência de conhecimento e responsáveis internos, não apenas entregáveis técnicos.",
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
    insight: "É difícil automatizar de forma confiável um processo que não está documentado. A falta de clareza sobre etapas, exceções e responsáveis aumenta escopo, retrabalho e risco operacional. Antes de automatizar, vale mapear os processos críticos e identificar onde há variação real versus apenas falta de padronização.",
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
    insight: "Processos bem documentados reduzem bastante o risco de automação, porque etapas, entradas, saídas e exceções já estão explícitas. A empresa pode avaliar automações com mais precisão e estimar impacto com menos incerteza do que organizações que ainda precisam descobrir como o trabalho acontece.",
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
    insight: "A ausência de diretrizes, controles e responsáveis para riscos de IA cria exposição relevante, especialmente quando há dados sensíveis, decisões automatizadas ou ferramentas generativas. Governança de segurança e privacidade deve ser definida antes de qualquer uso em produção, para evitar que o controle venha apenas depois de um incidente.",
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
    insight: "Processos gerais de TI e segurança ajudam, mas podem não cobrir riscos específicos de IA, como exposição de dados em prompts, uso indevido de modelos, decisões sem revisão humana ou falta de rastreabilidade. Antes de escalar, vale adaptar controles existentes para o contexto de IA.",
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
    insight: "Governança específica para IA é uma vantagem importante, especialmente em setores regulados ou com dados sensíveis. Com responsabilidades e controles claros, a empresa pode avaliar casos de uso mais complexos com menos atrito, mantendo segurança, privacidade e supervisão como parte do desenho desde o início.",
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
    insight: "Ainda não ter projetos de IA pode ser uma vantagem se a empresa usar esse momento para desenhar bem a base. Sem legado técnico para contornar, o melhor caminho tende a ser um piloto único, bem delimitado e com duração curta, em vez de um programa amplo antes de validar dados, integrações e governança.",
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
    insight: "A empresa ainda não iniciou projetos de IA, mas já parece ter condições técnicas para conectar dados e sistemas. Isso sugere que a barreira principal pode ser prioridade, caso de uso ou patrocínio, não infraestrutura. Um piloto bem escolhido tende a começar mais rápido do que em organizações que ainda precisam preparar a base técnica.",
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
    insight: "Projetos de IA parados nem sempre indicam que a tecnologia falhou. Muitas vezes o problema está em dono indefinido, escopo amplo demais, dependências de dados ou falta de critério de sucesso. Antes de recomeçar do zero, vale diagnosticar o que travou e decidir se o projeto deve ser retomado, simplificado ou encerrado.",
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
    insight: "Rodar IA tradicional e generativa em paralelo pode ser saudável, mas aumenta a complexidade de integração, manutenção e governança. A empresa deve padronizar práticas de versionamento, monitoramento, documentação e responsabilidade operacional para evitar que cada novo projeto crie um modelo próprio de trabalho.",
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
    insight: "Projetos de IA desconectados dos sistemas centrais tendem a ficar restritos a poucos usuários e gerar pouco impacto operacional. A integração com ferramentas de trabalho, dados e fluxos de decisão é o que transforma uma prova de conceito em uma capacidade realmente usada pela empresa.",
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
    insight: "Construir soluções reutilizáveis desde o início reduz retrabalho e cria uma base para escalar além de projetos pontuais. A próxima evolução é formalizar padrões técnicos e operacionais, para que novos casos de uso aproveitem componentes, integrações e aprendizados já existentes.",
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
    insight: "Ter vários projetos sem cadência de atualização cria um risco silencioso: modelos podem perder precisão com o tempo, integrações podem quebrar e métricas podem piorar sem alerta claro. Antes de adicionar novas iniciativas, vale revisar saúde, responsáveis, monitoramento e frequência de manutenção do portfólio existente.",
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
    insight: "Um ecossistema de IA integrado indica que a organização já passou da fase de ferramentas isoladas. O próximo desafio é sustentar escala: governança de plataforma, padrões de integração, monitoramento, gestão de custos e critérios claros para adicionar novos casos de uso sem aumentar complexidade desnecessária.",
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
    insight: "Ter cinco ou mais projetos sem resultado mensurável é um sinal de alerta. Isso pode indicar que os critérios de sucesso não foram definidos antes da execução, ou que os resultados não estão sendo medidos de forma consistente. Antes de construir mais, a empresa deve revisar o impacto do que já existe e padronizar métricas de valor.",
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
    insight: "Com cinco ou mais projetos e arquitetura reutilizável, a empresa já se aproxima de uma capacidade de plataforma, não apenas de experimentação. A prioridade passa a ser sustentar escala: governança, monitoramento, documentação, gestão de custos e mecanismos para reaproveitar componentes entre áreas.",
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
    title: "Tecnologia merece leitura cuidadosa",
    insight: "A dimensão de Tecnologia costuma concentrar diferenças grandes entre empresas: algumas ainda estão preparando a base, enquanto outras já operam vários projetos. Por isso, a leitura deste pilar deve considerar não apenas quantidade de iniciativas, mas também integração, manutenção, mensuração de valor e capacidade de escalar sem retrabalho.",
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

const READINESS_SUMMARY_PT: Record<string, string> = {
  "Low Readiness": "que a empresa ainda está formando as bases necessárias para adotar IA de forma consistente",
  "Emerging Readiness": "que a empresa já começou a se preparar para IA, mas ainda possui lacunas relevantes antes de escalar",
  "Moderate Readiness": "que a empresa tem uma base razoável para pilotos e iniciativas seletivas, desde que fortaleça os pontos fracos",
  "High Readiness": "que a empresa está bem posicionada para implementar e escalar iniciativas selecionadas de IA",
  "Advanced Readiness": "que a empresa possui uma base forte para escalar e melhorar iniciativas de IA continuamente",
};

function lowerFirst(text: string) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function buildExecutiveSummary({
  answers,
  pillarScores,
  result,
  strongest,
  weakest,
  recommendation,
}: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  result: AssessmentResult;
  strongest: PillarScore;
  weakest: PillarScore;
  recommendation: string;
}): string[] {
  const levelMeaning = READINESS_SUMMARY_PT[result.level] ?? "que a leitura precisa ser feita a partir dos pilares abaixo";
  const insights = selectResultInsights(answers, pillarScores);
  const attention = insights.find(i => i.priority <= 2) ?? insights.find(i => i.pillar === weakest.id);
  const strength = insights.find(i => i.priority === 3);

  const paragraphOne = `A organização obteve ${result.score}/100, ${levelMeaning}. O pilar mais forte foi ${strongest.title} (${strongest.score}%), enquanto o principal ponto de atenção foi ${weakest.title} (${weakest.score}%). Essa combinação ajuda a separar o que já pode ser aproveitado do que precisa ser estabilizado antes de iniciativas mais amplas.`;

  const attentionSentence = attention
    ? `Entre os insights personalizados, o principal sinal de atenção é "${attention.title}", ligado ao pilar de ${PILLAR_LABEL[attention.pillar]}.`
    : `Entre os insights personalizados, o principal foco deve ser reduzir a lacuna em ${weakest.title}.`;
  const strengthSentence = strength
    ? `Ao mesmo tempo, "${strength.title}" aparece como uma força a preservar.`
    : "";
  const recommendationText = recommendation.endsWith(".") ? recommendation : `${recommendation}.`;
  const paragraphTwo = `${attentionSentence} ${strengthSentence} Como próximo passo, ${lowerFirst(recommendationText)}`.replace(/\s+/g, " ").trim();

  return [paragraphOne, paragraphTwo];
}
