export type AnswerRecord = Record<string, number | number[] | string>;

export interface SingleOption {
  value: number;
  label: string;
  /** Secondary explanation shown under the label, smaller/lighter. */
  note?: string;
  score: number;
}

export interface MultiOption {
  value: number;
  label: string;
  /** Secondary explanation shown under the label, smaller/lighter. */
  note?: string;
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
  text: string;
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
  placeholder?: string;
}

export type Question = SingleQuestion | MultiQuestion | TextQuestion;

export interface Section {
  id: string;
  pillar: number;
  title: string;
  desc: string;
  questions: Question[];
}

export interface PillarConfig {
  id: string;
  title: string;
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
}

export const SECTIONS: Section[] = [
  {
    id: "dados", pillar: 1,
    title: "Dados",
    desc: "Avalia a qualidade, acessibilidade e disponibilidade dos dados da organização para suportar iniciativas de IA.",
    questions: [
      {
        id: "dados_q1", pillar: "dados", type: "single",
        text: "Os dados que a empresa coleta hoje são suficientes e relevantes para apoiar as decisões e iniciativas mais importantes do negócio?",
        options: [
          { value: 1, label: "Sem clareza", note: "A empresa não sabe claramente se os dados que coleta são suficientes ou relevantes para apoiar suas decisões mais importantes.", score: 0 },
          { value: 2, label: "Dados parciais", note: "A empresa coleta alguns dados relevantes, mas decisões importantes ainda são tomadas com informações incompletas, análises manuais ou suposições.", score: 2.5 },
          { value: 3, label: "Dados suficientes", note: "A empresa coleta dados claramente relevantes e suficientes para apoiar suas decisões e iniciativas mais importantes.", score: 5 },
        ],
      },
      {
        id: "dados_q2", pillar: "dados", type: "single",
        text: "Quão acessíveis são os dados para as equipes ou sistemas que precisam deles?",
        options: [
          { value: 1, label: "Dados isolados", note: "Os dados estão armazenados em sistemas ou arquivos isolados, e as equipes não conseguem acessá-los facilmente sem apoio manual ou solicitações especiais.", score: 0 },
          { value: 2, label: "Acesso limitado", note: "Alguns dados estão disponíveis, mas o acesso é lento, inconsistente ou depende de pessoas ou ferramentas específicas.", score: 1.25 },
          { value: 3, label: "Acesso parcial", note: "As principais equipes conseguem acessar parte dos dados de que precisam, mas informações importantes ainda estão fragmentadas ou são difíceis de usar.", score: 2.5 },
          { value: 4, label: "Acesso quase total", note: "A maioria dos dados relevantes está disponível para as equipes e sistemas certos, com apenas pequenas lacunas ou etapas manuais.", score: 3.75 },
          { value: 5, label: "Acesso total", note: "Os dados estão facilmente disponíveis para equipes e sistemas autorizados.", score: 5 },
        ],
      },
      {
        id: "dados_q3", pillar: "dados", type: "single",
        text: "É possível crescer a capacidade operacional sem necessariamente aumentar o quadro de pessoas na mesma proporção?",
        options: [
          { value: 1, label: "Não", note: "A operação ainda depende diretamente de contratar mais pessoas para crescer.", score: 0 },
          { value: 2, label: "Depende da área", note: "Em algumas áreas dá para crescer sem novas contratações, em outras não.", score: 2.5 },
          { value: 3, label: "Sim", note: "A empresa consegue ampliar a operação sem aumentar o quadro na mesma proporção.", score: 5 },
        ],
      },
      {
        id: "dados_q4", pillar: "dados", type: "single",
        text: "Em geral, até que ponto a organização possui dados históricos?",
        options: [
          { value: 1, label: "Sem histórico", note: "Os dados não são armazenados, não são confiáveis ou existem apenas em arquivos e sistemas espalhados.", score: 0 },
          { value: 2, label: "Histórico recente", note: "A organização possui dados utilizáveis dos últimos meses, mas não o suficiente para identificar padrões de longo prazo.", score: 1.66 },
          { value: 3, label: "Histórico de 1 a 3 anos", note: "A organização possui de um a três anos de dados históricos utilizáveis para algumas áreas-chave do negócio.", score: 3.33 },
          { value: 4, label: "Histórico consolidado", note: "A organização possui vários anos de dados históricos confiáveis nas áreas mais importantes do negócio.", score: 5 },
        ],
      },
      {
        id: "dados_q5", pillar: "dados", type: "single",
        text: "Quando você precisa tomar uma decisão, consegue acessar os dados necessários na velocidade desejada?",
        options: [
          { value: 1, label: "Raramente", note: "Os dados quase nunca chegam na velocidade necessária para apoiar a decisão.", score: 0 },
          { value: 2, label: "Às vezes", note: "Em algumas situações os dados chegam a tempo, mas não na maioria delas.", score: 2.33 },
          { value: 3, label: "Na maioria das vezes", note: "Os dados chegam a tempo na maior parte das decisões.", score: 4.66 },
          { value: 4, label: "Sim, sempre", note: "Os dados estão sempre disponíveis na velocidade desejada.", score: 7 },
        ],
      },
      {
        id: "dados_q6", pillar: "dados", type: "single",
        riskFlag: true,
        text: "Qual seria o impacto provável de um vazamento de dados na empresa?",
        options: [
          // TODO: a nova versão do questionário não trouxe pontuação para esta pergunta; pontuação existente preservada.
          { value: 1, label: "Impacto crítico", note: "Um vazamento poderia interromper gravemente o negócio, gerar grande exposição regulatória, prejudicar a confiança dos clientes e causar danos financeiros ou reputacionais de longo prazo.", score: 0 },
          { value: 2, label: "Impacto significativo", note: "Um vazamento poderia expor dados sensíveis do negócio, de clientes ou de colaboradores, gerando consequências financeiras, legais ou reputacionais significativas.", score: 1.33 },
          { value: 3, label: "Impacto moderado", note: "Um vazamento poderia afetar operações internas, a confiança dos clientes ou obrigações de compliance, mas provavelmente seria gerenciável.", score: 2.66 },
          { value: 4, label: "Impacto mínimo", note: "Um vazamento afetaria informações não críticas e causaria impacto operacional, financeiro ou reputacional mínimo.", score: 5 },
        ],
      },
      {
        id: "dados_q7", pillar: "dados", type: "single",
        text: "Quão confortável você se sente em tomar decisões com base nos dados fornecidos pela empresa?",
        options: [
          { value: 1, label: "Nada confortável", note: "Você não confia nos dados para embasar suas decisões.", score: 0 },
          { value: 2, label: "Hesitante", note: "Você usa os dados disponíveis, mas com bastante insegurança.", score: 1 },
          { value: 3, label: "Um pouco confortável", note: "Você confia parcialmente nos dados disponíveis.", score: 2 },
          { value: 4, label: "Confortável", note: "Você confia na maior parte das vezes nos dados disponíveis.", score: 3 },
          { value: 5, label: "Muito confortável", note: "Você confia totalmente nos dados para tomar decisões.", score: 4 },
        ],
      },
    ],
  },
  {
    id: "estrategia", pillar: 2,
    title: "Estratégia",
    desc: "Avalia como a IA está posicionada dentro da visão, prioridades de liderança e objetivos estratégicos da organização.",
    questions: [
      {
        id: "est_q1", pillar: "estrategia", type: "single",
        text: "A organização definiu uma visão clara de como a IA pode gerar valor para o negócio?",
        options: [
          { value: 3, label: "Não", note: "A liderança ainda não definiu uma visão clara de como a IA pode gerar valor para o negócio.", score: 0 },
          { value: 2, label: "Parcialmente", note: "Existe uma visão inicial de como a IA pode gerar valor, mas ainda não está totalmente clara.", score: 1 },
          { value: 1, label: "Sim", note: "A liderança já definiu com clareza como a IA pode gerar valor para o negócio.", score: 3 },
        ],
      },
      {
        id: "est_q1a", pillar: "estrategia", type: "single",
        text: "A liderança já mapeou quais áreas e processos têm maior potencial de retorno com IA?",
        showIf: { qId: "est_q1", values: [1] },
        options: [
          { value: 2, label: "Não", note: "A liderança ainda não mapeou quais áreas têm maior potencial de retorno com IA.", score: 0 },
          { value: 1, label: "Sim", note: "A liderança já mapeou as áreas e processos com maior potencial de retorno com IA.", score: 2 },
        ],
      },
      {
        id: "est_q1a1", pillar: "estrategia", type: "single",
        text: "Existe um roadmap de IA documentado para os próximos 12 a 24 meses?",
        showIf: { qId: "est_q1a", values: [1] },
        options: [
          { value: 2, label: "Não", note: "Não existe um roadmap de IA documentado para os próximos 12 a 24 meses.", score: 0 },
          { value: 1, label: "Sim", note: "Existe um roadmap de IA documentado para os próximos 12 a 24 meses.", score: 2.5 },
        ],
      },
      {
        id: "est_q1a1a", pillar: "estrategia", type: "single",
        text: "Com que frequência esse roadmap é revisado e atualizado?",
        showIf: { qId: "est_q1a1", values: [1] },
        options: [
          { value: 1, label: "Nunca", note: "O roadmap nunca é revisado depois de criado.", score: 0 },
          { value: 2, label: "Anualmente", note: "O roadmap é revisado uma vez por ano.", score: 0.33 },
          { value: 3, label: "Trimestralmente", note: "O roadmap é revisado a cada trimestre.", score: 0.67 },
          { value: 4, label: "Mensalmente ou mais", note: "O roadmap é revisado mensalmente ou com frequência ainda maior.", score: 1 },
        ],
      },
      {
        id: "est_q1b", pillar: "estrategia", type: "single",
        text: "A liderança conhece o potencial ou valor econômico da IA?",
        showIf: { qId: "est_q1", values: [2, 3] },
        options: [
          { value: 3, label: "Não", note: "A liderança não entende o potencial ou o valor econômico da IA.", score: 0 },
          { value: 2, label: "Parcialmente", note: "A liderança tem uma noção limitada do valor econômico da IA.", score: 0.5 },
          { value: 1, label: "Sim", note: "A liderança entende o potencial e o valor econômico da IA.", score: 1 },
        ],
      },
      {
        id: "est_q2", pillar: "estrategia", type: "single",
        text: "Como a IA é vista hoje dentro da organização?",
        options: [
          { value: 1, label: "Experimentação", note: "A empresa testa IA de forma pontual ou isolada, sem uma estratégia definida, responsáveis claros ou métricas consistentes para medir resultados.", score: 0 },
          { value: 2, label: "Melhoria de produtividade", note: "A empresa usa IA para fazer o que já faz com mais velocidade e menos custo, sem mudar a forma como o negócio funciona.", score: 2.33 },
          { value: 3, label: "Transformação do negócio", note: "A empresa usa IA para mudar a forma como opera, decide ou entrega valor, não apenas para otimizar, mas para fazer diferente.", score: 4.66 },
          { value: 4, label: "Vantagem competitiva central", note: "IA é parte estrutural da proposta de valor da empresa, um ativo estratégico que a diferencia de forma que concorrentes sem essa capacidade dificilmente conseguem replicar.", score: 7 },
        ],
      },
      {
        id: "est_q3", pillar: "estrategia", type: "single",
        text: "Os executivos patrocinam ativamente as iniciativas de IA?",
        options: [
          { value: 1, label: "De forma nenhuma", note: "Os executivos não patrocinam as iniciativas de IA.", score: 0 },
          { value: 2, label: "Raramente", note: "Os executivos raramente se envolvem no patrocínio das iniciativas de IA.", score: 1.75 },
          { value: 3, label: "Às vezes", note: "Os executivos apoiam as iniciativas de IA apenas em algumas ocasiões.", score: 3.5 },
          { value: 4, label: "Regularmente", note: "Os executivos patrocinam as iniciativas de IA de forma regular.", score: 5.25 },
          { value: 5, label: "De forma consistente e visível", note: "Os executivos patrocinam as iniciativas de IA de forma consistente e visível para toda a empresa.", score: 7 },
        ],
      },
      {
        id: "est_q3a", pillar: "estrategia", type: "single",
        scorePillar: "governanca",
        text: "Com que frequência as iniciativas de IA sofrem atrasos?",
        showIf: { qId: "est_q3", values: [1, 2, 3, 4, 5] },
        options: [
          { value: 1, label: "Quase sempre", note: "As iniciativas de IA quase sempre sofrem atrasos.", score: 0 },
          { value: 2, label: "Frequentemente", note: "As iniciativas de IA sofrem atrasos com frequência.", score: 1.33 },
          { value: 3, label: "Ocasionalmente", note: "As iniciativas de IA sofrem atrasos ocasionalmente.", score: 2.66 },
          { value: 4, label: "Raramente", note: "As iniciativas de IA raramente sofrem atrasos.", score: 4 },
        ],
      },
      {
        id: "est_q3a1", pillar: "estrategia", type: "text",
        scorePillar: "governanca",
        text: "Qual você diria que é o principal motivo desses atrasos?",
        showIf: { qId: "est_q3a", values: [1, 2, 3] },
        placeholder: "Descreva o principal motivo dos atrasos...",
      },
      {
        id: "pess_q1", pillar: "estrategia", type: "single",
        text: "A liderança comunica expectativas claras sobre a adoção de IA e os resultados esperados?",
        options: [
          { value: 1, label: "Não há comunicação", note: "A liderança não comunica nada sobre a adoção de IA ou os resultados esperados.", score: 0 },
          { value: 2, label: "Comunicação inconsistente", note: "A liderança comunica de forma esporádica e sem padrão.", score: 0.5 },
          { value: 3, label: "Um pouco clara", note: "A comunicação existe, mas ainda deixa dúvidas sobre expectativas e resultados.", score: 1 },
          { value: 4, label: "Em grande parte clara", note: "A comunicação é clara na maior parte do tempo, com poucas lacunas.", score: 1.5 },
          { value: 5, label: "Clara e regular", note: "A liderança comunica expectativas e resultados de forma clara e constante.", score: 2 },
        ],
      },
      {
        id: "pess_q2", pillar: "estrategia", type: "single",
        text: "Com que frequência as equipes experimentam novas capacidades de IA?",
        options: [
          { value: 1, label: "Nunca", note: "As equipes nunca experimentam novas capacidades de IA.", score: 0 },
          { value: 2, label: "Raramente", note: "As equipes raramente experimentam novas capacidades de IA.", score: 0.625 },
          { value: 3, label: "Ocasionalmente", note: "As equipes experimentam novas capacidades de IA de vez em quando.", score: 1.25 },
          { value: 4, label: "Frequentemente", note: "As equipes experimentam novas capacidades de IA com frequência.", score: 1.875 },
          // TODO: a nova versão do questionário mostra (+2.6) aqui, mas o subtotal do bloco (3.5) só fecha com 2.5; pontuação existente preservada.
          { value: 5, label: "Continuamente", note: "As equipes experimentam novas capacidades de IA de forma contínua.", score: 2.5 },
        ],
      },
      {
        id: "pess_q2a", pillar: "estrategia", type: "single",
        text: "Como a organização atualmente testa e avalia novas capacidades de IA?",
        showIf: { qId: "pess_q2", values: [1, 2, 3, 4, 5] },
        options: [
          { value: 1, label: "Sem testes", note: "A organização não está testando ativamente capacidades de IA nem explorando casos de uso.", score: 0.25 },
          { value: 2, label: "Testes informais", note: "Algumas pessoas ou equipes experimentam ferramentas de IA por conta própria, mas não há processo formal, responsável definido ou aprendizado compartilhado.", score: 0.5 },
          { value: 3, label: "Pilotos ocasionais", note: "A organização realiza pilotos ocasionais de IA ligados a problemas específicos do negócio, mas os resultados nem sempre são medidos ou escalados.", score: 0.75 },
          { value: 4, label: "Processo estruturado", note: "Os experimentos de IA são priorizados, medidos, revisados e conectados a objetivos claros de negócio, com um processo para decidir o que escalar, melhorar ou interromper.", score: 1 },
        ],
      },
    ],
  },
  {
    id: "pessoas", pillar: 3,
    title: "Pessoas e Cultura",
    desc: "Avalia a prontidão das equipes, disponibilidade de habilidades e capacidade de colaboração para adoção de IA.",
    questions: [
      {
        id: "pess_q3", pillar: "pessoas", type: "multi",
        text: "Em quais das seguintes áreas a organização possui expertise interna? Selecione todas as opções aplicáveis.",
        options: [
          { value: 1, label: "Engenharia de Dados", note: "Responsável por coletar, organizar e garantir a qualidade dos dados da empresa, é a base sem a qual nenhuma solução de IA funciona bem.", score: 0.9 },
          { value: 2, label: "Engenharia de IA generativa", note: "Responsável por construir soluções que geram conteúdo, respondem perguntas e automatizam comunicação, como assistentes virtuais, resumos automáticos e geração de texto ou imagem.", score: 0.7 },
          { value: 3, label: "Engenharia de IA tradicional", note: "Responsável por criar modelos que aprendem com dados históricos para prever comportamentos, detectar padrões e automatizar decisões complexas.", score: 0.7 },
          { value: 4, label: "Engenharia de Cloud / Segurança", note: "Responsável por criar modelos que aprendem com dados históricos para prever comportamentos, detectar padrões e automatizar decisões complexas.", score: 0.7 },
          { value: 5, label: "Nenhuma das anteriores", note: "A organização não possui expertise interna em nenhuma dessas áreas.", score: 0, isNone: true },
        ],
      },
      {
        id: "pess_q4", pillar: "pessoas", type: "single",
        text: "Quão receptivos são os colaboradores a mudanças em processos e tecnologias?",
        options: [
          { value: 1, label: "Resistentes", note: "Os colaboradores resistem ativamente a mudanças em processos e tecnologias.", score: 0 },
          { value: 2, label: "Em sua maioria resistentes", note: "A maior parte dos colaboradores tende a resistir a mudanças.", score: 0.5 },
          { value: 3, label: "Parcialmente receptivos", note: "Os colaboradores aceitam mudanças, mas com alguma resistência.", score: 1 },
          { value: 4, label: "Geralmente receptivos", note: "A maior parte dos colaboradores aceita bem as mudanças.", score: 1.5 },
          { value: 5, label: "Altamente receptivos", note: "Os colaboradores abraçam mudanças em processos e tecnologias com facilidade.", score: 2 },
        ],
      },
      {
        id: "pess_q5", pillar: "pessoas", type: "single",
        text: "A organização aplica critérios claros para determinar quando a IA é, ou não é, a solução certa para um problema?",
        options: [
          { value: 1, label: "Sem conhecimento", note: "Não há conhecimento suficiente para avaliar se IA é a ferramenta adequada.", score: 0 },
          { value: 2, label: "Benchmark de mercado", note: "A organização avalia casos do mercado e incorpora aprendizados de empresas que já implementaram soluções semelhantes.", score: 0.75 },
          { value: 3, label: "Avaliação técnica", note: "A organização possui entendimento técnico dessas soluções e avalia adequadamente se a equipe tem capacidade para entregá-las.", score: 1.25 },
          { value: 4, label: "Avaliação completa", note: "A organização realiza uma avaliação completa, incluindo plano de negócio, ROI, análise de requisitos e critérios de sucesso.", score: 2 },
        ],
      },
      {
        id: "pess_q5a", pillar: "pessoas", type: "single",
        text: "A organização possui um processo claro para priorizar iniciativas de IA?",
        showIf: { qId: "pess_q5", values: [1, 2, 3, 4] },
        options: [
          { value: 1, label: "Não", note: "Não existe um processo para priorizar iniciativas de IA.", score: 0 },
          { value: 2, label: "Informal", note: "Existe uma priorização, mas sem um processo formalizado.", score: 1 },
          { value: 3, label: "Formal", note: "Existe um processo formal e estruturado para priorizar iniciativas de IA.", score: 2 },
        ],
      },
      {
        id: "pess_q6", pillar: "pessoas", type: "single",
        text: "A empresa está investindo ativamente em preparar seus colaboradores para entender e trabalhar com IA, seja por meio de treinamentos, programas internos ou contratação de profissionais especializados?",
        options: [
          { value: 1, label: "Sem programas", note: "Não existem programas formais de treinamento em IA, iniciativas internas ou contratações especializadas em IA.", score: 0 },
          { value: 2, label: "Treinamento informal", note: "Alguns colaboradores estão experimentando ferramentas de IA, mas o treinamento e o suporte são majoritariamente informais ou opcionais.", score: 0.83 },
          { value: 3, label: "Treinamento estruturado", note: "A empresa oferece treinamentos em IA, programas internos ou está contratando especialistas para desenvolver capacidade em IA.", score: 1.67 },
          { value: 4, label: "Estratégia formal de capacitação", note: "A capacitação em IA faz parte de uma estratégia formal de desenvolvimento da força de trabalho, com orçamento dedicado, apoio da liderança e metas mensuráveis de adoção.", score: 2.5 },
        ],
      },
    ],
  },
  {
    id: "governanca", pillar: 4,
    title: "Governança e Processo",
    desc: "Avalia os frameworks da organização para gerenciar iniciativas de IA de forma responsável e com clara responsabilização.",
    questions: [
      {
        id: "gov_q1", pillar: "governanca", type: "single",
        text: "Quão bem os processos críticos de negócio estão documentados?",
        options: [
          { value: 1, label: "Não documentados", note: "Os processos críticos do negócio não estão documentados.", score: 0 },
          { value: 2, label: "Parcialmente documentados", note: "Apenas uma parte dos processos críticos está documentada.", score: 1.67 },
          { value: 3, label: "Em sua maioria documentados", note: "A maior parte dos processos críticos já está documentada.", score: 3.33 },
          { value: 4, label: "Totalmente documentados", note: "Todos os processos críticos do negócio estão documentados.", score: 5 },
        ],
      },
      {
        id: "gov_q2", pillar: "governanca", type: "single",
        text: "A empresa possui diretrizes claras sobre como gerenciar os riscos de segurança e privacidade específicos de iniciativas de IA, como uso indevido de dados, vazamentos ou decisões automatizadas sem supervisão?",
        options: [
          { value: 1, label: "Sem diretrizes", note: "Não existem diretrizes, controles ou responsáveis definidos para gerenciar riscos de segurança relacionados à IA.", score: 0 },
          { value: 2, label: "Abordagem genérica", note: "Os riscos de segurança de IA são tratados pelos processos existentes de TI e segurança, mas não há uma abordagem específica para IA.", score: 3 },
          { value: 3, label: "Governança específica para IA", note: "Responsabilidades, controles e processos de revisão de segurança estão claramente definidos e adaptados aos riscos específicos da IA.", score: 6 },
        ],
      },
    ],
  },
  {
    id: "tecnologia", pillar: 5,
    title: "Tecnologia",
    desc: "Avalia as capacidades técnicas da organização para construir, implantar, monitorar e integrar soluções de IA.",
    questions: [
      {
        id: "tec_q1", pillar: "tecnologia", type: "single",
        text: "Quantos projetos de IA já foram/estão sendo executados na empresa?",
        options: [
          { value: 1, label: "Ainda não existem projetos de IA", note: "A empresa ainda não executou nenhum projeto de IA.", score: 0 },
          { value: 2, label: "1 a 4", note: "A empresa já executou ou está executando entre 1 e 4 projetos de IA.", score: 2 },
          { value: 3, label: "5 ou mais", note: "A empresa já executou ou está executando 5 ou mais projetos de IA.", score: 4 },
        ],
      },
      // Branch: no projects yet
      {
        id: "tec_q1b", pillar: "tecnologia", type: "single",
        text: "Se uma oportunidade de IA fosse priorizada hoje, a empresa conseguiria conectar os dados/sistemas necessários e lançar um primeiro piloto técnico em prazo razoável?",
        showIf: { qId: "tec_q1", values: [1] },
        options: [
          { value: 1, label: "Do zero", note: "Não, seria necessário começar praticamente do zero, incluindo dados, integrações, equipe e aprovações.", score: 0 },
          { value: 2, label: "Início parcial", note: "Parcialmente, seria possível iniciar, mas ainda haveria dependências importantes de dados, integrações, equipe técnica ou aprovações.", score: 1.75 },
          { value: 3, label: "Pronta para começar", note: "Sim, a empresa conseguiria conectar os dados/sistemas necessários e iniciar um piloto técnico com os recursos atuais.", score: 3.5 },
        ],
      },
      // Branch: 1 a 4 projects
      {
        id: "tec_q1c", pillar: "tecnologia", type: "single",
        text: "A maioria desses projetos está em desenvolvimento ativo, em manutenção ou parada?",
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: "Parados", note: "Os projetos de IA existentes estão parados.", score: 0 },
          { value: 2, label: "Manutenção", note: "Os projetos estão apenas em manutenção, sem evolução ativa.", score: 1 },
          { value: 3, label: "Desenvolvimento ativo", note: "Os projetos estão em desenvolvimento ativo.", score: 2 },
        ],
      },
      {
        id: "tec_q1d", pillar: "tecnologia", type: "single",
        text: "Os projetos existentes são baseados em IA tradicional, LLMs/IA generativa ou uma combinação dos dois?",
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: "Não sei", note: "Não há clareza sobre que tipo de IA os projetos utilizam.", score: 0 },
          { value: 2, label: "Apenas IA tradicional", note: "Os projetos usam apenas IA tradicional, com modelos preditivos.", score: 1 },
          { value: 3, label: "Apenas LLM / IA generativa", note: "Os projetos usam apenas IA generativa ou LLMs.", score: 1 },
          { value: 4, label: "Misto", note: "Os projetos combinam IA tradicional e IA generativa.", score: 2 },
        ],
      },
      {
        id: "tec_q1e", pillar: "tecnologia", type: "single",
        text: "Esses projetos se integram a sistemas internos, como CRM, Slack, ERP ou outras ferramentas da empresa?",
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: "Não", note: "Os projetos não se integram a nenhum sistema interno.", score: 0 },
          { value: 2, label: "Alguns", note: "Parte dos projetos se integra a sistemas internos.", score: 1 },
          { value: 3, label: "Sim", note: "Os projetos se integram a sistemas internos como CRM, Slack ou ERP.", score: 2 },
        ],
      },
      {
        id: "tec_q1f", pillar: "tecnologia", type: "single",
        text: "Algum projeto de IA já entregou resultado concreto e mensurável para o negócio, como redução de custo, ganho de tempo ou aumento de receita?",
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: "Não", note: "Nenhum projeto de IA entregou resultado concreto e mensurável até agora.", score: 0 },
          { value: 2, label: "Sim", note: "Pelo menos um projeto de IA já entregou resultado concreto e mensurável.", score: 1 },
        ],
      },
      {
        id: "tec_q1g", pillar: "tecnologia", type: "single",
        text: "Quando um projeto de IA funciona bem em uma área, a empresa consegue expandir essa solução para outras áreas sem precisar reconstruir tudo do zero?",
        showIf: { qId: "tec_q1", values: [2] },
        options: [
          { value: 1, label: "Não reutilizável", note: "Não, as soluções de IA geralmente são construídas para uma área específica e precisam ser reconstruídas para outras.", score: 0 },
          { value: 2, label: "Parcialmente reutilizável", note: "Parcialmente, algumas partes podem ser reutilizadas, mas a expansão ainda exige retrabalho significativo.", score: 1 },
          { value: 3, label: "Totalmente reutilizável", note: "Sim, as soluções de IA são projetadas para serem reutilizáveis e escaláveis em diferentes áreas da empresa.", score: 2 },
        ],
      },
      // Branch: 5 or more projects
      {
        id: "tec_q2a", pillar: "tecnologia", type: "single",
        text: "Esses projetos são atualizados com frequência?",
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: "Não", note: "Os projetos não são atualizados com frequência.", score: 0 },
          { value: 2, label: "Às vezes", note: "Os projetos são atualizados de vez em quando.", score: 1 },
          { value: 3, label: "Sim", note: "Os projetos são atualizados com frequência.", score: 2 },
        ],
      },
      {
        id: "tec_q2b", pillar: "tecnologia", type: "single",
        text: "As soluções de IA existentes são iniciativas pontuais ou já fazem parte de um ecossistema integrado?",
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: "Iniciativas pontuais", note: "As soluções de IA são pontuais e desconectadas entre si.", score: 0 },
          { value: 2, label: "Algumas conexões", note: "Existem algumas conexões entre as soluções de IA existentes.", score: 1 },
          { value: 3, label: "Ecossistema integrado", note: "As soluções de IA fazem parte de um ecossistema integrado.", score: 2 },
        ],
      },
      {
        id: "tec_q2c", pillar: "tecnologia", type: "single",
        text: "Os projetos existentes são baseados em IA tradicional, LLMs/IA generativa ou uma combinação dos dois?",
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: "Não sei", note: "Não há clareza sobre que tipo de IA os projetos utilizam.", score: 0 },
          { value: 2, label: "Apenas LLM / IA generativa", note: "Os projetos usam apenas IA generativa ou LLMs.", score: 1 },
          { value: 3, label: "Apenas IA tradicional", note: "Os projetos usam apenas IA tradicional, com modelos preditivos.", score: 1 },
          { value: 4, label: "Misto", note: "Os projetos combinam IA tradicional e IA generativa.", score: 2 },
        ],
      },
      {
        id: "tec_q2d", pillar: "tecnologia", type: "single",
        text: "Esses projetos se integram a sistemas internos, como CRM, Slack, ERP ou outras ferramentas da empresa?",
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: "Não", note: "Os projetos não se integram a nenhum sistema interno.", score: 0 },
          { value: 2, label: "Alguns", note: "Parte dos projetos se integra a sistemas internos.", score: 1 },
          { value: 3, label: "Sim", note: "Os projetos se integram a sistemas internos como CRM, Slack ou ERP.", score: 2 },
        ],
      },
      {
        id: "tec_q2e", pillar: "tecnologia", type: "single",
        text: "Algum projeto de IA já entregou resultado concreto e mensurável para o negócio, como redução de custo, ganho de tempo ou aumento de receita?",
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: "Não", note: "Nenhum projeto de IA entregou resultado concreto e mensurável até agora.", score: 0 },
          { value: 2, label: "Sim", note: "Pelo menos um projeto de IA já entregou resultado concreto e mensurável.", score: 1 },
        ],
      },
      {
        id: "tec_q2f", pillar: "tecnologia", type: "single",
        text: "Quando um projeto de IA funciona bem em uma área, a empresa consegue expandir essa solução para outras áreas sem precisar reconstruir tudo do zero?",
        showIf: { qId: "tec_q1", values: [3] },
        options: [
          { value: 1, label: "Não reutilizável", note: "Não, as soluções de IA geralmente são construídas para uma área específica e precisam ser reconstruídas para outras.", score: 0 },
          { value: 2, label: "Parcialmente reutilizável", note: "Parcialmente, algumas partes podem ser reutilizadas, mas a expansão ainda exige retrabalho significativo.", score: 1 },
          { value: 3, label: "Totalmente reutilizável", note: "Sim, as soluções de IA são projetadas para serem reutilizáveis e escaláveis em diferentes áreas da empresa.", score: 2 },
        ],
      },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = SECTIONS.flatMap(s => s.questions);

