import { Bilingual, DEFAULT_LANG, Lang, bi, pick } from "./i18n";

export type AnswerRecord = Record<string, number | number[] | string>;

export interface SingleOption {
  value: number;
  label: Bilingual;
  /** Secondary explanation shown under the label, smaller/lighter. */
  note?: Bilingual;
  score: number;
}

export interface MultiOption {
  value: number;
  label: Bilingual;
  /** Secondary explanation shown under the label, smaller/lighter. */
  note?: Bilingual;
  score: number;
  isNone?: boolean;
}

export interface ShowCondition {
  qId: string;
  values: number[];
}

interface BaseQuestion {
  id: string;
  pillar: string;
  text: Bilingual;
  showIf?: ShowCondition;
  /** Pillar this question's score should be counted under, if different from `pillar` (used for display placement). */
  scorePillar?: string;
}

export interface SingleQuestion extends BaseQuestion {
  type: "single";
  options: SingleOption[];
  riskFlag?: boolean;
}

export interface MultiQuestion extends BaseQuestion {
  type: "multi";
  options: MultiOption[];
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
  placeholder?: Bilingual;
}

export type Question = SingleQuestion | MultiQuestion | TextQuestion;

export interface Section {
  id: string;
  pillar: number;
  title: Bilingual;
  desc: Bilingual;
  questions: Question[];
}

export interface PillarConfig {
  id: string;
  title: Bilingual;
  weight: number;
}

export interface PillarScore {
  id: string;
  title: string;
  weight: number;
  score: number;
}

export interface AssessmentResult {
  score: number;
  level: string;
  blocker: string | null;
  /** Pillar id that triggered the blocker cap, when any. Optional for backward compatibility with hand-built fixtures. */
  blockerPillar?: string | null;
}

// Minimal structural shapes used by the flow/scoring helpers below. These
// intentionally exclude every bilingual text field (label/note/text/etc.) so
// the same logic works whether it's fed the canonical SECTIONS or a
// localized (plain-string) copy produced by getSections().
export interface FlowOption {
  value: number;
  score: number;
  isNone?: boolean;
}

export interface FlowQuestion {
  id: string;
  type: "single" | "multi" | "text";
  showIf?: ShowCondition;
  options?: FlowOption[];
}

export interface FlowSection {
  questions: FlowQuestion[];
}

// Localized (plain-string) mirrors of the bilingual types above, produced by
// getSections()/getAllQuestions() for rendering and generated-copy use.
export interface LocalizedOption {
  value: number;
  label: string;
  note?: string;
  score: number;
  isNone?: boolean;
}

interface LocalizedBaseQuestion {
  id: string;
  pillar: string;
  text: string;
  showIf?: ShowCondition;
  scorePillar?: string;
}

export interface LocalizedSingleQuestion extends LocalizedBaseQuestion {
  type: "single";
  options: LocalizedOption[];
  riskFlag?: boolean;
}

export interface LocalizedMultiQuestion extends LocalizedBaseQuestion {
  type: "multi";
  options: LocalizedOption[];
}

export interface LocalizedTextQuestion extends LocalizedBaseQuestion {
  type: "text";
  placeholder?: string;
}

export type LocalizedQuestion = LocalizedSingleQuestion | LocalizedMultiQuestion | LocalizedTextQuestion;

export interface LocalizedSection {
  id: string;
  pillar: number;
  title: string;
  desc: string;
  questions: LocalizedQuestion[];
}

