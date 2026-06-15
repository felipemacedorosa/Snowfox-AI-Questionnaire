export interface Option {
  value: number;
  label: string;
  description: string;
}

export interface Question {
  id: string;
  section: string;
  pillar: string;
  text: string;
  options: Option[];
}

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
  qIds: string[];
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
    id: "strategy", pillar: 1,
    title: "Strategy & Business Alignment",
    desc: "How AI is positioned within your organization's vision, leadership priorities, and strategic goals.",
    questions: [
      { id: "q1", section: "Strategy & Business Alignment", pillar: "strategy", text: "How clearly has your organization defined its AI vision and ambition?", options: [
        { value: 1, label: "No vision",             description: "No AI vision has been defined." },
        { value: 2, label: "Informal interest",      description: "AI is discussed, but there is no formal vision." },
        { value: 3, label: "Partially defined",      description: "A vision exists, but it is not fully aligned or communicated." },
        { value: 4, label: "Clearly defined",        description: "The AI vision is clear and connected to business priorities." },
        { value: 5, label: "Strategically embedded", description: "The AI vision is formalized, communicated, measured, and actively guides investment." },
      ]},
      { id: "q2", section: "Strategy & Business Alignment", pillar: "strategy", text: "How well is AI connected to your company's broader business strategy and growth priorities?", options: [
        { value: 1, label: "Not connected",    description: "AI is not linked to business strategy." },
        { value: 2, label: "Loosely related",  description: "AI is seen as useful, but not strategically connected." },
        { value: 3, label: "Partially aligned",description: "Some AI initiatives support business goals." },
        { value: 4, label: "Clearly aligned",  description: "AI is clearly aligned with growth and efficiency priorities." },
        { value: 5, label: "Fully integrated", description: "AI is embedded into strategic planning and investment decisions." },
      ]},
      { id: "q3", section: "Strategy & Business Alignment", pillar: "strategy", text: "To what extent does leadership understand the economic potential and organizational impact of AI?", options: [
        { value: 1, label: "Limited awareness",     description: "Leadership has limited understanding of AI's potential." },
        { value: 2, label: "Uneven interest",        description: "Some leaders are interested, but understanding is inconsistent." },
        { value: 3, label: "Basic understanding",    description: "Leadership understands basic AI opportunities and risks." },
        { value: 4, label: "Strong support",         description: "Leadership understands AI's business impact and actively supports initiatives." },
        { value: 5, label: "Driving transformation", description: "Leadership actively drives AI transformation with clear value expectations." },
      ]},
      { id: "q4", section: "Strategy & Business Alignment", pillar: "strategy", text: "Has your organization identified and prioritized the workflows where AI could create the most value?", options: [
        { value: 1, label: "Not identified",          description: "We have not clearly identified where AI could create value." },
        { value: 2, label: "Some ideas, no priority", description: "We have a few AI ideas, but they are not ranked by business value or feasibility." },
        { value: 3, label: "Some prioritized use cases", description: "We have identified some promising workflows for AI, but prioritization is still informal or incomplete." },
        { value: 4, label: "Clear priority workflows",description: "We have clearly prioritized workflows where AI could reduce cost, improve speed, reduce risk, or improve quality." },
        { value: 5, label: "Value-driven AI roadmap", description: "We have a structured AI roadmap focused on the highest-value workflows, with clear business owners, expected impact, and implementation steps." },
      ]},
    ],
  },
  {
    id: "people", pillar: 2,
    title: "People & Culture",
    desc: "Your team's readiness, skill availability, and cross-functional collaboration capacity for AI adoption.",
    questions: [
      { id: "q5", section: "People & Culture", pillar: "people", text: "How prepared are your teams to understand, adopt, and work with AI solutions?", options: [
        { value: 1, label: "Not prepared",             description: "Teams are not prepared to use AI." },
        { value: 2, label: "Curious but informal",     description: "Some employees are curious, but adoption is informal." },
        { value: 3, label: "Starting to adopt",        description: "Some teams are starting to use AI tools." },
        { value: 4, label: "Trained and active",       description: "Teams are trained and increasingly using AI in workflows." },
        { value: 5, label: "Widespread and improving", description: "AI adoption is widespread, supported, and continuously improved." },
      ]},
      { id: "q6", section: "People & Culture", pillar: "people", text: "Does your organization have the necessary AI, data, and technical skills internally, or a clear plan to access them externally?", options: [
        { value: 1, label: "Skills gap",         description: "The organization lacks relevant AI/data skills." },
        { value: 2, label: "Isolated expertise",  description: "A few individuals have skills, but no structured capability." },
        { value: 3, label: "Partial capability",  description: "Some internal capability exists, with notable gaps." },
        { value: 4, label: "Strong capability",   description: "Strong internal or external support is available for AI needs." },
        { value: 5, label: "Mature and scalable", description: "Skills are mature, scalable, and aligned with the AI roadmap." },
      ]},
      { id: "q7", section: "People & Culture", pillar: "people", text: "How well do business, data, technology, and operations teams collaborate on AI-related initiatives?", options: [
        { value: 1, label: "Siloed",              description: "Business and technical teams work separately." },
        { value: 2, label: "Occasional contact",  description: "Collaboration happens occasionally and informally." },
        { value: 3, label: "Some collaboration",  description: "Teams collaborate on some AI initiatives." },
        { value: 4, label: "Structured teamwork", description: "Cross-functional collaboration is structured and consistent." },
        { value: 5, label: "Integrated delivery", description: "Business, data, technology, and operations operate as integrated AI delivery teams." },
      ]},
    ],
  },
  {
    id: "processes", pillar: 3,
    title: "Processes, Governance & Risk",
    desc: "Your frameworks for managing AI initiatives responsibly, at scale, and with clear accountability.",
    questions: [
      { id: "q8", section: "Processes, Governance & Risk", pillar: "processes", text: "How clearly are your core business processes documented and standardized across the organization?", options: [
        { value: 1, label: "Undocumented",          description: "Core processes are undocumented or highly inconsistent." },
        { value: 2, label: "Mostly informal",        description: "Some processes are known, but mostly informal." },
        { value: 3, label: "Partially documented",   description: "Key processes are partially documented." },
        { value: 4, label: "Standardized",           description: "Most core processes are standardized and documented." },
        { value: 5, label: "Measured and optimized", description: "Processes are clearly documented, measured, and continuously improved." },
      ]},
      { id: "q9", section: "Processes, Governance & Risk", pillar: "processes", text: "Does your organization have a clear governance model for selecting, approving, and managing AI initiatives?", options: [
        { value: 1, label: "No governance",      description: "No AI governance exists." },
        { value: 2, label: "Ad hoc decisions",   description: "AI decisions are made informally." },
        { value: 3, label: "Partial governance",  description: "Some governance exists, but roles are unclear." },
        { value: 4, label: "Defined governance",  description: "Governance is defined for selecting and managing AI initiatives." },
        { value: 5, label: "Mature and enforced", description: "Governance is mature, enforced, and integrated into business decision-making." },
      ]},
      { id: "q10", section: "Processes, Governance & Risk", pillar: "processes", text: "Are decision rights clear for AI projects, including who approves priorities, budgets, risks, deployment, and human escalation?", options: [
        { value: 1, label: "No clear ownership",            description: "It is unclear who owns AI decisions or who is responsible when issues come up." },
        { value: 2, label: "Partial ownership",             description: "Some people are involved in AI decisions, but roles and responsibilities are not clearly defined." },
        { value: 3, label: "Basic decision structure",      description: "We know who approves most AI projects, but escalation paths and accountability are not fully clear." },
        { value: 4, label: "Clear decision rights",         description: "AI priorities, budgets, risk approvals, deployment decisions, and human escalation paths are clearly assigned." },
        { value: 5, label: "Strong governance and accountability", description: "Every AI initiative has clear owners, approval steps, escalation rules, and accountability for outcomes." },
      ]},
      { id: "q11", section: "Processes, Governance & Risk", pillar: "processes", text: "Are there clear policies for responsible AI use, including privacy, security, compliance, ethical risk, and acceptable levels of AI autonomy?", options: [
        { value: 1, label: "No AI policies",            description: "We do not have clear rules for how AI should or should not be used." },
        { value: 2, label: "Basic informal rules",       description: "We have some general expectations, but they are not formal, detailed, or consistently followed." },
        { value: 3, label: "Basic responsible AI policies", description: "We have policies for privacy, security, and compliance, but they do not fully address AI autonomy or agentic workflows." },
        { value: 4, label: "Clear responsible AI controls", description: "We have clear rules for AI use, including what AI can access, what it can do, and when humans must approve decisions." },
        { value: 5, label: "Mature AI governance",       description: "We have strong responsible AI policies, guardrails, auditability, human-in-the-loop rules, and clear limits on AI autonomy." },
      ]},
    ],
  },
  {
    id: "data", pillar: 4,
    title: "Data Readiness",
    desc: "The completeness, quality, accessibility, and governance of your organization's data assets.",
    questions: [
      { id: "q12", section: "Data Readiness", pillar: "data", text: "How complete and relevant is the data your organization collects for potential AI use cases?", options: [
        { value: 1, label: "Not collected",    description: "Relevant data is not collected." },
        { value: 2, label: "Limited coverage", description: "Some useful data exists, but coverage is limited." },
        { value: 3, label: "Partial coverage", description: "Data exists for some use cases, with notable gaps." },
        { value: 4, label: "Mostly complete",  description: "Most relevant data is collected and usable." },
        { value: 5, label: "Comprehensive",    description: "Data collection is comprehensive, purposeful, and aligned with AI priorities." },
      ]},
      { id: "q13", section: "Data Readiness", pillar: "data", text: "How accessible is your data to the teams, systems, and approved AI tools that need it?", options: [
        { value: 1, label: "Mostly inaccessible",       description: "Important data is hard to find, locked away, or spread across disconnected systems." },
        { value: 2, label: "Limited access",             description: "Some data is available, but teams often need manual work, approvals, or exports to use it." },
        { value: 3, label: "Partially accessible",       description: "Key data is available for some teams and tools, but access is inconsistent across systems." },
        { value: 4, label: "Mostly accessible",          description: "Most important data is available to the right teams and approved tools through controlled access." },
        { value: 5, label: "Secure and seamless access", description: "Approved teams, systems, and AI tools can securely access the right data at the right time with proper permissions and controls." },
      ]},
      { id: "q14", section: "Data Readiness", pillar: "data", text: "How structured, clean, reliable, and contextualized is your data for AI model development, automation, or agent-assisted workflows?", options: [
        { value: 1, label: "Poor data quality",        description: "Our data is messy, outdated, incomplete, or unreliable." },
        { value: 2, label: "Inconsistent quality",      description: "Some data is useful, but quality issues are common and often need manual cleanup." },
        { value: 3, label: "Usable but not fully AI-ready", description: "Our data is good enough for basic analysis, but it is not consistently structured or contextualized for AI workflows." },
        { value: 4, label: "Mostly AI-ready",           description: "Our data is generally clean, structured, reliable, and connected to business context." },
        { value: 5, label: "Highly AI-ready",           description: "Our data is clean, trusted, well-structured, well-labeled, contextualized, and continuously maintained for AI and automation use cases." },
      ]},
      { id: "q15", section: "Data Readiness", pillar: "data", text: "How mature is your data governance, including ownership, quality monitoring, security, and access control?", options: [
        { value: 1, label: "No governance",       description: "No clear data ownership or governance exists." },
        { value: 2, label: "Informal policies",   description: "Some policies exist, but they are informal." },
        { value: 3, label: "Partial governance",  description: "Governance exists in parts of the organization." },
        { value: 4, label: "Mostly defined",      description: "Ownership, quality, security, and access controls are mostly defined." },
        { value: 5, label: "Mature and enforced", description: "Data governance is mature, monitored, and consistently enforced." },
      ]},
      { id: "q16", section: "Data Readiness", pillar: "data", text: "To what extent are your data collection and preparation processes automated and integrated across systems?", options: [
        { value: 1, label: "Mostly manual",       description: "Data collection and preparation are mostly manual." },
        { value: 2, label: "Partial automation",  description: "Some automation exists, but systems remain disconnected." },
        { value: 3, label: "Partial integration", description: "Partial integration exists across key data sources." },
        { value: 4, label: "Mostly automated",    description: "Data pipelines are mostly automated and integrated." },
        { value: 5, label: "Fully automated",     description: "Data flows are highly automated, reliable, and ready for AI at scale." },
      ]},
    ],
  },
  {
    id: "technology", pillar: 5,
    title: "Technology & Infrastructure",
    desc: "Your technical capabilities to build, deploy, monitor, and integrate AI solutions at scale.",
    questions: [
      { id: "q17", section: "Technology & Infrastructure", pillar: "technology", text: "Does your organization have the infrastructure needed to experiment with, develop, and deploy AI solutions?", options: [
        { value: 1, label: "No infrastructure",      description: "No infrastructure exists for AI experimentation or deployment." },
        { value: 2, label: "Basic tools only",        description: "Basic tools exist, but infrastructure is limited." },
        { value: 3, label: "Supports pilots",         description: "Infrastructure supports pilots, but not scalable deployment." },
        { value: 4, label: "Production-ready",        description: "Infrastructure supports AI development and selected production use cases." },
        { value: 5, label: "Scalable and optimized",  description: "Infrastructure is scalable, secure, and optimized for AI initiatives." },
      ]},
      { id: "q18", section: "Technology & Infrastructure", pillar: "technology", text: "How standardized is your technology stack for AI, data engineering, and analytics projects?", options: [
        { value: 1, label: "Fragmented",         description: "Tools are fragmented and inconsistent." },
        { value: 2, label: "No standards",        description: "Teams use different tools without standards." },
        { value: 3, label: "Partial standards",   description: "Some standards exist, but adoption varies." },
        { value: 4, label: "Mostly standardized", description: "The AI/data stack is mostly standardized." },
        { value: 5, label: "Actively managed",    description: "The stack is standardized, scalable, and actively managed." },
      ]},
      { id: "q19", section: "Technology & Infrastructure", pillar: "technology", text: "How mature are your deployment practices for AI solutions, including DevOps, MLOps, monitoring, evaluation, and rollback?", options: [
        { value: 1, label: "No deployment process",    description: "We do not have a clear process for deploying or monitoring AI solutions." },
        { value: 2, label: "Manual and inconsistent",  description: "AI solutions are deployed manually or inconsistently, with limited testing or monitoring." },
        { value: 3, label: "Basic deployment practices", description: "We have some testing, deployment, and monitoring practices, but they are not standardized across AI projects." },
        { value: 4, label: "Strong deployment practices", description: "We use structured deployment, monitoring, evaluation, version control, and rollback processes for AI solutions." },
        { value: 5, label: "Production-grade AI operations", description: "We have mature DevOps/MLOps practices, continuous monitoring, performance evaluation, incident response, rollback plans, and clear ownership for AI systems in production." },
      ]},
      { id: "q20", section: "Technology & Infrastructure", pillar: "technology", text: "Can your AI systems integrate securely with core business systems such as CRM, ERP, databases, cloud platforms, communication tools, or internal applications?", options: [
        { value: 1, label: "No integration",             description: "Our AI tools do not connect to core business systems." },
        { value: 2, label: "Limited manual integration",  description: "AI tools can use some business data, but mostly through manual exports, uploads, or copy-paste." },
        { value: 3, label: "Basic system connections",    description: "Some AI tools connect to business systems, but integrations are limited, fragile, or not fully governed." },
        { value: 4, label: "Secure integrations",         description: "AI systems can connect to important business systems using secure APIs, permissions, and access controls." },
        { value: 5, label: "Enterprise-ready integration", description: "AI systems can securely work across core business systems with strong identity controls, least-privilege access, logging, monitoring, and governance." },
      ]},
    ],
  },
];

