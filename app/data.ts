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
      { id: "q4", section: "Strategy & Business Alignment", pillar: "strategy", text: "Has your organization identified and prioritized the workflows where AI could create the most value?", options: [
        { value: 1, label: "Not identified",       description: "We have not identified where AI could create value." },
        { value: 2, label: "Ideas only",           description: "We have discussed possible AI use cases, but have not ranked them." },
        { value: 3, label: "Initial priorities",   description: "We have selected some promising workflows, but prioritization is still informal." },
        { value: 4, label: "Clear priorities",     description: "We have prioritized workflows using clear business value criteria." },
        { value: 5, label: "Value-driven roadmap", description: "We have a prioritized AI roadmap with owners, expected impact, and next steps." },
      ]},
      { id: "q1", section: "Strategy & Business Alignment", pillar: "strategy", text: "How clearly has your organization defined its AI vision and ambition?", options: [
        { value: 1, label: "No vision",              description: "No AI vision has been defined." },
        { value: 2, label: "Informal interest",      description: "AI is discussed, but there is no defined direction." },
        { value: 3, label: "Partially defined",      description: "An AI vision exists, but it is not fully communicated." },
        { value: 4, label: "Clearly defined",        description: "The AI vision is formalized and connected to business priorities." },
        { value: 5, label: "Strategically embedded", description: "The AI vision actively guides planning and investment." },
      ]},
      { id: "q2", section: "Strategy & Business Alignment", pillar: "strategy", text: "How well is AI connected to your company's broader business strategy and growth priorities?", options: [
        { value: 1, label: "Not connected",    description: "AI is not linked to business strategy." },
        { value: 2, label: "Loosely related",  description: "AI is seen as useful, but remains separate from strategic planning." },
        { value: 3, label: "Partially aligned",description: "Some AI initiatives support business goals." },
        { value: 4, label: "Clearly aligned",  description: "Most AI initiatives are tied to strategic priorities." },
        { value: 5, label: "Fully integrated", description: "AI is embedded into strategic planning and investment decisions." },
      ]},
      { id: "q3", section: "Strategy & Business Alignment", pillar: "strategy", text: "To what extent does leadership understand AI's economic and operational impact?", options: [
        { value: 1, label: "Limited awareness",      description: "Leadership has limited understanding of AI's business potential." },
        { value: 2, label: "Uneven interest",        description: "Some leaders understand AI, but knowledge is inconsistent." },
        { value: 3, label: "Basic understanding",    description: "Leadership understands common AI opportunities and risks." },
        { value: 4, label: "Strong support",         description: "Leadership supports AI with clear business expectations." },
        { value: 5, label: "Driving transformation", description: "Leadership actively drives AI transformation across the organization." },
      ]},
    ],
  },
  {
    id: "people", pillar: 2,
    title: "People & Culture",
    desc: "Your team's readiness, skill availability, and cross-functional collaboration capacity for AI adoption.",
    questions: [
      { id: "q5", section: "People & Culture", pillar: "people", text: "How prepared are your teams to understand, adopt, and work with AI solutions?", options: [
        { value: 1, label: "Not prepared",     description: "Teams are not prepared to use AI." },
        { value: 2, label: "Limited awareness",description: "Some employees are curious, but usage is informal." },
        { value: 3, label: "Early adoption",   description: "Some teams are beginning to use AI in their work." },
        { value: 4, label: "Trained users",    description: "Teams have training and use AI in defined workflows." },
        { value: 5, label: "Embedded adoption",description: "AI is widely used as part of normal work." },
      ]},
      { id: "q6", section: "People & Culture", pillar: "people", text: "Does your organization have the necessary AI, data, process, and technical skills internally, or a clear plan to access them externally?", options: [
        { value: 1, label: "Skills gap",          description: "The organization lacks the skills needed for AI initiatives." },
        { value: 2, label: "Isolated expertise",  description: "A few individuals have relevant skills, but capability is not structured." },
        { value: 3, label: "Partial capability",  description: "Some capability exists, but important gaps remain." },
        { value: 4, label: "Reliable capability", description: "The organization can support most AI initiatives through internal or external expertise." },
        { value: 5, label: "Scalable capability", description: "AI-related skills are mature, scalable, and aligned to the roadmap." },
      ]},
      { id: "q7", section: "People & Culture", pillar: "people", text: "How well do business, data, technology, operations, and risk teams collaborate on AI-related initiatives?", options: [
        { value: 1, label: "Siloed",                   description: "Teams work separately on AI-related topics." },
        { value: 2, label: "Occasional contact",        description: "Collaboration happens informally when needed." },
        { value: 3, label: "Project-based collaboration",description: "Teams collaborate on selected AI initiatives." },
        { value: 4, label: "Structured collaboration",  description: "Cross-functional collaboration is consistent across AI projects." },
        { value: 5, label: "Integrated delivery",       description: "Business, data, technology, operations, and risk teams work as one delivery model." },
      ]},
    ],
  },
  {
    id: "processes", pillar: 3,
    title: "Processes, Governance & Risk",
    desc: "Your frameworks for managing AI initiatives responsibly, at scale, and with clear accountability.",
    questions: [
      { id: "q8", section: "Processes, Governance & Risk", pillar: "processes", text: "How clearly are your core business processes documented and standardized across the organization?", options: [
        { value: 1, label: "Undocumented",          description: "Core processes are not documented." },
        { value: 2, label: "Mostly informal",        description: "Processes are known by teams, but not consistently written down." },
        { value: 3, label: "Partially documented",   description: "Key processes are documented in some areas." },
        { value: 4, label: "Standardized",           description: "Most core processes follow a consistent documented structure." },
        { value: 5, label: "Measured and optimized", description: "Core processes are documented, measured, and regularly improved." },
      ]},
      { id: "q9", section: "Processes, Governance & Risk", pillar: "processes", text: "Does your organization have a clear governance model for selecting, approving, and managing AI initiatives?", options: [
        { value: 1, label: "No governance",        description: "No AI governance model exists." },
        { value: 2, label: "Ad hoc decisions",     description: "AI decisions are made informally." },
        { value: 3, label: "Partial governance",   description: "Some governance exists, but roles are unclear." },
        { value: 4, label: "Defined governance",   description: "AI governance is defined for selected initiatives." },
        { value: 5, label: "Enforced governance",  description: "AI governance is consistently applied across the organization." },
      ]},
      { id: "q10", section: "Processes, Governance & Risk", pillar: "processes", text: "Are decision rights clear for AI projects, including who approves priorities, budgets, risks, deployment, and human escalation?", options: [
        { value: 1, label: "No clear ownership",           description: "It is unclear who owns AI decisions." },
        { value: 2, label: "Partial ownership",            description: "Some people are involved, but responsibilities are not clearly assigned." },
        { value: 3, label: "Basic decision structure",     description: "Most approvals are known, but escalation paths are unclear." },
        { value: 4, label: "Clear decision rights",        description: "AI ownership, approvals, and escalation paths are clearly assigned." },
        { value: 5, label: "Accountable operating model",  description: "Every AI initiative has clear owners, approval steps, escalation rules, and outcome accountability." },
      ]},
      { id: "q11", section: "Processes, Governance & Risk", pillar: "processes", text: "Are there documented policies for responsible AI use and acceptable levels of AI autonomy?", options: [
        { value: 1, label: "No AI policies",           description: "We do not have documented rules for AI use." },
        { value: 2, label: "Informal expectations",    description: "We have general expectations, but they are not documented." },
        { value: 3, label: "Basic documented policies",description: "We have documented responsible AI policies, but they do not fully address autonomy." },
        { value: 4, label: "Documented AI controls",   description: "We have documented rules for what AI can access, what it can do, and when humans must approve decisions." },
        { value: 5, label: "Mature AI governance",     description: "We have documented policies, guardrails, auditability, human-in-the-loop rules, and clear limits on AI autonomy." },
      ]},
    ],
  },
  {
    id: "data", pillar: 4,
    title: "Data Readiness",
    desc: "The completeness, quality, accessibility, and governance of your organization's data assets.",
    questions: [
      { id: "q12", section: "Data Readiness", pillar: "data", text: "How complete and relevant is the data your organization collects for priority AI use cases?", options: [
        { value: 1, label: "Not collected",         description: "Relevant data is not collected." },
        { value: 2, label: "Limited coverage",      description: "Some useful data exists, but coverage is limited." },
        { value: 3, label: "Partial coverage",      description: "Data exists for selected use cases, but important gaps remain." },
        { value: 4, label: "Mostly complete",       description: "Most relevant data is collected for priority AI use cases." },
        { value: 5, label: "Purpose-built collection",description: "Data collection is designed around priority AI use cases." },
      ]},
      { id: "q13", section: "Data Readiness", pillar: "data", text: "How accessible is your data to the teams, systems, and approved AI tools that need it?", options: [
        { value: 1, label: "Mostly inaccessible",description: "Important data is hard to find or locked in disconnected systems." },
        { value: 2, label: "Manual access",      description: "Teams usually need manual exports or approvals to use data." },
        { value: 3, label: "Partial access",     description: "Key data is available in some systems, but access is inconsistent." },
        { value: 4, label: "Controlled access",  description: "Most important data is available through governed access." },
        { value: 5, label: "Seamless access",    description: "Approved users and AI tools can access the right data through secure permissions." },
      ]},
      { id: "q14", section: "Data Readiness", pillar: "data", text: "How AI-ready is the format, structure, and context of your data?", options: [
        { value: 1, label: "Unstructured files",   description: "Important data mainly lives in PDFs, emails, scanned documents, or free-text files." },
        { value: 2, label: "Manual tables",        description: "Important data mainly lives in spreadsheets, exports, or copied tables with inconsistent formats." },
        { value: 3, label: "Business system data", description: "Important data exists in CRMs, ERPs, databases, or internal systems, but structure varies across teams." },
        { value: 4, label: "Structured data",      description: "Core data is stored in consistent systems with clear fields, definitions, and business context." },
        { value: 5, label: "AI-ready data layer",  description: "Core data is structured, documented, searchable, and available for approved AI workflows." },
      ]},
      { id: "q15", section: "Data Readiness", pillar: "data", text: "How mature is your data governance, including ownership, quality monitoring, security, and access control?", options: [
        { value: 1, label: "No governance",      description: "No clear data ownership exists." },
        { value: 2, label: "Informal policies",  description: "Some data rules exist, but they are informal." },
        { value: 3, label: "Partial governance", description: "Data governance exists in selected areas." },
        { value: 4, label: "Mostly defined",     description: "Ownership, quality rules, security, and access controls are mostly defined." },
        { value: 5, label: "Mature governance",  description: "Data governance is monitored and consistently enforced." },
      ]},
      { id: "q16", section: "Data Readiness", pillar: "data", text: "To what extent are your data collection and preparation processes automated and integrated across systems?", options: [
        { value: 1, label: "Mostly manual",      description: "Data collection and preparation are mostly manual." },
        { value: 2, label: "Partial automation", description: "Some tasks are automated, but systems remain disconnected." },
        { value: 3, label: "Partial integration",description: "Some systems are connected, but manual preparation is still common." },
        { value: 4, label: "Mostly automated",   description: "Data pipelines are mostly automated across key systems." },
        { value: 5, label: "Scalable data flows",description: "Data flows are automated, reliable, and ready for AI at scale." },
      ]},
    ],
  },
  {
    id: "technology", pillar: 5,
    title: "Technology & Infrastructure",
    desc: "Your technical capabilities to build, deploy, monitor, and integrate AI solutions at scale.",
    questions: [
      { id: "q17", section: "Technology & Infrastructure", pillar: "technology", text: "Does your organization have the infrastructure needed to experiment with, develop, deploy, and safely run AI solutions?", options: [
        { value: 1, label: "No infrastructure",     description: "No infrastructure exists for AI experimentation." },
        { value: 2, label: "Basic tools only",       description: "Basic tools exist, but infrastructure is limited." },
        { value: 3, label: "Pilot-ready",            description: "Infrastructure supports AI pilots." },
        { value: 4, label: "Production-ready",       description: "Infrastructure supports selected production AI use cases." },
        { value: 5, label: "Scalable infrastructure",description: "Infrastructure can support AI initiatives at scale." },
      ]},
      { id: "q18", section: "Technology & Infrastructure", pillar: "technology", text: "How standardized is your technology stack for AI, data engineering, analytics, and workflow automation projects?", options: [
        { value: 1, label: "Fragmented",         description: "Tools are fragmented across teams." },
        { value: 2, label: "No standards",        description: "Teams use different tools without shared standards." },
        { value: 3, label: "Partial standards",   description: "Some standards exist, but adoption is inconsistent." },
        { value: 4, label: "Mostly standardized", description: "The AI and data stack is mostly standardized." },
        { value: 5, label: "Actively managed",    description: "The technology stack is standardized, scalable, and actively managed." },
      ]},
      { id: "q19", section: "Technology & Infrastructure", pillar: "technology", text: "How mature are your deployment practices for AI solutions, including DevOps, MLOps, monitoring, evaluation, and rollback?", options: [
        { value: 1, label: "No deployment process",     description: "We do not have a clear process for deploying AI solutions." },
        { value: 2, label: "Manual deployment",         description: "AI solutions are deployed manually with limited testing." },
        { value: 3, label: "Basic deployment practices",description: "Some testing, deployment, and monitoring practices exist." },
        { value: 4, label: "Controlled deployment",     description: "AI solutions use structured deployment, monitoring, evaluation, and rollback processes." },
        { value: 5, label: "Production-grade operations",description: "AI systems are managed with mature operations, monitoring, incident response, and clear ownership." },
      ]},
      { id: "q20", section: "Technology & Infrastructure", pillar: "technology", text: "Can your AI systems integrate securely with core business systems such as CRM, ERP, databases, cloud platforms, communication tools, or internal applications?", options: [
        { value: 1, label: "No integration",              description: "AI tools do not connect to core business systems." },
        { value: 2, label: "Manual integration",          description: "AI tools rely mostly on exports, uploads, or copy-paste." },
        { value: 3, label: "Basic connections",           description: "Some AI tools connect to business systems, but integrations are limited." },
        { value: 4, label: "Secure integrations",         description: "AI systems connect to important business systems through secure APIs and permissions." },
        { value: 5, label: "Enterprise-ready integration",description: "AI systems can work across core systems with identity controls, access logging, and governance." },
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