export const SECTIONS: Section[] = [
  {
    id: "dados", pillar: 1,
    title: bi("Dados", "Data"),
    desc: bi(
      "Avalia a qualidade, acessibilidade e disponibilidade dos dados da organização para suportar iniciativas de IA.",
      "Assesses the quality, accessibility, and availability of the organization's data to support AI initiatives."
    ),
    questions: [
      {
        id: "dados_q1", pillar: "dados", type: "single",
        text: bi(
          "Os dados que a empresa coleta hoje são suficientes e relevantes para apoiar as decisões e iniciativas mais importantes do negócio?",
          "Is the data the company collects today sufficient and relevant to support the business's most important decisions and initiatives?"
        ),
        options: [
          { value: 1, label: bi("Sem clareza", "Not clear"), note: bi("A empresa não sabe claramente se os dados que coleta são suficientes ou relevantes para apoiar suas decisões mais importantes.", "The company doesn't clearly know whether the data it collects is sufficient or relevant to support its most important decisions."), score: 0 },
          { value: 2, label: bi("Dados parciais", "Partial data"), note: bi("A empresa coleta alguns dados relevantes, mas decisões importantes ainda são tomadas com informações incompletas, análises manuais ou suposições.", "The company collects some relevant data, but important decisions are still made with incomplete information, manual analysis, or assumptions."), score: 2.5 },
          { value: 3, label: bi("Dados suficientes", "Sufficient data"), note: bi("A empresa coleta dados claramente relevantes e suficientes para apoiar suas decisões e iniciativas mais importantes.", "The company collects data that is clearly relevant and sufficient to support its most important decisions and initiatives."), score: 5 },
        ],
      },
      {
        id: "dados_q2", pillar: "dados", type: "single",
        text: bi(
          "Quão acessíveis são os dados para as equipes ou sistemas que precisam deles?",
          "How accessible is the data for the teams or systems that need it?"
        ),
        options: [
          { value: 1, label: bi("Dados isolados", "Siloed data"), note: bi("Os dados estão armazenados em sistemas ou arquivos isolados, e as equipes não conseguem acessá-los facilmente sem apoio manual ou solicitações especiais.", "Data is stored in isolated systems or files, and teams can't easily access it without manual support or special requests."), score: 0 },
          { value: 2, label: bi("Acesso limitado", "Limited access"), note: bi("Alguns dados estão disponíveis, mas o acesso é lento, inconsistente ou depende de pessoas ou ferramentas específicas.", "Some data is available, but access is slow, inconsistent, or depends on specific people or tools."), score: 1.25 },
          { value: 3, label: bi("Acesso parcial", "Partial access"), note: bi("As principais equipes conseguem acessar parte dos dados de que precisam, mas informações importantes ainda estão fragmentadas ou são difíceis de usar.", "Key teams can access part of the data they need, but important information is still fragmented or hard to use."), score: 2.5 },
          { value: 4, label: bi("Acesso quase total", "Near-total access"), note: bi("A maioria dos dados relevantes está disponível para as equipes e sistemas certos, com apenas pequenas lacunas ou etapas manuais.", "Most relevant data is available to the right teams and systems, with only small gaps or manual steps."), score: 3.75 },
          { value: 5, label: bi("Acesso total", "Full access"), note: bi("Os dados estão facilmente disponíveis para equipes e sistemas autorizados.", "Data is easily available to authorized teams and systems."), score: 5 },
        ],
      },
      {
        id: "dados_q3", pillar: "dados", type: "single",
        text: bi(
          "É possível crescer a capacidade operacional sem necessariamente aumentar o quadro de pessoas na mesma proporção?",
          "Can operational capacity grow without necessarily increasing headcount at the same rate?"
        ),
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("A operação ainda depende diretamente de contratar mais pessoas para crescer.", "The operation still depends directly on hiring more people to grow."), score: 0 },
          { value: 2, label: bi("Depende da área", "Depends on the area"), note: bi("Em algumas áreas dá para crescer sem novas contratações, em outras não.", "Some areas can grow without new hires, others can't."), score: 2.5 },
          { value: 3, label: bi("Sim", "Yes"), note: bi("A empresa consegue ampliar a operação sem aumentar o quadro na mesma proporção.", "The company can expand the operation without increasing headcount at the same rate."), score: 5 },
        ],
      },
      {
        id: "dados_q4", pillar: "dados", type: "single",
        text: bi(
          "Em geral, até que ponto a organização possui dados históricos?",
          "In general, to what extent does the organization have historical data?"
        ),
        options: [
          { value: 1, label: bi("Sem histórico", "No history"), note: bi("Os dados não são armazenados, não são confiáveis ou existem apenas em arquivos e sistemas espalhados.", "Data isn't stored, isn't reliable, or only exists in scattered files and systems."), score: 0 },
          { value: 2, label: bi("Histórico recente", "Recent history"), note: bi("A organização possui dados utilizáveis dos últimos meses, mas não o suficiente para identificar padrões de longo prazo.", "The organization has usable data from the last few months, but not enough to identify long-term patterns."), score: 1.66 },
          { value: 3, label: bi("Histórico de 1 a 3 anos", "1 to 3 years of history"), note: bi("A organização possui de um a três anos de dados históricos utilizáveis para algumas áreas-chave do negócio.", "The organization has one to three years of usable historical data for some key areas of the business."), score: 3.33 },
          { value: 4, label: bi("Histórico consolidado", "Consolidated history"), note: bi("A organização possui vários anos de dados históricos confiáveis nas áreas mais importantes do negócio.", "The organization has several years of reliable historical data in the most important areas of the business."), score: 5 },
        ],
      },
      {
        id: "dados_q5", pillar: "dados", type: "single",
        text: bi(
          "Quando você precisa tomar uma decisão, consegue acessar os dados necessários na velocidade desejada?",
          "When you need to make a decision, can you access the data you need at the speed you want?"
        ),
        options: [
          { value: 1, label: bi("Raramente", "Rarely"), note: bi("Os dados quase nunca chegam na velocidade necessária para apoiar a decisão.", "Data almost never arrives fast enough to support the decision."), score: 0 },
          { value: 2, label: bi("Às vezes", "Sometimes"), note: bi("Em algumas situações os dados chegam a tempo, mas não na maioria delas.", "In some situations data arrives on time, but not in most of them."), score: 2.33 },
          { value: 3, label: bi("Na maioria das vezes", "Most of the time"), note: bi("Os dados chegam a tempo na maior parte das decisões.", "Data arrives on time for most decisions."), score: 4.66 },
          { value: 4, label: bi("Sim, sempre", "Yes, always"), note: bi("Os dados estão sempre disponíveis na velocidade desejada.", "Data is always available at the speed you want."), score: 7 },
        ],
      },
      {
        id: "dados_q6", pillar: "dados", type: "single",
        riskFlag: true,
        text: bi(
          "Qual seria o impacto provável de um vazamento de dados na empresa?",
          "What would be the likely impact of a data leak at the company?"
        ),
        options: [
          // TODO: a nova versão do questionário não trouxe pontuação para esta pergunta; pontuação existente preservada.
          { value: 1, label: bi("Impacto crítico", "Critical impact"), note: bi("Um vazamento poderia interromper gravemente o negócio, gerar grande exposição regulatória, prejudicar a confiança dos clientes e causar danos financeiros ou reputacionais de longo prazo.", "A leak could seriously disrupt the business, create major regulatory exposure, damage customer trust, and cause long-term financial or reputational harm."), score: 0 },
          { value: 2, label: bi("Impacto significativo", "Significant impact"), note: bi("Um vazamento poderia expor dados sensíveis do negócio, de clientes ou de colaboradores, gerando consequências financeiras, legais ou reputacionais significativas.", "A leak could expose sensitive business, customer, or employee data, leading to significant financial, legal, or reputational consequences."), score: 1.33 },
          { value: 3, label: bi("Impacto moderado", "Moderate impact"), note: bi("Um vazamento poderia afetar operações internas, a confiança dos clientes ou obrigações de compliance, mas provavelmente seria gerenciável.", "A leak could affect internal operations, customer trust, or compliance obligations, but would likely be manageable."), score: 2.66 },
          { value: 4, label: bi("Impacto mínimo", "Minimal impact"), note: bi("Um vazamento afetaria informações não críticas e causaria impacto operacional, financeiro ou reputacional mínimo.", "A leak would affect non-critical information and cause minimal operational, financial, or reputational impact."), score: 5 },
        ],
      },
      {
        id: "dados_q7", pillar: "dados", type: "single",
        text: bi(
          "Quão confortável você se sente em tomar decisões com base nos dados fornecidos pela empresa?",
          "How comfortable do you feel making decisions based on the data the company provides?"
        ),
        options: [
          { value: 1, label: bi("Nada confortável", "Not comfortable at all"), note: bi("Você não confia nos dados para embasar suas decisões.", "You don't trust the data to inform your decisions."), score: 0 },
          { value: 2, label: bi("Hesitante", "Hesitant"), note: bi("Você usa os dados disponíveis, mas com bastante insegurança.", "You use the available data, but with a lot of uncertainty."), score: 1 },
          { value: 3, label: bi("Um pouco confortável", "Somewhat comfortable"), note: bi("Você confia parcialmente nos dados disponíveis.", "You partially trust the available data."), score: 2 },
          { value: 4, label: bi("Confortável", "Comfortable"), note: bi("Você confia na maior parte das vezes nos dados disponíveis.", "You trust the available data most of the time."), score: 3 },
          { value: 5, label: bi("Muito confortável", "Very comfortable"), note: bi("Você confia totalmente nos dados para tomar decisões.", "You fully trust the data to make decisions."), score: 4 },
        ],
      },
      {
        id: "dados_q8", pillar: "dados", type: "single",
        text: bi(
          "A organização já possui um data lake ou data warehouse estruturado?",
          "Does the organization already have a structured data lake or data warehouse?"
        ),
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("A organização ainda não possui um data lake ou data warehouse estruturado.", "The organization doesn't yet have a structured data lake or data warehouse."), score: 0 },
          { value: 2, label: bi("Sim", "Yes"), note: bi("A organização já possui um data lake ou data warehouse estruturado.", "The organization already has a structured data lake or data warehouse."), score: 0 },
        ],
      },
      {
        id: "dados_q9", pillar: "dados", type: "single",
        text: bi(
          "Esses dados já estão organizados em data marts prontos para consumo pelas áreas de negócio?",
          "Is that data already organized into data marts ready for consumption by business teams?"
        ),
        showIf: { qId: "dados_q8", values: [2] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Os dados ainda não estão organizados em data marts para consumo direto das áreas de negócio.", "The data isn't yet organized into data marts for direct consumption by business teams."), score: 0 },
          { value: 2, label: bi("Sim", "Yes"), note: bi("Os dados já estão organizados em data marts prontos para consumo pelas áreas de negócio.", "The data is already organized into data marts ready for consumption by business teams."), score: 0 },
        ],
      },
    ],
  },
  {
    id: "estrategia", pillar: 2,
    title: bi("Estratégia", "Strategy"),
    desc: bi(
      "Avalia como a IA está posicionada dentro da visão, prioridades de liderança e objetivos estratégicos da organização.",
      "Assesses how AI is positioned within the organization's vision, leadership priorities, and strategic goals."
    ),
    questions: [
      {
        id: "est_q1", pillar: "estrategia", type: "single",
        text: bi(
          "A organização definiu uma visão clara de como a IA pode gerar valor para o negócio?",
          "Has the organization defined a clear vision of how AI can generate value for the business?"
        ),
        options: [
          { value: 3, label: bi("Não", "No"), note: bi("A liderança ainda não definiu uma visão clara de como a IA pode gerar valor para o negócio.", "Leadership hasn't yet defined a clear vision of how AI can generate value for the business."), score: 0 },
          { value: 2, label: bi("Parcialmente", "Partially"), note: bi("Existe uma visão inicial de como a IA pode gerar valor, mas ainda não está totalmente clara.", "There's an initial vision of how AI can generate value, but it's not yet fully clear."), score: 1 },
          { value: 1, label: bi("Sim", "Yes"), note: bi("A liderança já definiu com clareza como a IA pode gerar valor para o negócio.", "Leadership has clearly defined how AI can generate value for the business."), score: 3 },
        ],
      },
      {
        id: "est_q1a", pillar: "estrategia", type: "single",
        text: bi(
          "A liderança já mapeou quais áreas e processos têm maior potencial de retorno com IA?",
          "Has leadership already mapped which areas and processes have the greatest return potential with AI?"
        ),
        showIf: { qId: "est_q1", values: [1] },
        options: [
          { value: 2, label: bi("Não", "No"), note: bi("A liderança ainda não mapeou quais áreas têm maior potencial de retorno com IA.", "Leadership hasn't yet mapped which areas have the greatest return potential with AI."), score: 0 },
          { value: 1, label: bi("Sim", "Yes"), note: bi("A liderança já mapeou as áreas e processos com maior potencial de retorno com IA.", "Leadership has already mapped the areas and processes with the greatest return potential with AI."), score: 2 },
        ],
      },
      {
        id: "est_q1a1", pillar: "estrategia", type: "single",
        text: bi(
          "Existe um roadmap de IA documentado para os próximos 12 a 24 meses?",
          "Is there a documented AI roadmap for the next 12 to 24 months?"
        ),
        showIf: { qId: "est_q1a", values: [1] },
        options: [
          { value: 2, label: bi("Não", "No"), note: bi("Não existe um roadmap de IA documentado para os próximos 12 a 24 meses.", "There is no documented AI roadmap for the next 12 to 24 months."), score: 0 },
          { value: 1, label: bi("Sim", "Yes"), note: bi("Existe um roadmap de IA documentado para os próximos 12 a 24 meses.", "There is a documented AI roadmap for the next 12 to 24 months."), score: 2.5 },
        ],
      },
      {
        id: "est_q1a1a", pillar: "estrategia", type: "single",
        text: bi(
          "Com que frequência esse roadmap é revisado e atualizado?",
          "How often is that roadmap reviewed and updated?"
        ),
        showIf: { qId: "est_q1a1", values: [1] },
        options: [
          { value: 1, label: bi("Nunca", "Never"), note: bi("O roadmap nunca é revisado depois de criado.", "The roadmap is never reviewed after it's created."), score: 0 },
          { value: 2, label: bi("Anualmente", "Annually"), note: bi("O roadmap é revisado uma vez por ano.", "The roadmap is reviewed once a year."), score: 0.33 },
          { value: 3, label: bi("Trimestralmente", "Quarterly"), note: bi("O roadmap é revisado a cada trimestre.", "The roadmap is reviewed every quarter."), score: 0.67 },
          { value: 4, label: bi("Mensalmente ou mais", "Monthly or more"), note: bi("O roadmap é revisado mensalmente ou com frequência ainda maior.", "The roadmap is reviewed monthly or even more often."), score: 1 },
        ],
      },
      {
        id: "est_q1b", pillar: "estrategia", type: "single",
        text: bi(
          "A liderança conhece o potencial ou valor econômico da IA?",
          "Is leadership aware of the potential or economic value of AI?"
        ),
        showIf: { qId: "est_q1", values: [2, 3] },
        options: [
          { value: 3, label: bi("Não", "No"), note: bi("A liderança não entende o potencial ou o valor econômico da IA.", "Leadership doesn't understand the potential or economic value of AI."), score: 0 },
          { value: 2, label: bi("Parcialmente", "Partially"), note: bi("A liderança tem uma noção limitada do valor econômico da IA.", "Leadership has a limited sense of AI's economic value."), score: 0.5 },
          { value: 1, label: bi("Sim", "Yes"), note: bi("A liderança entende o potencial e o valor econômico da IA.", "Leadership understands the potential and economic value of AI."), score: 1 },
        ],
      },
      {
        id: "est_q2", pillar: "estrategia", type: "single",
        text: bi(
          "Como a IA é vista hoje dentro da organização?",
          "How is AI viewed today within the organization?"
        ),
        options: [
          { value: 1, label: bi("Experimentação", "Experimentation"), note: bi("A empresa testa IA de forma pontual ou isolada, sem uma estratégia definida, responsáveis claros ou métricas consistentes para medir resultados.", "The company tests AI on an ad hoc or isolated basis, without a defined strategy, clear owners, or consistent metrics to measure results."), score: 0 },
          { value: 2, label: bi("Melhoria de produtividade", "Productivity improvement"), note: bi("A empresa usa IA para fazer o que já faz com mais velocidade e menos custo, sem mudar a forma como o negócio funciona.", "The company uses AI to do what it already does faster and at lower cost, without changing how the business works."), score: 2.33 },
          { value: 3, label: bi("Transformação do negócio", "Business transformation"), note: bi("A empresa usa IA para mudar a forma como opera, decide ou entrega valor, não apenas para otimizar, mas para fazer diferente.", "The company uses AI to change how it operates, decides, or delivers value, not just to optimize, but to do things differently."), score: 4.66 },
          { value: 4, label: bi("Vantagem competitiva central", "Core competitive advantage"), note: bi("IA é parte estrutural da proposta de valor da empresa, um ativo estratégico que a diferencia de forma que concorrentes sem essa capacidade dificilmente conseguem replicar.", "AI is a structural part of the company's value proposition, a strategic asset that sets it apart in a way competitors without that capability can hardly replicate."), score: 7 },
        ],
      },
      {
        id: "est_q3", pillar: "estrategia", type: "single",
        text: bi(
          "Os executivos patrocinam ativamente as iniciativas de IA?",
          "Do executives actively sponsor AI initiatives?"
        ),
        options: [
          { value: 1, label: bi("De forma nenhuma", "Not at all"), note: bi("Os executivos não patrocinam as iniciativas de IA.", "Executives don't sponsor AI initiatives."), score: 0 },
          { value: 2, label: bi("Raramente", "Rarely"), note: bi("Os executivos raramente se envolvem no patrocínio das iniciativas de IA.", "Executives rarely get involved in sponsoring AI initiatives."), score: 1.75 },
          { value: 3, label: bi("Às vezes", "Sometimes"), note: bi("Os executivos apoiam as iniciativas de IA apenas em algumas ocasiões.", "Executives support AI initiatives only on some occasions."), score: 3.5 },
          { value: 4, label: bi("Regularmente", "Regularly"), note: bi("Os executivos patrocinam as iniciativas de IA de forma regular.", "Executives regularly sponsor AI initiatives."), score: 5.25 },
          { value: 5, label: bi("De forma consistente e visível", "Consistently and visibly"), note: bi("Os executivos patrocinam as iniciativas de IA de forma consistente e visível para toda a empresa.", "Executives sponsor AI initiatives consistently and visibly for the whole company."), score: 7 },
        ],
      },
      {
        id: "est_q3a", pillar: "estrategia", type: "single",
        scorePillar: "governanca",
        text: bi(
          "Com que frequência as iniciativas de IA sofrem atrasos?",
          "How often do AI initiatives suffer delays?"
        ),
        showIf: { qId: "est_q3", values: [1, 2, 3, 4, 5] },
        options: [
          { value: 1, label: bi("Quase sempre", "Almost always"), note: bi("As iniciativas de IA quase sempre sofrem atrasos.", "AI initiatives almost always suffer delays."), score: 0 },
          { value: 2, label: bi("Frequentemente", "Frequently"), note: bi("As iniciativas de IA sofrem atrasos com frequência.", "AI initiatives suffer delays frequently."), score: 1.33 },
          { value: 3, label: bi("Ocasionalmente", "Occasionally"), note: bi("As iniciativas de IA sofrem atrasos ocasionalmente.", "AI initiatives suffer delays occasionally."), score: 2.66 },
          { value: 4, label: bi("Raramente", "Rarely"), note: bi("As iniciativas de IA raramente sofrem atrasos.", "AI initiatives rarely suffer delays."), score: 4 },
        ],
      },
      {
        id: "est_q3a1", pillar: "estrategia", type: "text",
        scorePillar: "governanca",
        text: bi(
          "Qual você diria que é o principal motivo desses atrasos?",
          "What would you say is the main reason for these delays?"
        ),
        showIf: { qId: "est_q3a", values: [1, 2, 3] },
        placeholder: bi("Descreva o principal motivo dos atrasos...", "Describe the main reason for the delays..."),
      },
      {
        id: "pess_q1", pillar: "estrategia", type: "single",
        text: bi(
          "A liderança comunica expectativas claras sobre a adoção de IA e os resultados esperados?",
          "Does leadership communicate clear expectations about AI adoption and expected results?"
        ),
        options: [
          { value: 1, label: bi("Não há comunicação", "No communication"), note: bi("A liderança não comunica nada sobre a adoção de IA ou os resultados esperados.", "Leadership doesn't communicate anything about AI adoption or expected results."), score: 0 },
          { value: 2, label: bi("Comunicação inconsistente", "Inconsistent communication"), note: bi("A liderança comunica de forma esporádica e sem padrão.", "Leadership communicates sporadically and without a consistent pattern."), score: 0.5 },
          { value: 3, label: bi("Um pouco clara", "Somewhat clear"), note: bi("A comunicação existe, mas ainda deixa dúvidas sobre expectativas e resultados.", "Communication exists, but it still leaves doubts about expectations and results."), score: 1 },
          { value: 4, label: bi("Em grande parte clara", "Mostly clear"), note: bi("A comunicação é clara na maior parte do tempo, com poucas lacunas.", "Communication is clear most of the time, with few gaps."), score: 1.5 },
          { value: 5, label: bi("Clara e regular", "Clear and regular"), note: bi("A liderança comunica expectativas e resultados de forma clara e constante.", "Leadership communicates expectations and results clearly and consistently."), score: 2 },
        ],
      },
      {
        id: "pess_q2", pillar: "estrategia", type: "single",
        text: bi(
          "Com que frequência as equipes experimentam novas capacidades de IA?",
          "How often do teams experiment with new AI capabilities?"
        ),
        options: [
          { value: 1, label: bi("Nunca", "Never"), note: bi("As equipes nunca experimentam novas capacidades de IA.", "Teams never experiment with new AI capabilities."), score: 0 },
          { value: 2, label: bi("Raramente", "Rarely"), note: bi("As equipes raramente experimentam novas capacidades de IA.", "Teams rarely experiment with new AI capabilities."), score: 0.625 },
          { value: 3, label: bi("Ocasionalmente", "Occasionally"), note: bi("As equipes experimentam novas capacidades de IA de vez em quando.", "Teams experiment with new AI capabilities from time to time."), score: 1.25 },
          { value: 4, label: bi("Frequentemente", "Frequently"), note: bi("As equipes experimentam novas capacidades de IA com frequência.", "Teams experiment with new AI capabilities frequently."), score: 1.875 },
          // TODO: a nova versão do questionário mostra (+2.6) aqui, mas o subtotal do bloco (3.5) só fecha com 2.5; pontuação existente preservada.
          { value: 5, label: bi("Continuamente", "Continuously"), note: bi("As equipes experimentam novas capacidades de IA de forma contínua.", "Teams continuously experiment with new AI capabilities."), score: 2.5 },
        ],
      },
      {
        id: "pess_q2a", pillar: "estrategia", type: "single",
        text: bi(
          "Como a organização atualmente testa e avalia novas capacidades de IA?",
          "How does the organization currently test and evaluate new AI capabilities?"
        ),
        showIf: { qId: "pess_q2", values: [1, 2, 3, 4, 5] },
        options: [
          { value: 1, label: bi("Sem testes", "No testing"), note: bi("A organização não está testando ativamente capacidades de IA nem explorando casos de uso.", "The organization isn't actively testing AI capabilities or exploring use cases."), score: 0.25 },
          { value: 2, label: bi("Testes informais", "Informal testing"), note: bi("Algumas pessoas ou equipes experimentam ferramentas de IA por conta própria, mas não há processo formal, responsável definido ou aprendizado compartilhado.", "Some people or teams experiment with AI tools on their own, but there's no formal process, defined owner, or shared learning."), score: 0.5 },
          { value: 3, label: bi("Pilotos ocasionais", "Occasional pilots"), note: bi("A organização realiza pilotos ocasionais de IA ligados a problemas específicos do negócio, mas os resultados nem sempre são medidos ou escalados.", "The organization runs occasional AI pilots tied to specific business problems, but results aren't always measured or scaled."), score: 0.75 },
          { value: 4, label: bi("Processo estruturado", "Structured process"), note: bi("Os experimentos de IA são priorizados, medidos, revisados e conectados a objetivos claros de negócio, com um processo para decidir o que escalar, melhorar ou interromper.", "AI experiments are prioritized, measured, reviewed, and tied to clear business goals, with a process for deciding what to scale, improve, or stop."), score: 1 },
        ],
      },
    ],
  },
  {
    id: "pessoas", pillar: 3,
    title: bi("Pessoas e Cultura", "People and Culture"),
    desc: bi(
      "Avalia a prontidão das equipes, disponibilidade de habilidades e capacidade de colaboração para adoção de IA.",
      "Assesses team readiness, skill availability, and collaboration capacity for AI adoption."
    ),
    questions: [
      {
        id: "pess_q3", pillar: "pessoas", type: "multi",
        text: bi(
          "Em quais das seguintes áreas a organização possui expertise interna? Selecione todas as opções aplicáveis.",
          "In which of the following areas does the organization have in-house expertise? Select all that apply."
        ),
        options: [
          { value: 1, label: bi("Engenharia de Dados", "Data Engineering"), note: bi("Responsável por coletar, organizar e garantir a qualidade dos dados da empresa, é a base sem a qual nenhuma solução de IA funciona bem.", "Responsible for collecting, organizing, and ensuring the quality of the company's data, it's the foundation without which no AI solution works well."), score: 0.9 },
          { value: 2, label: bi("Engenharia de IA generativa", "Generative AI Engineering"), note: bi("Responsável por construir soluções que geram conteúdo, respondem perguntas e automatizam comunicação, como assistentes virtuais, resumos automáticos e geração de texto ou imagem.", "Responsible for building solutions that generate content, answer questions, and automate communication, such as virtual assistants, automatic summaries, and text or image generation."), score: 0.7 },
          { value: 3, label: bi("Engenharia de IA tradicional", "Traditional AI Engineering"), note: bi("Responsável por criar modelos que aprendem com dados históricos para prever comportamentos, detectar padrões e automatizar decisões complexas.", "Responsible for building models that learn from historical data to predict behavior, detect patterns, and automate complex decisions."), score: 0.7 },
          { value: 4, label: bi("Engenharia de Cloud / Segurança", "Cloud / Security Engineering"), note: bi("Responsável por garantir a infraestrutura, a escalabilidade e a segurança dos sistemas que sustentam as soluções de IA, incluindo proteção de dados e conformidade.", "Responsible for ensuring the infrastructure, scalability, and security of the systems that support AI solutions, including data protection and compliance."), score: 0.7 },
          { value: 5, label: bi("Nenhuma das anteriores", "None of the above"), note: bi("A organização não possui expertise interna em nenhuma dessas áreas.", "The organization has no in-house expertise in any of these areas."), score: 0, isNone: true },
        ],
      },
      {
        id: "pess_q4", pillar: "pessoas", type: "single",
        text: bi(
          "Quão receptivos são os colaboradores a mudanças em processos e tecnologias?",
          "How receptive are employees to changes in processes and technologies?"
        ),
        options: [
          { value: 1, label: bi("Resistentes", "Resistant"), note: bi("Os colaboradores resistem ativamente a mudanças em processos e tecnologias.", "Employees actively resist changes in processes and technologies."), score: 0 },
          { value: 2, label: bi("Em sua maioria resistentes", "Mostly resistant"), note: bi("A maior parte dos colaboradores tende a resistir a mudanças.", "Most employees tend to resist changes."), score: 0.5 },
          { value: 3, label: bi("Parcialmente receptivos", "Partially receptive"), note: bi("Os colaboradores aceitam mudanças, mas com alguma resistência.", "Employees accept changes, but with some resistance."), score: 1 },
          { value: 4, label: bi("Geralmente receptivos", "Generally receptive"), note: bi("A maior parte dos colaboradores aceita bem as mudanças.", "Most employees accept changes well."), score: 1.5 },
          { value: 5, label: bi("Altamente receptivos", "Highly receptive"), note: bi("Os colaboradores abraçam mudanças em processos e tecnologias com facilidade.", "Employees embrace changes in processes and technologies with ease."), score: 2 },
        ],
      },
      {
        id: "pess_q5", pillar: "pessoas", type: "single",
        text: bi(
          "A organização aplica critérios claros para determinar quando a IA é, ou não é, a solução certa para um problema?",
          "Does the organization apply clear criteria to determine when AI is, or isn't, the right solution for a problem?"
        ),
        options: [
          { value: 1, label: bi("Sem conhecimento", "No knowledge"), note: bi("Não há conhecimento suficiente para avaliar se IA é a ferramenta adequada.", "There isn't enough knowledge to assess whether AI is the right tool."), score: 0 },
          { value: 2, label: bi("Benchmark de mercado", "Market benchmarking"), note: bi("A organização avalia casos do mercado e incorpora aprendizados de empresas que já implementaram soluções semelhantes.", "The organization evaluates market cases and incorporates learnings from companies that have already implemented similar solutions."), score: 0.75 },
          { value: 3, label: bi("Avaliação técnica", "Technical evaluation"), note: bi("A organização possui entendimento técnico dessas soluções e avalia adequadamente se a equipe tem capacidade para entregá-las.", "The organization has technical understanding of these solutions and properly assesses whether the team has the capacity to deliver them."), score: 1.25 },
          { value: 4, label: bi("Avaliação completa", "Full evaluation"), note: bi("A organização realiza uma avaliação completa, incluindo plano de negócio, ROI, análise de requisitos e critérios de sucesso.", "The organization runs a full evaluation, including a business plan, ROI, requirements analysis, and success criteria."), score: 2 },
        ],
      },
      {
        id: "pess_q5a", pillar: "pessoas", type: "single",
        text: bi(
          "A organização possui um processo claro para priorizar iniciativas de IA?",
          "Does the organization have a clear process for prioritizing AI initiatives?"
        ),
        showIf: { qId: "pess_q5", values: [1, 2, 3, 4] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Não existe um processo para priorizar iniciativas de IA.", "There is no process for prioritizing AI initiatives."), score: 0 },
          { value: 2, label: bi("Informal", "Informal"), note: bi("Existe uma priorização, mas sem um processo formalizado.", "There is some prioritization, but without a formal process."), score: 1 },
          { value: 3, label: bi("Formal", "Formal"), note: bi("Existe um processo formal e estruturado para priorizar iniciativas de IA.", "There is a formal, structured process for prioritizing AI initiatives."), score: 2 },
        ],
      },
      {
        id: "pess_q6", pillar: "pessoas", type: "single",
        text: bi(
          "A empresa está investindo ativamente em preparar seus colaboradores para entender e trabalhar com IA, seja por meio de treinamentos, programas internos ou contratação de profissionais especializados?",
          "Is the company actively investing in preparing its employees to understand and work with AI, whether through training, internal programs, or hiring specialized professionals?"
        ),
        options: [
          { value: 1, label: bi("Sem programas", "No programs"), note: bi("Não existem programas formais de treinamento em IA, iniciativas internas ou contratações especializadas em IA.", "There are no formal AI training programs, internal initiatives, or specialized AI hires."), score: 0 },
          { value: 2, label: bi("Treinamento informal", "Informal training"), note: bi("Alguns colaboradores estão experimentando ferramentas de IA, mas o treinamento e o suporte são majoritariamente informais ou opcionais.", "Some employees are experimenting with AI tools, but training and support are mostly informal or optional."), score: 0.83 },
          { value: 3, label: bi("Treinamento estruturado", "Structured training"), note: bi("A empresa oferece treinamentos em IA, programas internos ou está contratando especialistas para desenvolver capacidade em IA.", "The company offers AI training, internal programs, or is hiring specialists to build AI capability."), score: 1.67 },
          { value: 4, label: bi("Estratégia formal de capacitação", "Formal upskilling strategy"), note: bi("A capacitação em IA faz parte de uma estratégia formal de desenvolvimento da força de trabalho, com orçamento dedicado, apoio da liderança e metas mensuráveis de adoção.", "AI upskilling is part of a formal workforce development strategy, with dedicated budget, leadership support, and measurable adoption goals."), score: 2.5 },
        ],
      },
    ],
  },
  {
    id: "governanca", pillar: 4,
    title: bi("Governança e Processo", "Governance and Process"),
    desc: bi(
      "Avalia os frameworks da organização para gerenciar iniciativas de IA de forma responsável e com clara responsabilização.",
      "Assesses the organization's frameworks for managing AI initiatives responsibly and with clear accountability."
    ),
    questions: [
      {
        id: "gov_q1", pillar: "governanca", type: "single",
        text: bi(
          "Quão bem os processos críticos de negócio estão documentados?",
          "How well are critical business processes documented?"
        ),
        options: [
          { value: 1, label: bi("Não documentados", "Not documented"), note: bi("Os processos críticos do negócio não estão documentados.", "Critical business processes aren't documented."), score: 0 },
          { value: 2, label: bi("Parcialmente documentados", "Partially documented"), note: bi("Apenas uma parte dos processos críticos está documentada.", "Only part of the critical processes is documented."), score: 1.67 },
          { value: 3, label: bi("Em sua maioria documentados", "Mostly documented"), note: bi("A maior parte dos processos críticos já está documentada.", "Most critical processes are already documented."), score: 3.33 },
          { value: 4, label: bi("Totalmente documentados", "Fully documented"), note: bi("Todos os processos críticos do negócio estão documentados.", "All critical business processes are documented."), score: 5 },
        ],
      },
      {
        id: "gov_q2", pillar: "governanca", type: "single",
        text: bi(
          "A empresa possui diretrizes claras sobre como gerenciar os riscos de segurança e privacidade específicos de iniciativas de IA, como uso indevido de dados, vazamentos ou decisões automatizadas sem supervisão?",
          "Does the company have clear guidelines for managing the security and privacy risks specific to AI initiatives, such as data misuse, leaks, or unsupervised automated decisions?"
        ),
        options: [
          { value: 1, label: bi("Sem diretrizes", "No guidelines"), note: bi("Não existem diretrizes, controles ou responsáveis definidos para gerenciar riscos de segurança relacionados à IA.", "There are no guidelines, controls, or defined owners for managing AI-related security risks."), score: 0 },
          { value: 2, label: bi("Abordagem genérica", "Generic approach"), note: bi("Os riscos de segurança de IA são tratados pelos processos existentes de TI e segurança, mas não há uma abordagem específica para IA.", "AI security risks are handled by existing IT and security processes, but there's no AI-specific approach."), score: 3 },
          { value: 3, label: bi("Governança específica para IA", "AI-specific governance"), note: bi("Responsabilidades, controles e processos de revisão de segurança estão claramente definidos e adaptados aos riscos específicos da IA.", "Responsibilities, controls, and security review processes are clearly defined and adapted to AI-specific risks."), score: 6 },
        ],
      },
    ],
  },
  {
    id: "tecnologia", pillar: 5,
    title: bi("Tecnologia", "Technology"),
    desc: bi(
      "Avalia as capacidades técnicas da organização para construir, implantar, monitorar e integrar soluções de IA.",
      "Assesses the organization's technical capabilities to build, deploy, monitor, and integrate AI solutions."
    ),
    questions: [
      {
        id: "tec_q1", pillar: "tecnologia", type: "single",
        text: bi(
          "Quantos projetos de IA já foram/estão sendo executados na empresa?",
          "How many AI projects has the company already run or is currently running?"
        ),
        options: [
          { value: 1, label: bi("Ainda não existem projetos de IA", "There are no AI projects yet"), note: bi("A empresa ainda não executou nenhum projeto de IA.", "The company hasn't run any AI project yet."), score: 0 },
          { value: 2, label: bi("1 a 4", "1 to 4"), note: bi("A empresa já executou ou está executando entre 1 e 4 projetos de IA.", "The company has run or is running between 1 and 4 AI projects."), score: 2 },
          { value: 3, label: bi("5 ou mais", "5 or more"), note: bi("A empresa já executou ou está executando 5 ou mais projetos de IA.", "The company has run or is running 5 or more AI projects."), score: 4 },
        ],
      },
      // Branch: no projects yet
      {
        id: "tec_q1b", pillar: "tecnologia", type: "single",
        text: bi(
          "Se uma oportunidade de IA fosse priorizada hoje, a empresa conseguiria conectar os dados/sistemas necessários e lançar um primeiro piloto técnico em prazo razoável?",
          "If an AI opportunity were prioritized today, could the company connect the necessary data/systems and launch a first technical pilot within a reasonable time?"
        ),
        showIf: { qId: "tec_q1", values: [1] },
        options: [
          { value: 1, label: bi("Do zero", "From scratch"), note: bi("Não, seria necessário começar praticamente do zero, incluindo dados, integrações, equipe e aprovações.", "No, it would be necessary to start almost from scratch, including data, integrations, team, and approvals."), score: 0 },
          { value: 2, label: bi("Início parcial", "Partial start"), note: bi("Parcialmente, seria possível iniciar, mas ainda haveria dependências importantes de dados, integrações, equipe técnica ou aprovações.", "Partially, it would be possible to start, but there would still be important dependencies on data, integrations, technical team, or approvals."), score: 1.75 },
          { value: 3, label: bi("Pronta para começar", "Ready to start"), note: bi("Sim, a empresa conseguiria conectar os dados/sistemas necessários e iniciar um piloto técnico com os recursos atuais.", "Yes, the company could connect the necessary data/systems and start a technical pilot with current resources."), score: 3.5 },
        ],
      },
      // Branch: 1 a 4 projects
      {
        id: "tec_q1c", pillar: "tecnologia", type: "single",
        text: bi(
          "A maioria desses projetos está em desenvolvimento ativo, em manutenção ou parada?",
          "Are most of these projects in active development, in maintenance, or stalled?"
        ),
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: bi("Parados", "Stalled"), note: bi("Os projetos de IA existentes estão parados.", "Existing AI projects are stalled."), score: 0 },
          { value: 2, label: bi("Manutenção", "Maintenance"), note: bi("Os projetos estão apenas em manutenção, sem evolução ativa.", "The projects are only in maintenance, with no active development."), score: 1 },
          { value: 3, label: bi("Desenvolvimento ativo", "Active development"), note: bi("Os projetos estão em desenvolvimento ativo.", "The projects are in active development."), score: 2 },
        ],
      },
      {
        id: "tec_q1d", pillar: "tecnologia", type: "single",
        text: bi(
          "Os projetos existentes são baseados em IA tradicional, LLMs/IA generativa ou uma combinação dos dois?",
          "Are the existing projects based on traditional AI, LLMs/generative AI, or a combination of both?"
        ),
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: bi("Não sei", "Don't know"), note: bi("Não há clareza sobre que tipo de IA os projetos utilizam.", "There's no clarity about what type of AI the projects use."), score: 0 },
          { value: 2, label: bi("Apenas IA tradicional", "Traditional AI only"), note: bi("Os projetos usam apenas IA tradicional, com modelos preditivos.", "The projects use only traditional AI, with predictive models."), score: 1 },
          { value: 3, label: bi("Apenas LLM / IA generativa", "LLM / generative AI only"), note: bi("Os projetos usam apenas IA generativa ou LLMs.", "The projects use only generative AI or LLMs."), score: 1 },
          { value: 4, label: bi("Misto", "Mixed"), note: bi("Os projetos combinam IA tradicional e IA generativa.", "The projects combine traditional AI and generative AI."), score: 2 },
        ],
      },
      {
        id: "tec_q1e", pillar: "tecnologia", type: "single",
        text: bi(
          "Esses projetos se integram a sistemas internos, como CRM, Slack, ERP ou outras ferramentas da empresa?",
          "Do these projects integrate with internal systems, such as CRM, Slack, ERP, or other company tools?"
        ),
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Os projetos não se integram a nenhum sistema interno.", "The projects don't integrate with any internal system."), score: 0 },
          { value: 2, label: bi("Alguns", "Some"), note: bi("Parte dos projetos se integra a sistemas internos.", "Some of the projects integrate with internal systems."), score: 1 },
          { value: 3, label: bi("Sim", "Yes"), note: bi("Os projetos se integram a sistemas internos como CRM, Slack ou ERP.", "The projects integrate with internal systems such as CRM, Slack, or ERP."), score: 2 },
        ],
      },
      {
        id: "tec_q1f", pillar: "tecnologia", type: "single",
        text: bi(
          "Algum projeto de IA já entregou resultado concreto e mensurável para o negócio, como redução de custo, ganho de tempo ou aumento de receita?",
          "Has any AI project already delivered a concrete, measurable result for the business, such as cost reduction, time savings, or revenue growth?"
        ),
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Nenhum projeto de IA entregou resultado concreto e mensurável até agora.", "No AI project has delivered a concrete, measurable result so far."), score: 0 },
          { value: 2, label: bi("Sim", "Yes"), note: bi("Pelo menos um projeto de IA já entregou resultado concreto e mensurável.", "At least one AI project has already delivered a concrete, measurable result."), score: 1 },
        ],
      },
      {
        id: "tec_q1g", pillar: "tecnologia", type: "single",
        text: bi(
          "Quando um projeto de IA funciona bem em uma área, a empresa consegue expandir essa solução para outras áreas sem precisar reconstruir tudo do zero?",
          "When an AI project works well in one area, can the company expand that solution to other areas without having to rebuild everything from scratch?"
        ),
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: bi("Não reutilizável", "Not reusable"), note: bi("Não, as soluções de IA geralmente são construídas para uma área específica e precisam ser reconstruídas para outras.", "No, AI solutions are generally built for a specific area and need to be rebuilt for others."), score: 0 },
          { value: 2, label: bi("Parcialmente reutilizável", "Partially reusable"), note: bi("Parcialmente, algumas partes podem ser reutilizadas, mas a expansão ainda exige retrabalho significativo.", "Partially, some parts can be reused, but expansion still requires significant rework."), score: 1 },
          { value: 3, label: bi("Totalmente reutilizável", "Fully reusable"), note: bi("Sim, as soluções de IA são projetadas para serem reutilizáveis e escaláveis em diferentes áreas da empresa.", "Yes, AI solutions are designed to be reusable and scalable across different areas of the company."), score: 2 },
        ],
      },
      // Branch: 5 or more projects
      {
        id: "tec_q2a", pillar: "tecnologia", type: "single",
        text: bi(
          "Esses projetos são atualizados com frequência?",
          "Are these projects updated frequently?"
        ),
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Os projetos não são atualizados com frequência.", "The projects aren't updated frequently."), score: 0 },
          { value: 2, label: bi("Às vezes", "Sometimes"), note: bi("Os projetos são atualizados de vez em quando.", "The projects are updated from time to time."), score: 1 },
          { value: 3, label: bi("Sim", "Yes"), note: bi("Os projetos são atualizados com frequência.", "The projects are updated frequently."), score: 2 },
        ],
      },
      {
        id: "tec_q2b", pillar: "tecnologia", type: "single",
        text: bi(
          "As soluções de IA existentes são iniciativas pontuais ou já fazem parte de um ecossistema integrado?",
          "Are the existing AI solutions one-off initiatives, or are they already part of an integrated ecosystem?"
        ),
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: bi("Iniciativas pontuais", "One-off initiatives"), note: bi("As soluções de IA são pontuais e desconectadas entre si.", "The AI solutions are one-off and disconnected from each other."), score: 0 },
          { value: 2, label: bi("Algumas conexões", "Some connections"), note: bi("Existem algumas conexões entre as soluções de IA existentes.", "There are some connections between the existing AI solutions."), score: 1 },
          { value: 3, label: bi("Ecossistema integrado", "Integrated ecosystem"), note: bi("As soluções de IA fazem parte de um ecossistema integrado.", "The AI solutions are part of an integrated ecosystem."), score: 2 },
        ],
      },
      {
        id: "tec_q2c", pillar: "tecnologia", type: "single",
        text: bi(
          "Os projetos existentes são baseados em IA tradicional, LLMs/IA generativa ou uma combinação dos dois?",
          "Are the existing projects based on traditional AI, LLMs/generative AI, or a combination of both?"
        ),
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: bi("Não sei", "Don't know"), note: bi("Não há clareza sobre que tipo de IA os projetos utilizam.", "There's no clarity about what type of AI the projects use."), score: 0 },
          { value: 2, label: bi("Apenas LLM / IA generativa", "LLM / generative AI only"), note: bi("Os projetos usam apenas IA generativa ou LLMs.", "The projects use only generative AI or LLMs."), score: 1 },
          { value: 3, label: bi("Apenas IA tradicional", "Traditional AI only"), note: bi("Os projetos usam apenas IA tradicional, com modelos preditivos.", "The projects use only traditional AI, with predictive models."), score: 1 },
          { value: 4, label: bi("Misto", "Mixed"), note: bi("Os projetos combinam IA tradicional e IA generativa.", "The projects combine traditional AI and generative AI."), score: 2 },
        ],
      },
      {
        id: "tec_q2d", pillar: "tecnologia", type: "single",
        text: bi(
          "Esses projetos se integram a sistemas internos, como CRM, Slack, ERP ou outras ferramentas da empresa?",
          "Do these projects integrate with internal systems, such as CRM, Slack, ERP, or other company tools?"
        ),
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Os projetos não se integram a nenhum sistema interno.", "The projects don't integrate with any internal system."), score: 0 },
          { value: 2, label: bi("Alguns", "Some"), note: bi("Parte dos projetos se integra a sistemas internos.", "Some of the projects integrate with internal systems."), score: 1 },
          { value: 3, label: bi("Sim", "Yes"), note: bi("Os projetos se integram a sistemas internos como CRM, Slack ou ERP.", "The projects integrate with internal systems such as CRM, Slack, or ERP."), score: 2 },
        ],
      },
      {
        id: "tec_q2e", pillar: "tecnologia", type: "single",
        text: bi(
          "Algum projeto de IA já entregou resultado concreto e mensurável para o negócio, como redução de custo, ganho de tempo ou aumento de receita?",
          "Has any AI project already delivered a concrete, measurable result for the business, such as cost reduction, time savings, or revenue growth?"
        ),
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: bi("Não", "No"), note: bi("Nenhum projeto de IA entregou resultado concreto e mensurável até agora.", "No AI project has delivered a concrete, measurable result so far."), score: 0 },
          { value: 2, label: bi("Sim", "Yes"), note: bi("Pelo menos um projeto de IA já entregou resultado concreto e mensurável.", "At least one AI project has already delivered a concrete, measurable result."), score: 1 },
        ],
      },
      {
        id: "tec_q2f", pillar: "tecnologia", type: "single",
        text: bi(
          "Quando um projeto de IA funciona bem em uma área, a empresa consegue expandir essa solução para outras áreas sem precisar reconstruir tudo do zero?",
          "When an AI project works well in one area, can the company expand that solution to other areas without having to rebuild everything from scratch?"
        ),
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: bi("Não reutilizável", "Not reusable"), note: bi("Não, as soluções de IA geralmente são construídas para uma área específica e precisam ser reconstruídas para outras.", "No, AI solutions are generally built for a specific area and need to be rebuilt for others."), score: 0 },
          { value: 2, label: bi("Parcialmente reutilizável", "Partially reusable"), note: bi("Parcialmente, algumas partes podem ser reutilizadas, mas a expansão ainda exige retrabalho significativo.", "Partially, some parts can be reused, but expansion still requires significant rework."), score: 1 },
          { value: 3, label: bi("Totalmente reutilizável", "Fully reusable"), note: bi("Sim, as soluções de IA são projetadas para serem reutilizáveis e escaláveis em diferentes áreas da empresa.", "Yes, AI solutions are designed to be reusable and scalable across different areas of the company."), score: 2 },
        ],
      },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = SECTIONS.flatMap(s => s.questions);