export const TOTAL_Q = SECTIONS.reduce((n, s) => n + s.questions.length, 0);

export const PILLAR_CONFIG: PillarConfig[] = [
  { id: "strategy",   title: "Strategy & Business Alignment", weight: 0.20, qIds: ["q1","q2","q3","q4"] },
  { id: "people",     title: "People & Culture",              weight: 0.15, qIds: ["q5","q6","q7"] },
  { id: "processes",  title: "Processes, Governance & Risk",  weight: 0.20, qIds: ["q8","q9","q10","q11"] },
  { id: "data",       title: "Data Readiness",                weight: 0.25, qIds: ["q12","q13","q14","q15","q16"] },
  { id: "technology", title: "Technology & Infrastructure",   weight: 0.20, qIds: ["q17","q18","q19","q20"] },
];

export const LEVEL_ORDER = ["Low Readiness","Emerging Readiness","Moderate Readiness","High Readiness","Advanced Readiness"];

export const LEVEL_META: Record<string, { key: string; desc: string }> = {
  "Low Readiness":      { key: "low",      desc: "Your organization is still building the foundations needed for AI. Before scaling AI initiatives, focus on strategy, data, governance, and technical readiness." },
  "Emerging Readiness": { key: "emerging", desc: "Your organization has started preparing for AI, but key gaps remain. Targeted improvements are needed before AI can be scaled reliably." },
  "Moderate Readiness": { key: "moderate", desc: "Your organization has a reasonable foundation for AI adoption and may be ready for focused pilots, but should strengthen weak areas before scaling broadly." },
  "High Readiness":     { key: "high",     desc: "Your organization is well positioned to implement and scale selected AI initiatives, provided governance, monitoring, and value measurement remain strong." },
  "Advanced Readiness": { key: "advanced", desc: "Your organization has a strong foundation to adopt, scale, and continuously improve AI across the business." },
};