export const PILLAR_CONFIG: PillarConfig[] = [
  { id: "dados",      title: "Dados",                weight: 0.25 },
  { id: "estrategia", title: "Estratégia",            weight: 0.20 },
  { id: "pessoas",    title: "Pessoas e Cultura",     weight: 0.15 },
  { id: "governanca", title: "Governança e Processo", weight: 0.15 },
  { id: "tecnologia", title: "Tecnologia",            weight: 0.25 },
];

export const LEVEL_ORDER = ["Prontidão Baixa", "Prontidão Emergente", "Prontidão Moderada", "Prontidão Alta", "Prontidão Avançada"];

export const LEVEL_META: Record<string, { key: string; desc: string }> = {
  "Prontidão Baixa":     { key: "low",      desc: "Sua organização ainda está construindo as bases necessárias para a IA. Antes de escalar iniciativas de IA, concentre-se em estratégia, dados, governança e prontidão técnica." },
  "Prontidão Emergente": { key: "emerging", desc: "Sua organização começou a se preparar para a IA, mas ainda existem lacunas importantes. São necessárias melhorias direcionadas antes que a IA possa ser escalada de forma confiável." },
  "Prontidão Moderada":  { key: "moderate", desc: "Sua organização possui uma base razoável para a adoção de IA e pode estar pronta para pilotos focados, mas deveria fortalecer as áreas mais fracas antes de escalar amplamente." },
  "Prontidão Alta":      { key: "high",     desc: "Sua organização está bem posicionada para implementar e escalar iniciativas de IA selecionadas, desde que a governança, o monitoramento e a mensuração de valor permaneçam sólidos." },
  "Prontidão Avançada":  { key: "advanced", desc: "Sua organização possui uma base sólida para adotar, escalar e melhorar continuamente a IA em todo o negócio." },
};