export const PILLAR_CONFIG: PillarConfig[] = [
  { id: "dados",      title: bi("Dados", "Data"),                             weight: 0.25 },
  { id: "estrategia", title: bi("Estratégia", "Strategy"),                    weight: 0.20 },
  { id: "pessoas",    title: bi("Pessoas e Cultura", "People and Culture"),    weight: 0.15 },
  { id: "governanca", title: bi("Governança e Processo", "Governance and Process"), weight: 0.15 },
  { id: "tecnologia", title: bi("Tecnologia", "Technology"),                  weight: 0.25 },
];

export const LEVEL_ORDER = ["Prontidão Baixa", "Prontidão Emergente", "Prontidão Moderada", "Prontidão Alta", "Prontidão Avançada"];

// These string keys are internal identifiers (also used by LEVEL_ORDER and in
// resultAnalysis/resultInsights lookups) and are never rendered directly;
// use getLevelLabel() to get the display string for a given language.
export const LEVEL_META: Record<string, { key: string; desc: Bilingual }> = {
  "Prontidão Baixa":     { key: "low",      desc: bi("Sua organização ainda está construindo as bases necessárias para a IA. Antes de escalar iniciativas de IA, concentre-se em estratégia, dados, governança e prontidão técnica.", "Your organization is still building the foundations needed for AI. Before scaling AI initiatives, focus on strategy, data, governance, and technical readiness.") },
  "Prontidão Emergente": { key: "emerging", desc: bi("Sua organização começou a se preparar para a IA, mas ainda existem lacunas importantes. São necessárias melhorias direcionadas antes que a IA possa ser escalada de forma confiável.", "Your organization has started preparing for AI, but important gaps remain. Targeted improvements are needed before AI can be scaled reliably.") },
  "Prontidão Moderada":  { key: "moderate", desc: bi("Sua organização possui uma base razoável para a adoção de IA e pode estar pronta para pilotos focados, mas deveria fortalecer as áreas mais fracas antes de escalar amplamente.", "Your organization has a reasonable foundation for AI adoption and may be ready for focused pilots, but should strengthen its weaker areas before scaling broadly.") },
  "Prontidão Alta":      { key: "high",     desc: bi("Sua organização está bem posicionada para implementar e escalar iniciativas de IA selecionadas, desde que a governança, o monitoramento e a mensuração de valor permaneçam sólidos.", "Your organization is well positioned to implement and scale selected AI initiatives, as long as governance, monitoring, and value measurement remain solid.") },
  "Prontidão Avançada":  { key: "advanced", desc: bi("Sua organização possui uma base sólida para adotar, escalar e melhorar continuamente a IA em todo o negócio.", "Your organization has a solid foundation to adopt, scale, and continuously improve AI across the business.") },
};