export const RECOMMENDATIONS: Record<string, string> = {
  strategy:   "Clarify the AI vision, prioritize use cases, and define a roadmap linked to business value.",
  people:     "Invest in AI literacy, cross-functional collaboration, and change management to support adoption.",
  processes:  "Define governance, decision rights, responsible AI policies, and clear ownership for AI initiatives.",
  data:       "Strengthen data quality, accessibility, governance, and integration before scaling AI solutions.",
  technology: "Improve infrastructure, system integration, deployment practices, and monitoring before moving beyond pilots.",
};

export function calculatePillarScores(answers: Record<string, number>): PillarScore[] {
  return PILLAR_CONFIG.map(p => {
    const max = p.qIds.length * 5;
    const raw = p.qIds.reduce((sum, id) => sum + (answers[id] || 0), 0);
    return { id: p.id, title: p.title, weight: p.weight, score: Math.round((raw / max) * 100) };
  });
}

export function calculateWeightedScore(pillarScores: PillarScore[]): number {
  return Math.round(pillarScores.reduce((sum, p) => sum + p.score * p.weight, 0));
}

export function getReadinessLevel(score: number): string {
  if (score >= 90) return "Advanced Readiness";
  if (score >= 75) return "High Readiness";
  if (score >= 60) return "Moderate Readiness";
  if (score >= 40) return "Emerging Readiness";
  return "Low Readiness";
}

