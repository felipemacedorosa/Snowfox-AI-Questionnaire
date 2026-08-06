import { AnswerRecord } from "./data";
import { Bilingual, DEFAULT_LANG, Lang, bi, pick } from "./i18n";
import type { CriticalPathGate } from "./resultAnalysis";
import { buildQuestionEvidence } from "./resultAnalysis";
import type { QuarterlyRecommendation } from "./resultInsights";

type ActivityId =
  | "data-readiness"
  | "data-preparation"
  | "data-capabilities"
  | "data-quality"
  | "data-observability"
  | "analytics-capabilities"
  | "metadata-practices"
  | "ai-vision"
  | "portfolio-prioritization"
  | "strategy-roadmap"
  | "ai-leadership"
  | "pilot-sandbox"
  | "value-monitoring"
  | "resourcing-model"
  | "change-readiness"
  | "ai-literacy"
  | "process-operating-model"
  | "ai-governance"
  | "reference-architecture"
  | "mlops-observability"
  | "platform-reuse";

interface ActivityDefinition {
  lane: "data" | "strategy" | "value" | "organization" | "people" | "governance" | "engineering";
  title: Bilingual;
  action: Bilingual;
  outcome: Bilingual;
  ownerRole: Bilingual;
  dependency: Bilingual;
  successMetric: Bilingual;
}