const LEVEL_LABEL: Record<string, Bilingual> = {
  "Prontidão Baixa":     bi("Prontidão Baixa", "Low Readiness"),
  "Prontidão Emergente": bi("Prontidão Emergente", "Emerging Readiness"),
  "Prontidão Moderada":  bi("Prontidão Moderada", "Moderate Readiness"),
  "Prontidão Alta":      bi("Prontidão Alta", "High Readiness"),
  "Prontidão Avançada":  bi("Prontidão Avançada", "Advanced Readiness"),
};

export function getLevelLabel(level: string, lang: Lang = DEFAULT_LANG): string {
  return LEVEL_LABEL[level] ? pick(LEVEL_LABEL[level], lang) : level;
}

export const RECOMMENDATIONS: Record<string, Bilingual> = {
  dados:      bi("Mapeie as fontes de dados críticas, resolva lacunas de qualidade e acesso, e defina responsáveis antes de escalar iniciativas de IA.", "Map critical data sources, resolve quality and access gaps, and assign owners before scaling AI initiatives."),
  estrategia: bi("Transforme a visão de IA em um roadmap priorizado, com casos de uso, responsáveis, métricas de valor e horizonte de execução claro.", "Turn the AI vision into a prioritized roadmap, with use cases, owners, value metrics, and a clear execution horizon."),
  pessoas:    bi("Combine capacitação, comunicação e gestão de mudança para que as equipes entendam onde usar IA e como incorporar novas soluções ao trabalho.", "Combine training, communication, and change management so teams understand where to use AI and how to incorporate new solutions into their work."),
  governanca: bi("Defina políticas, controles e responsabilidades para segurança, privacidade, revisão humana e acompanhamento de iniciativas de IA.", "Define policies, controls, and responsibilities for security, privacy, human review, and tracking of AI initiatives."),
  tecnologia: bi("Estabeleça uma base técnica para conectar dados, integrar sistemas, monitorar modelos e levar pilotos para produção com menor retrabalho.", "Establish a technical foundation to connect data, integrate systems, monitor models, and take pilots to production with less rework."),
};