export const RECOMMENDATIONS: Record<string, string> = {
  dados:      "Mapeie as fontes de dados críticas, resolva lacunas de qualidade e acesso, e defina responsáveis antes de escalar iniciativas de IA.",
  estrategia: "Transforme a visão de IA em um roadmap priorizado, com casos de uso, responsáveis, métricas de valor e horizonte de execução claro.",
  pessoas:    "Combine capacitação, comunicação e gestão de mudança para que as equipes entendam onde usar IA e como incorporar novas soluções ao trabalho.",
  governanca: "Defina políticas, controles e responsabilidades para segurança, privacidade, revisão humana e acompanhamento de iniciativas de IA.",
  tecnologia: "Estabeleça uma base técnica para conectar dados, integrar sistemas, monitorar modelos e levar pilotos para produção com menor retrabalho.",
};

export function isQuestionVisible(q: Question, sectionQuestions: Question[], answers: AnswerRecord): boolean {
  if (!q.showIf) return true;
  const parentAnswer = answers[q.showIf.qId];
  if (typeof parentAnswer !== "number") return false;
  const parentQ = sectionQuestions.find(p => p.id === q.showIf!.qId);
  if (parentQ && !isQuestionVisible(parentQ, sectionQuestions, answers)) return false;
  return q.showIf.values.includes(parentAnswer);
}