const ACTIVITIES: Record<ActivityId, ActivityDefinition> = {
  "data-readiness": {
    lane: "data",
    title: bi("Avaliar a prontidão dos dados para IA", "Assess data readiness for AI"),
    action: bi(
      "Entregável inicial: inventariar as fontes do caso prioritário e registrar cobertura, histórico, acesso, responsável e lacunas de qualidade.",
      "First deliverable: inventory the priority use case's sources and record coverage, history, access, ownership, and quality gaps.",
    ),
    outcome: bi("um plano de prontidão de dados limitado ao primeiro caso de uso", "a data-readiness plan bounded to the first use case"),
    ownerRole: bi("Liderança de Dados e área de negócio", "Data leadership and the business function"),
    dependency: bi("Caso de uso e decisões que ele apoiará definidos", "Use case and the decisions it will support defined"),
    successMetric: bi("100% das fontes críticas com responsável, acesso e lacuna documentados", "100% of critical sources have documented ownership, access, and gaps"),
  },
  "data-preparation": {
    lane: "data",
    title: bi("Implementar um plano de preparação de dados", "Implement a data preparation plan"),
    action: bi(
      "Entregável inicial: definir como capturar, consolidar e preservar o histórico necessário para o caso prioritário, com responsáveis e marcos de disponibilidade.",
      "First deliverable: define how to capture, consolidate, and retain the history required for the priority use case, with owners and availability milestones.",
    ),
    outcome: bi("histórico utilizável e contínuo para análises e modelos futuros", "usable, continuous history for future analytics and models"),
    ownerRole: bi("Engenharia de Dados e área de negócio", "Data Engineering and the business function"),
    dependency: bi("Horizonte histórico e decisões prioritárias definidos", "Required history and priority decisions defined"),
    successMetric: bi("Fontes prioritárias com captura recorrente, retenção e cobertura histórica medidas", "Priority sources have recurring capture, retention, and measured historical coverage"),
  },
  "data-capabilities": {
    lane: "data",
    title: bi("Evoluir as capacidades de acesso a dados para IA", "Evolve data-access capabilities for AI"),
    action: bi(
      "Entregável inicial: disponibilizar as fontes do caso prioritário por acessos governados e repetíveis, com catálogo mínimo e sem solicitações manuais recorrentes.",
      "First deliverable: make priority-use-case sources available through governed, repeatable access with a minimum catalog and no recurring manual requests.",
    ),
    outcome: bi("dados acessíveis por equipes e sistemas autorizados com menos dependência operacional", "data accessible to authorized teams and systems with less operational dependency"),
    ownerRole: bi("Engenharia e Governança de Dados", "Data Engineering and Data Governance"),
    dependency: bi("Fontes prioritárias, consumidores e permissões identificados", "Priority sources, consumers, and permissions identified"),
    successMetric: bi("Fontes críticas catalogadas e disponíveis por acesso repetível com prazo medido", "Critical sources cataloged and available through repeatable access with measured lead time"),
  },
  "data-quality": {
    lane: "data",
    title: bi("Estabelecer um framework de qualidade de dados", "Establish a data quality framework"),
    action: bi(
      "Entregável inicial: definir regras mensuráveis de completude, precisão, atualidade e rastreabilidade para as fontes que sustentam o caso prioritário.",
      "First deliverable: define measurable completeness, accuracy, freshness, and traceability rules for the sources supporting the priority use case.",
    ),
    outcome: bi("um scorecard de qualidade que permita confiar nas decisões e modelos", "a quality scorecard that supports trust in decisions and models"),
    ownerRole: bi("Liderança de Dados e donos dos domínios", "Data leadership and domain owners"),
    dependency: bi("Fontes críticas e responsáveis identificados", "Critical sources and owners identified"),
    successMetric: bi("Fontes prioritárias medidas contra limites aprovados e com plano de correção", "Priority sources measured against approved thresholds with remediation plans"),
  },
  "data-observability": {
    lane: "data",
    title: bi("Implementar observabilidade de dados", "Implement data observability"),
    action: bi(
      "Entregável inicial: monitorar atualização, disponibilidade e falhas das fontes usadas pelo primeiro fluxo de IA, com alertas e responsáveis definidos.",
      "First deliverable: monitor freshness, availability, and failures for sources used by the first AI workflow, with defined alerts and owners.",
    ),
    outcome: bi("problemas de dados detectados antes de afetarem decisões ou soluções", "data issues detected before they affect decisions or solutions"),
    ownerRole: bi("Engenharia de Dados", "Data Engineering"),
    dependency: bi("Regras mínimas de qualidade acordadas", "Minimum quality rules agreed"),
    successMetric: bi("Alertas ativos para atualização e falhas, com tempo de resposta acompanhado", "Active freshness and failure alerts with tracked response time"),
  },
  "analytics-capabilities": {
    lane: "data",
    title: bi("Desenvolver capacidades de analytics para IA", "Develop analytics capabilities for AI"),
    action: bi(
      "Entregável inicial: definir a camada analítica mínima para o caso prioritário, incluindo fontes, modelo de consumo, atualização e acesso pelas áreas responsáveis.",
      "First deliverable: define the minimum analytics layer for the priority use case, including sources, consumption model, refresh, and access for responsible functions.",
    ),
    outcome: bi("dados preparados para consumo recorrente por análises e soluções de IA", "data prepared for recurring consumption by analytics and AI solutions"),
    ownerRole: bi("Dados, Analytics e área de negócio", "Data, Analytics, and the business function"),
    dependency: bi("Caso prioritário e consumidores dos dados identificados", "Priority use case and data consumers identified"),
    successMetric: bi("Camada analítica disponível, atualizada e utilizada pelo fluxo prioritário", "Analytics layer available, refreshed, and used by the priority workflow"),
  },
  "metadata-practices": {
    lane: "data",
    title: bi("Adaptar práticas de metadados para IA", "Adapt metadata practices for AI"),
    action: bi(
      "Entregável inicial: catalogar os conjuntos prioritários com significado, origem, responsável, sensibilidade, atualização e usos permitidos.",
      "First deliverable: catalog priority datasets with meaning, origin, owner, sensitivity, refresh, and permitted uses.",
    ),
    outcome: bi("dados localizáveis e compreensíveis para consumo seguro por negócio e IA", "discoverable, understandable data for safe business and AI consumption"),
    ownerRole: bi("Governança e Arquitetura de Dados", "Data Governance and Architecture"),
    dependency: bi("Conjuntos de dados prioritários identificados", "Priority datasets identified"),
    successMetric: bi("Dados prioritários catalogados com responsável, linhagem e uso permitido", "Priority data cataloged with ownership, lineage, and permitted use"),
  },
  "ai-vision": {
    lane: "strategy",
    title: bi("Definir a visão e a tese de valor para IA", "Define the AI vision and value thesis"),
    action: bi(
      "Entregável inicial: alinhar liderança sobre três problemas prioritários, impacto econômico esperado e critérios para decidir onde IA deve ser aplicada.",
      "First deliverable: align leadership on three priority problems, expected economic impact, and criteria for deciding where AI should be applied.",
    ),
    outcome: bi("uma visão de IA conectada a decisões e valor, não a ferramentas isoladas", "an AI vision connected to decisions and value rather than isolated tools"),
    ownerRole: bi("Patrocinador executivo de IA", "AI executive sponsor"),
    dependency: bi("Dores estratégicas das áreas levantadas", "Strategic pain points collected from business functions"),
    successMetric: bi("Visão aprovada com problemas, valor esperado e critérios de sucesso", "Approved vision with problems, expected value, and success criteria"),
  },
  "portfolio-prioritization": {
    lane: "value",
    title: bi("Priorizar os casos de uso iniciais de IA", "Prioritize initial AI use cases"),
    action: bi(
      "Entregável inicial: comparar candidatos por valor, viabilidade, risco e tempo até resultado e aprovar um primeiro caso com linha de base.",
      "First deliverable: compare candidates by value, feasibility, risk, and time to outcome, then approve one initial case with a baseline.",
    ),
    outcome: bi("um portfólio inicial pequeno, comparável e orientado a resultado", "a small, comparable, outcome-led initial portfolio"),
    ownerRole: bi("Comitê executivo de IA", "AI executive committee"),
    dependency: bi("Tese de valor e critérios de seleção acordados", "Value thesis and selection criteria agreed"),
    successMetric: bi("Caso aprovado com patrocinador, linha de base, meta e decisão de continuidade", "Approved case with sponsor, baseline, target, and continuation decision"),
  },
  "strategy-roadmap": {
    lane: "strategy",
    title: bi("Estabelecer metas de adoção e um roadmap revisável", "Set adoption goals and a reviewable roadmap"),
    action: bi(
      "Entregável inicial: documentar iniciativas, responsáveis, dependências e metas de adoção para 12 meses, com revisão trimestral de valor e prioridade.",
      "First deliverable: document initiatives, owners, dependencies, and adoption goals for 12 months, with quarterly value and priority reviews.",
    ),
    outcome: bi("uma estratégia comunicável que possa ser refinada conforme os resultados", "a communicable strategy that can be refined as results emerge"),
    ownerRole: bi("Patrocinador executivo e líder de IA", "Executive sponsor and AI leader"),
    dependency: bi("Casos iniciais priorizados", "Initial use cases prioritized"),
    successMetric: bi("Roadmap aprovado, comunicado e com calendário de revisão", "Roadmap approved, communicated, and assigned a review calendar"),
  },
  "ai-leadership": {
    lane: "organization",
    title: bi("Definir liderança e direitos de decisão para IA", "Define AI leadership and decision rights"),
    action: bi(
      "Entregável inicial: nomear um líder de IA e registrar quem prioriza, aprova risco, libera recursos e decide escalar ou encerrar iniciativas.",
      "First deliverable: appoint an AI leader and document who prioritizes, approves risk, allocates resources, and decides whether initiatives scale or stop.",
    ),
    outcome: bi("decisões mais rápidas e responsabilidade visível sobre a agenda de IA", "faster decisions and visible accountability for the AI agenda"),
    ownerRole: bi("Diretoria executiva", "Executive leadership"),
    dependency: bi("Mandato e patrocinador executivo acordados", "Mandate and executive sponsor agreed"),
    successMetric: bi("Matriz de decisão publicada com responsáveis e prazos de aprovação", "Published decision matrix with owners and approval timeframes"),
  },
  "pilot-sandbox": {
    lane: "engineering",
    title: bi("Criar um ambiente controlado para pilotos de IA", "Set up a controlled environment for AI pilots"),
    action: bi(
      "Entregável inicial: disponibilizar um sandbox com dados permitidos, controles mínimos, critérios de teste e uma decisão explícita de escalar, ajustar ou encerrar.",
      "First deliverable: provide a sandbox with permitted data, minimum controls, test criteria, and an explicit scale, adjust, or stop decision.",
    ),
    outcome: bi("experimentos comparáveis que gerem aprendizado reutilizável", "comparable experiments that produce reusable learning"),
    ownerRole: bi("Engenharia de IA e Segurança", "AI Engineering and Security"),
    dependency: bi("Caso delimitado, responsável e dados permitidos", "Bounded use case, owner, and permitted data"),
    successMetric: bi("Piloto concluído com métricas e decisão registrada", "Pilot completed with metrics and a recorded decision"),
  },
  "value-monitoring": {
    lane: "value",
    title: bi("Configurar um sistema de monitoramento de valor de IA", "Set up an AI value monitoring system"),
    action: bi(
      "Entregável inicial: vincular cada iniciativa a uma linha de base e acompanhar benefício, custo, adoção e desempenho em uma revisão mensal.",
      "First deliverable: tie every initiative to a baseline and track benefit, cost, adoption, and performance in a monthly review.",
    ),
    outcome: bi("decisões de portfólio baseadas em valor realizado, não em atividade", "portfolio decisions based on realized value rather than activity"),
    ownerRole: bi("Liderança de Produto e Finanças", "Product and Finance leadership"),
    dependency: bi("Métricas de negócio e custos identificados", "Business metrics and costs identified"),
    successMetric: bi("Cada iniciativa ativa possui linha de base, meta, custo e valor realizado", "Every active initiative has a baseline, target, cost, and realized value"),
  },
  "resourcing-model": {
    lane: "organization",
    title: bi("Criar um plano de recursos e modelo de parceria para IA", "Create an AI resourcing and partnership plan"),
    action: bi(
      "Entregável inicial: mapear capacidades necessárias, lacunas internas e o que será contratado, desenvolvido ou coberto por parceiros no primeiro caso.",
      "First deliverable: map required capabilities, internal gaps, and what will be hired, developed, or covered by partners for the first use case.",
    ),
    outcome: bi("um time viável com responsabilidades internas preservadas", "a viable team with retained internal accountability"),
    ownerRole: bi("Liderança de Tecnologia e Pessoas", "Technology and People leadership"),
    dependency: bi("Portfólio inicial e arquitetura de entrega definidos", "Initial portfolio and delivery architecture defined"),
    successMetric: bi("Cada capacidade crítica possui responsável e plano de cobertura", "Every critical capability has an owner and coverage plan"),
  },
  "change-readiness": {
    lane: "people",
    title: bi("Criar um plano de mudança e prontidão da força de trabalho", "Create a workforce change and readiness plan"),
    action: bi(
      "Entregável inicial: avaliar impacto no fluxo, identificar usuários-chave e resistências e definir comunicação, suporte e acompanhamento de adoção.",
      "First deliverable: assess workflow impact, identify key users and resistance, and define communication, support, and adoption tracking.",
    ),
    outcome: bi("mudança incorporada ao trabalho, com barreiras tratadas cedo", "change embedded in work, with barriers addressed early"),
    ownerRole: bi("Pessoas, Change e liderança da área piloto", "People, Change, and pilot-function leadership"),
    dependency: bi("Fluxo e usuários afetados identificados", "Affected workflow and users identified"),
    successMetric: bi("Adoção ativa, barreiras registradas e plano de resposta em execução", "Active adoption, logged barriers, and an active response plan"),
  },
  "ai-literacy": {
    lane: "people",
    title: bi("Lançar um programa aplicado de alfabetização em IA", "Launch an applied AI literacy program"),
    action: bi(
      "Entregável inicial: capacitar usuários e líderes do caso prioritário em uso seguro, limites, revisão humana e novas práticas de trabalho.",
      "First deliverable: train users and leaders in the priority use case on safe use, limitations, human review, and new work practices.",
    ),
    outcome: bi("equipes capazes de adotar IA com julgamento e responsabilidade", "teams able to adopt AI with judgment and accountability"),
    ownerRole: bi("Pessoas e liderança da área piloto", "People and pilot-function leadership"),
    dependency: bi("Caso de uso e públicos prioritários definidos", "Use case and priority audiences defined"),
    successMetric: bi("Público prioritário capacitado e aplicação observada no fluxo real", "Priority audience trained with observed application in the real workflow"),
  },
  "process-operating-model": {
    lane: "organization",
    title: bi("Documentar o processo e definir o modelo operacional", "Document the process and define the operating model"),
    action: bi(
      "Entregável inicial: registrar etapas, exceções, decisões, responsáveis e pontos de revisão humana do fluxo escolhido antes de automatizá-lo.",
      "First deliverable: document steps, exceptions, decisions, owners, and human-review points in the selected workflow before automating it.",
    ),
    outcome: bi("um fluxo executável que alinhe negócio, tecnologia e controles", "an executable workflow aligning business, technology, and controls"),
    ownerRole: bi("Liderança da área e Operações", "Business-function leadership and Operations"),
    dependency: bi("Processo prioritário e objetivo operacional definidos", "Priority process and operating objective defined"),
    successMetric: bi("Fluxo aprovado com exceções, decisões e responsáveis documentados", "Approved workflow with documented exceptions, decisions, and owners"),
  },
  "ai-governance": {
    lane: "governance",
    title: bi("Definir políticas iniciais e direitos de decisão para IA", "Define initial AI policies and decision rights"),
    action: bi(
      "Entregável inicial: aprovar regras de uso, dados, privacidade, segurança, revisão humana, responsabilização e escalonamento de incidentes.",
      "First deliverable: approve rules for use, data, privacy, security, human review, accountability, and incident escalation.",
    ),
    outcome: bi("um perímetro de governança aplicável ao primeiro piloto", "a governance perimeter applicable to the first pilot"),
    ownerRole: bi("Risco, Jurídico, Segurança e Tecnologia", "Risk, Legal, Security, and Technology"),
    dependency: bi("Riscos prioritários e apetite de risco definidos", "Priority risks and risk appetite defined"),
    successMetric: bi("Controles mínimos aprovados, aplicados e com evidência de revisão", "Minimum controls approved, applied, and evidenced through review"),
  },
  "reference-architecture": {
    lane: "engineering",
    title: bi("Definir uma arquitetura de referência para IA", "Define an AI reference architecture"),
    action: bi(
      "Entregável inicial: documentar dados, integrações, modelos, segurança, ambientes, fornecedores e caminho de produção para o primeiro caso.",
      "First deliverable: document data, integrations, models, security, environments, vendors, and the production path for the first use case.",
    ),
    outcome: bi("um desenho técnico repetível que reduza atrasos e escolhas isoladas", "a repeatable technical design that reduces delays and isolated choices"),
    ownerRole: bi("CTO, Arquitetura e Engenharia", "CTO, Architecture, and Engineering"),
    dependency: bi("Caso de uso, requisitos e sistemas envolvidos definidos", "Use case, requirements, and involved systems defined"),
    successMetric: bi("Arquitetura aprovada com integrações, controles e caminho de produção", "Approved architecture with integrations, controls, and production path"),
  },
  "mlops-observability": {
    lane: "engineering",
    title: bi("Estabelecer práticas de MLOps e observabilidade de IA", "Establish MLOps and AI observability practices"),
    action: bi(
      "Entregável inicial: definir atualização, versionamento, monitoramento, alertas, suporte e resposta a degradação para soluções em produção.",
      "First deliverable: define updates, versioning, monitoring, alerts, support, and degradation response for production solutions.",
    ),
    outcome: bi("soluções operáveis com desempenho e falhas visíveis", "operable solutions with visible performance and failures"),
    ownerRole: bi("Engenharia de IA e Plataforma", "AI Engineering and Platform"),
    dependency: bi("Solução integrada e métricas técnicas definidas", "Integrated solution and technical metrics defined"),
    successMetric: bi("Soluções em produção com versão, métricas, alertas e responsável operacional", "Production solutions have versions, metrics, alerts, and an operating owner"),
  },
  "platform-reuse": {
    lane: "engineering",
    title: bi("Padronizar componentes e práticas de engenharia de plataforma", "Standardize components and platform-engineering practices"),
    action: bi(
      "Entregável inicial: transformar integrações, controles, padrões de design e monitoramento comprovados em componentes reutilizáveis.",
      "First deliverable: turn proven integrations, controls, design patterns, and monitoring into reusable components.",
    ),
    outcome: bi("expansão para novas áreas com menos reconstrução e risco", "expansion into new functions with less rebuilding and risk"),
    ownerRole: bi("Engenharia de Plataforma", "Platform Engineering"),
    dependency: bi("Primeira solução integrada com resultado demonstrado", "First integrated solution with demonstrated results"),
    successMetric: bi("Nova implementação reutiliza componentes documentados e reduz esforço de entrega", "A new implementation reuses documented components and reduces delivery effort"),
  },
};