export type QuestionFlowState = "visible" | "pending" | "skipped";

export function getQuestionFlowState(
  q: FlowQuestion,
  sectionQuestions: FlowQuestion[],
  answers: AnswerRecord
): QuestionFlowState {
  function resolve(question: FlowQuestion, visited: Set<string>): QuestionFlowState {
    if (!question.showIf) return "visible";
    if (visited.has(question.id)) return "pending";

    const parent = sectionQuestions.find(item => item.id === question.showIf?.qId);
    if (!parent) return "pending";

    const nextVisited = new Set(visited).add(question.id);
    const parentState = resolve(parent, nextVisited);
    if (parentState !== "visible") return parentState;

    const parentAnswer = answers[parent.id];
    if (typeof parentAnswer !== "number") return "pending";
    return question.showIf.values.includes(parentAnswer) ? "visible" : "skipped";
  }

  return resolve(q, new Set());
}

export function isQuestionVisible(q: FlowQuestion, sectionQuestions: FlowQuestion[], answers: AnswerRecord): boolean {
  return getQuestionFlowState(q, sectionQuestions, answers) === "visible";
}

export interface SectionProgress {
  answered: number;
  total: number;
  percent: number;
  complete: boolean;
}

export function isQuestionAnswered(q: FlowQuestion, answers: AnswerRecord): boolean {
  const answer = answers[q.id];
  if (q.type === "text") return typeof answer === "string" && answer.trim().length > 0;
  if (q.type === "multi") return Array.isArray(answer) && answer.length > 0;
  return typeof answer === "number";
}