function getQuestionScore(q: Question, answers: AnswerRecord): number | null {
  if (q.type === "text") return null;
  const answer = answers[q.id];
  if (answer === undefined || answer === null) return null;
  if (q.type === "multi") {
    const selected = Array.isArray(answer) ? (answer as number[]) : [];
    const noneValues = (q as MultiQuestion).options.filter(o => o.isNone).map(o => o.value);
    if (selected.some(v => noneValues.includes(v))) return 0;
    return (q as MultiQuestion).options
      .filter(o => !o.isNone && selected.includes(o.value))
      .reduce((sum, o) => sum + o.score, 0);
  }
  if (q.type === "single") {
    const opt = (q as SingleQuestion).options.find(o => o.value === (answer as number));
    return opt ? opt.score : null;
  }
  return null;
}

function getQuestionMax(q: Question): number {
  if (q.type === "single") return Math.max(...q.options.map(o => o.score));
  if (q.type === "multi") return q.options.filter(o => !o.isNone).reduce((sum, o) => sum + o.score, 0);
  return 0;
}

export function calculatePillarScores(answers: AnswerRecord): PillarScore[] {
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
    return { id: p.id, title: p.title, weight: p.weight, score };
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

export function applyBlockerRules(weightedScore: number, pillarScores: PillarScore[]): AssessmentResult {
  let level = getReadinessLevel(weightedScore);
  let blocker: string | null = null;
  const byId = Object.fromEntries(pillarScores.map(p => [p.id, p]));

  function capAt(cap: string, msg: string) {
    if (LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(cap)) {
      level = cap;
      blocker = "Sua pontuação geral é promissora, mas " + msg;
    }
  }

  if (byId.tecnologia?.score < 40) capAt("Prontidão Moderada", "sua pontuação em Tecnologia limita a capacidade atual de implantar IA além de pilotos.");
  if (byId.dados?.score      < 40) capAt("Prontidão Emergente",  "sua pontuação em Dados limita a capacidade atual de escalar IA de forma confiável.");
  if (byId.governanca?.score < 40) capAt("Prontidão Emergente",  "sua pontuação em Governança e Processo limita a capacidade atual de gerenciar IA de forma responsável em escala.");

  return { score: weightedScore, level, blocker };
}

export function getPillarTier(score: number) {
  if (score >= 90) return { key: "advanced", label: "Avançado",           barClass: "rpt-bar-advanced", pctClass: "rpt-pct-advanced" };
  if (score >= 75) return { key: "high",     label: "Forte",              barClass: "rpt-bar-high",     pctClass: "rpt-pct-high" };
  if (score >= 60) return { key: "moderate", label: "Moderado",           barClass: "rpt-bar-moderate", pctClass: "rpt-pct-moderate" };
  if (score >= 40) return { key: "emerging", label: "Em desenvolvimento", barClass: "rpt-bar-emerging", pctClass: "rpt-pct-emerging" };
  return             { key: "low",     label: "Lacunas fundamentais", barClass: "rpt-bar-low",      pctClass: "rpt-pct-low" };
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