const QUESTION_ACTIVITY: Record<string, ActivityId> = {
  dados_q1: "data-readiness",
  dados_q2: "data-capabilities",
  dados_q3: "process-operating-model",
  dados_q4: "data-preparation",
  dados_q5: "data-observability",
  dados_q6: "ai-governance",
  dados_q7: "data-quality",
  dados_q8: "analytics-capabilities",
  dados_q9: "metadata-practices",
  est_q1: "ai-vision",
  est_q1a: "portfolio-prioritization",
  est_q1a1: "strategy-roadmap",
  est_q1a1a: "strategy-roadmap",
  est_q1b: "ai-vision",
  est_q2: "ai-vision",
  est_q3: "ai-leadership",
  est_q3a: "process-operating-model",
  pess_q1: "strategy-roadmap",
  pess_q2: "pilot-sandbox",
  pess_q2a: "pilot-sandbox",
  pess_q3: "resourcing-model",
  pess_q4: "change-readiness",
  pess_q5: "portfolio-prioritization",
  pess_q5a: "portfolio-prioritization",
  pess_q6: "ai-literacy",
  gov_q1: "process-operating-model",
  gov_q2: "ai-governance",
  tec_q1: "pilot-sandbox",
  tec_q1b: "reference-architecture",
  tec_q1c: "mlops-observability",
  tec_q1d: "reference-architecture",
  tec_q1e: "reference-architecture",
  tec_q1f: "value-monitoring",
  tec_q1g: "platform-reuse",
  tec_q2a: "mlops-observability",
  tec_q2b: "platform-reuse",
  tec_q2c: "reference-architecture",
  tec_q2d: "reference-architecture",
  tec_q2e: "value-monitoring",
  tec_q2f: "platform-reuse",
};