export function getSectionProgress(section: FlowSection, answers: AnswerRecord): SectionProgress {
  const answered = section.questions.filter(q => {
    const state = getQuestionFlowState(q, section.questions, answers);
    return state === "skipped" || (
      state === "visible" && (q.type === "text" || isQuestionAnswered(q, answers))
    );
  }).length;
  const total = section.questions.length;
  return {
    answered,
    total,
    percent: total === 0 ? 0 : Math.round((answered / total) * 100),
    complete: total > 0 && answered === total,
  };
}

export function getAssessmentProgress(answers: AnswerRecord): SectionProgress {
  const progress = SECTIONS.map(section => getSectionProgress(section, answers));
  const answered = progress.reduce((sum, item) => sum + item.answered, 0);
  const total = progress.reduce((sum, item) => sum + item.total, 0);
  return {
    answered,
    total,
    percent: total === 0 ? 0 : Math.round((answered / total) * 100),
    complete: total > 0 && answered === total,
  };
}

export function getQuestionScore(q: FlowQuestion, answers: AnswerRecord): number | null {
  if (q.type === "text") return null;
  const answer = answers[q.id];
  if (answer === undefined || answer === null) return null;
  const options = q.options ?? [];
  if (q.type === "multi") {
    const selected = Array.isArray(answer) ? (answer as number[]) : [];
    const noneValues = options.filter(o => o.isNone).map(o => o.value);
    if (selected.some(v => noneValues.includes(v))) return 0;
    return options
      .filter(o => !o.isNone && selected.includes(o.value))
      .reduce((sum, o) => sum + o.score, 0);
  }
  if (q.type === "single") {
    const opt = options.find(o => o.value === (answer as number));
    return opt ? opt.score : null;
  }
  return null;
}