export function applyBlockerRules(weightedScore: number, pillarScores: PillarScore[]): AssessmentResult {
  let level = getReadinessLevel(weightedScore);
  let blocker: string | null = null;
  const byId = Object.fromEntries(pillarScores.map(p => [p.id, p]));

  function capAt(cap: string, msg: string) {
    if (LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(cap)) {
      level = cap;
      blocker = "Your overall score is promising, but " + msg;
    }
  }

  if (byId.technology.score < 40) capAt("Moderate Readiness", "your Technology & Infrastructure score limits your current ability to deploy AI beyond pilots.");
  if (byId.data.score      < 40) capAt("Emerging Readiness",  "your Data Readiness score limits your current ability to scale AI reliably.");
  if (byId.processes.score < 40) capAt("Emerging Readiness",  "your Processes & Governance score limits your current ability to manage AI responsibly at scale.");

  return { score: weightedScore, level, blocker };
}

export function getPillarTier(score: number) {
  if (score >= 90) return { key: "advanced", label: "Advanced",         barClass: "rpt-bar-advanced", pctClass: "rpt-pct-advanced" };
  if (score >= 75) return { key: "high",     label: "Strong",           barClass: "rpt-bar-high",     pctClass: "rpt-pct-high" };
  if (score >= 60) return { key: "moderate", label: "Moderate",         barClass: "rpt-bar-moderate", pctClass: "rpt-pct-moderate" };
  if (score >= 40) return { key: "emerging", label: "Developing",       barClass: "rpt-bar-emerging", pctClass: "rpt-pct-emerging" };
  return             { key: "low",     label: "Foundational gaps", barClass: "rpt-bar-low",      pctClass: "rpt-pct-low" };
}