function activityForGate(gate: CriticalPathGate, answers: AnswerRecord): ActivityId {
  if (gate.id !== "est_q3a") return QUESTION_ACTIVITY[gate.id] ?? "portfolio-prioritization";
  const delayCause = answers.est_q3a1;
  if (delayCause === 1) return "change-readiness";
  if (delayCause === 3) return "ai-leadership";
  if (delayCause === 4) return "reference-architecture";
  if (delayCause === 5) return "ai-governance";
  return "process-operating-model";
}

const PERIODS: Record<Lang, string[]> = {
  pt: ["Próximo trimestre", "Trimestre seguinte", "Terceiro trimestre"],
  en: ["Next quarter", "Following quarter", "Third quarter"],
};

const EFFORTS: Record<Lang, string[]> = {
  pt: ["Médio", "Médio", "Alto"],
  en: ["Medium", "Medium", "High"],
};

const LANE_LABELS: Record<ActivityDefinition["lane"], Bilingual> = {
  data: bi("Dados para IA", "AI Data"),
  strategy: bi("Estratégia de IA", "AI Strategy"),
  value: bi("Valor da IA", "AI Value"),
  organization: bi("Organização de IA", "AI Organization"),
  people: bi("Pessoas e Cultura", "AI People & Culture"),
  governance: bi("Governança de IA", "AI Governance"),
  engineering: bi("Engenharia de IA", "AI Engineering"),
};