export function getQuestionMax(q: FlowQuestion): number {
  const options = q.options ?? [];
  if (q.type === "single") return options.length > 0 ? Math.max(...options.map(o => o.score)) : 0;
  if (q.type === "multi") return options.filter(o => !o.isNone).reduce((sum, o) => sum + o.score, 0);
  return 0;
}

export function calculatePillarScores(answers: AnswerRecord, lang: Lang = DEFAULT_LANG): PillarScore[] {
  const totals: Record<string, { achieved: number; max: number }> = {};
  for (const p of PILLAR_CONFIG) totals[p.id] = { achieved: 0, max: 0 };

  for (const section of SECTIONS) {
    const visibleQs = section.questions.filter(q => isQuestionVisible(q, section.questions, answers));
    for (const q of visibleQs) {
      if (q.type === "text") continue;
      const score = getQuestionScore(q, answers);
      if (score === null) continue;
      const key = q.scorePillar ?? q.pillar;
      if (!totals[key]) continue;
      totals[key].achieved += score;
      totals[key].max += getQuestionMax(q);
    }
  }

  return PILLAR_CONFIG.map(p => {
    const t = totals[p.id];
    const score = t.max > 0 ? Math.round((t.achieved / t.max) * 100) : 0;
    return { id: p.id, title: pick(p.title, lang), weight: p.weight, score };
  });
}

export function calculateOverallScore(answers: AnswerRecord): number {
  let achieved = 0;
  for (const section of SECTIONS) {
    const visibleQs = section.questions.filter(q => isQuestionVisible(q, section.questions, answers));
    for (const q of visibleQs) {
      if (q.type === "text") continue;
      const score = getQuestionScore(q, answers);
      if (score === null) continue;
      achieved += score;
    }
  }
  return Math.max(0, Math.min(100, Math.round(achieved)));
}

export function getReadinessLevel(score: number): string {
  if (score >= 90) return "Prontidão Avançada";
  if (score >= 75) return "Prontidão Alta";
  if (score >= 60) return "Prontidão Moderada";
  if (score >= 40) return "Prontidão Emergente";
  return "Prontidão Baixa";
}

export function applyBlockerRules(weightedScore: number, pillarScores: PillarScore[], lang: Lang = DEFAULT_LANG): AssessmentResult {
  // The readiness tag always reflects the overall score band directly, with
  // no pillar-based override — a weak pillar surfaces as a blocker note
  // alongside the tag, not as a downgrade of it.
  const level = getReadinessLevel(weightedScore);
  let blocker: string | null = null;
  let blockerPillar: string | null = null;
  let blockerSeverity = Infinity;
  const byId = Object.fromEntries(pillarScores.map(p => [p.id, p]));

  function flag(severityRank: number, pillar: string, msg: Bilingual) {
    if (severityRank < blockerSeverity) {
      blockerSeverity = severityRank;
      blockerPillar = pillar;
      blocker = lang === "en"
        ? "Your overall score is promising, but " + msg.en
        : "Sua pontuação geral é promissora, mas " + msg.pt;
    }
  }

  if (byId.tecnologia?.score < 40) flag(2, "tecnologia", bi(
    "sua pontuação em Tecnologia limita a capacidade atual de implantar IA além de pilotos.",
    "your Technology score limits your current ability to deploy AI beyond pilots."
  ));
  if (byId.dados?.score      < 40) flag(1, "dados", bi(
    "sua pontuação em Dados limita a capacidade atual de escalar IA de forma confiável.",
    "your Data score limits your current ability to scale AI reliably."
  ));
  if (byId.governanca?.score < 40) flag(1, "governanca", bi(
    "sua pontuação em Governança e Processo limita a capacidade atual de gerenciar IA de forma responsável em escala.",
    "your Governance and Process score limits your current ability to manage AI responsibly at scale."
  ));

  return { score: weightedScore, level, blocker, blockerPillar };
}

export function getPillarTier(score: number, lang: Lang = DEFAULT_LANG) {
  if (score >= 90) return { key: "advanced", label: pick(bi("Avançado", "Advanced"), lang),                     barClass: "rpt-bar-advanced", pctClass: "rpt-pct-advanced" };
  if (score >= 75) return { key: "high",     label: pick(bi("Forte", "Strong"), lang),                          barClass: "rpt-bar-high",     pctClass: "rpt-pct-high" };
  if (score >= 60) return { key: "moderate", label: pick(bi("Moderado", "Moderate"), lang),                     barClass: "rpt-bar-moderate", pctClass: "rpt-pct-moderate" };
  if (score >= 40) return { key: "emerging", label: pick(bi("Em desenvolvimento", "Developing"), lang),         barClass: "rpt-bar-emerging", pctClass: "rpt-pct-emerging" };
  return             { key: "low",     label: pick(bi("Lacunas fundamentais", "Fundamental gaps"), lang),  barClass: "rpt-bar-low",      pctClass: "rpt-pct-low" };
}

export function clearDependentAnswers(qId: string, answers: AnswerRecord): AnswerRecord {
  const next = { ...answers };
  function clear(parentId: string) {
    for (const q of ALL_QUESTIONS) {
      if (q.showIf?.qId === parentId && q.id in next) {
        delete next[q.id];
        clear(q.id);
      }
    }
  }
  clear(qId);
  return next;
}

export function getDataRiskFlag(answers: AnswerRecord): boolean {
  const val = answers["dados_q6"];
  return typeof val === "number" && val <= 2;
}

// ---------------------------------------------------------------------
// Localization helpers: produce plain-string copies of the bilingual
// content above for rendering and for generated-copy consumers.
// ---------------------------------------------------------------------

export function localizeOption(o: SingleOption | MultiOption, lang: Lang = DEFAULT_LANG): LocalizedOption {
  return {
    value: o.value,
    label: pick(o.label, lang),
    note: o.note ? pick(o.note, lang) : undefined,
    score: o.score,
    isNone: (o as MultiOption).isNone,
  };
}

export function localizeQuestion(q: Question, lang: Lang = DEFAULT_LANG): LocalizedQuestion {
  const base = {
    id: q.id,
    pillar: q.pillar,
    text: pick(q.text, lang),
    showIf: q.showIf,
    scorePillar: q.scorePillar,
  };
  if (q.type === "single") {
    return { ...base, type: "single", riskFlag: q.riskFlag, options: q.options.map(o => localizeOption(o, lang)) };
  }
  if (q.type === "multi") {
    return { ...base, type: "multi", options: q.options.map(o => localizeOption(o, lang)) };
  }
  return { ...base, type: "text", placeholder: q.placeholder ? pick(q.placeholder, lang) : undefined };
}

export function localizeSection(s: Section, lang: Lang = DEFAULT_LANG): LocalizedSection {
  return {
    id: s.id,
    pillar: s.pillar,
    title: pick(s.title, lang),
    desc: pick(s.desc, lang),
    questions: s.questions.map(q => localizeQuestion(q, lang)),
  };
}

export function getSections(lang: Lang = DEFAULT_LANG): LocalizedSection[] {
  return SECTIONS.map(s => localizeSection(s, lang));
}

export function getAllQuestions(lang: Lang = DEFAULT_LANG): LocalizedQuestion[] {
  return getSections(lang).flatMap(s => s.questions);
}

export function getPillarConfig(lang: Lang = DEFAULT_LANG): Array<{ id: string; title: string; weight: number }> {
  return PILLAR_CONFIG.map(p => ({ id: p.id, title: pick(p.title, lang), weight: p.weight }));
}