export function buildQuestionLedRoadmap(
  gates: CriticalPathGate[],
  answers: AnswerRecord,
  lang: Lang = DEFAULT_LANG,
): QuarterlyRecommendation[] | null {
  if (gates.length === 0) return null;

  const selected = gates.reduce<Array<{ activityId: ActivityId; gate: CriticalPathGate }>>((items, gate) => {
    const activityId = activityForGate(gate, answers);
    if (!items.some(item => item.activityId === activityId)) items.push({ activityId, gate });
    return items;
  }, []).slice(0, 3);

  return selected.map(({ activityId, gate }, index) => {
    const activity = ACTIVITIES[activityId];
    return {
      id: (["q1", "q2", "q3"] as const)[index],
      priorityId: gate.pillar,
      period: PERIODS[lang][index],
      focus: pick(LANE_LABELS[activity.lane], lang),
      title: pick(activity.title, lang),
      action: pick(activity.action, lang),
      outcome: pick(activity.outcome, lang),
      ownerRole: pick(activity.ownerRole, lang),
      dependency: pick(activity.dependency, lang),
      effort: EFFORTS[lang][index],
      successMetric: pick(activity.successMetric, lang),
      questionLedActivity: true,
    };
  });
}

export function buildLowestPillarRoadmap(
  answers: AnswerRecord,
  lowestPillar: string,
  lang: Lang = DEFAULT_LANG,
): QuarterlyRecommendation[] | null {
  const isContextualDataGap = (id: string) => lowestPillar === "dados" && (
    (id === "dados_q8" && answers.dados_q8 === 1)
    || (id === "dados_q9" && answers.dados_q8 === 2 && answers.dados_q9 === 1)
  );
  const gaps = buildQuestionEvidence(answers, lang)
    .filter(item =>
      item.pillar === lowestPillar
      && (
        (item.normalizedScore !== null && item.normalizedScore < 100 && item.targetState)
        || isContextualDataGap(item.id)
      )
    )
    .sort((a, b) => {
      if (isContextualDataGap(a.id) && !isContextualDataGap(b.id)) return 1;
      if (isContextualDataGap(b.id) && !isContextualDataGap(a.id)) return -1;
      if (a.kind === "risk" && b.kind !== "risk") return -1;
      if (b.kind === "risk" && a.kind !== "risk") return 1;
      return (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100);
    })
    .map(item => ({
      id: item.id,
      pillar: item.pillar,
      pillarTitle: item.sectionTitle,
      question: item.question,
      currentState: item.answer,
      targetState: item.targetState ?? "",
      reason: "",
      dependency: "",
      normalizedScore: item.normalizedScore ?? 0,
      isBlocker: false,
    } satisfies CriticalPathGate));

  return buildQuestionLedRoadmap(gaps, answers, lang);
}
