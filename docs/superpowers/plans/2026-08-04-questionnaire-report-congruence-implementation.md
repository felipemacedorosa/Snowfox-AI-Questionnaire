# Questionnaire and Report Congruence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the questionnaire classification and response choices, then make every primary report recommendation and first roadmap action follow one shared organizational priority.

**Architecture:** Keep questionnaire configuration in `app/data.ts`, but add explicit unscored and explanatory metadata. Centralize the report's organizational priority and question-level next actions in the existing analysis modules, then make the executive summary, roadmap, and technical opportunity library consume those decisions rather than hard-coded Data Foundation defaults.

**Tech Stack:** TypeScript 5, Next.js 16 App Router, React 19, Vitest 4, Motion, Lucide React, static export.

## Global Constraints

- Preserve the five existing pillars and the overall maximum score.
- Keep question ID `dados_q3` for version-1 draft compatibility while moving it to Governance and Process.
- Use the exact uncertainty label `Não sei afirmar` and value `0`.
- Uncertainty scores zero; unscored contextual choices do not affect any score or generated gap.
- Keep Data Foundation, Automation Agents, and Predictive Agents as technical hypotheses, not universal organizational recommendations.
- The executive opportunity, executive priority, and quarter-one roadmap action must use one shared priority ID.
- Do not generate `O próximo patamar de capacidade é` or use a bare answer label as an action.
- Do not add dependencies.
- Follow test-driven development: write and run each failing test before changing production code.

---

## File Structure

### Files to modify

- `app/data.ts`: question schema, moved question, uncertainty choices, economic-value explanation, and unscored delay reason.
- `app/data.test.ts`: questionnaire placement, options, branching, and scoring contracts.
- `app/resultAnalysis.ts`: contextual evidence handling, authored next actions, and capability-based technical track statuses.
- `app/resultAnalysis.test.ts`: next-action, report-priority, roadmap, and opportunity-track regression coverage.
- `app/resultInsights.ts`: shared primary-priority selector, pillar-led executive recommendations, and priority-led quarterly roadmap.
- `components/quiz/QuizScreen.tsx`: render optional question explanation and remove text-only assumptions for the delay reason.
- `components/results/ResultsScreen.tsx`: render the pillar-led recommendation label and icon.
- `components/results/DeepResultSections.tsx`: neutral technical-library introduction and Data Foundation treatment.
- `app/globals.css`: compact question-explanation styling and generic recommendation-card styling.
- `assessment-insights.csv`: classify the operational-capacity insight under Governance and Process.
- `exports/executive-summary-copy-and-scoring.md`: synchronize scoring and recommendation reference copy.
- `exports/session-1-all-possible-texts.md`: synchronize report copy reference.

### Files to create

- `components/quiz/QuestionContext.tsx`: small render unit for optional explanatory question copy.
- `components/quiz/QuestionContext.test.tsx`: server-rendered markup contract for the explanation.

---

### Task 1: Correct Questionnaire Structure and Answer Semantics

**Files:**
- Modify: `app/data.ts:3-50,79-513,614-652`
- Modify: `app/data.test.ts`

**Interfaces:**
- Produces: `BaseQuestion.context?: string`
- Produces: `BaseQuestion.scored?: boolean`
- Produces: `SingleOption.isUnknown?: boolean`
- Produces: `MultiOption.isUnknown?: boolean`
- Produces: `isQuestionScored(question: Question): boolean`
- Preserves: `AnswerRecord`, `Question`, `SECTIONS`, and all existing question IDs

- [ ] **Step 1: Write failing tests for moved placement and schema metadata**

Add these helpers and tests to `app/data.test.ts`:

```ts
import {
  calculateOverallScore,
  calculatePillarScores,
  getQuestionFlowState,
  getQuestionScore,
  getSectionProgress,
  isQuestionScored,
  SECTIONS,
} from "./data";

function question(id: string) {
  return SECTIONS.flatMap(section => section.questions).find(item => item.id === id)!;
}

it("moves operational capacity from Data to Governance and Process", () => {
  const data = SECTIONS.find(section => section.id === "dados")!;
  const governance = SECTIONS.find(section => section.id === "governanca")!;

  expect(data.questions.some(item => item.id === "dados_q3")).toBe(false);
  expect(governance.questions.some(item => item.id === "dados_q3")).toBe(true);
  expect(question("dados_q3").pillar).toBe("governanca");

  const byPillar = Object.fromEntries(
    calculatePillarScores({ dados_q3: 3 }).map(item => [item.id, item.score])
  );
  expect(byPillar.dados).toBe(0);
  expect(byPillar.governanca).toBe(100);
  expect(calculateOverallScore({ dados_q3: 3 })).toBe(5);
});

it("defines economic value where the respondent answers the question", () => {
  expect(question("est_q1b").context).toContain("impacto mensurável");
  expect(question("est_q1b").context).toContain("previsões");
  expect(question("est_q1b").context).toContain("dados");
});
```

- [ ] **Step 2: Write failing tests for the exact uncertainty audit**

Add the approved ID list and assertions:

```ts
const UNKNOWN_IDS = [
  "dados_q2", "dados_q4", "dados_q6", "dados_q3", "gov_q1", "gov_q2",
  "est_q1", "est_q1a", "est_q1a1", "est_q1a1a", "est_q1b", "est_q2",
  "est_q3", "est_q3a", "pess_q1", "pess_q2", "pess_q2a", "pess_q3",
  "pess_q4", "pess_q5a", "pess_q6", "tec_q1", "tec_q1b", "tec_q1c",
  "tec_q1e", "tec_q1f", "tec_q1g", "tec_q2a", "tec_q2b", "tec_q2d",
  "tec_q2e", "tec_q2f",
] as const;

it("offers one explicit uncertainty answer on every approved question", () => {
  for (const id of UNKNOWN_IDS) {
    const item = question(id);
    expect(item.type).not.toBe("text");
    if (item.type === "text") continue;
    expect(item.options.filter(option => option.label === "Não sei afirmar")).toHaveLength(1);
    expect(item.options.find(option => option.label === "Não sei afirmar")).toMatchObject({
      value: 0,
      score: 0,
      isUnknown: true,
    });
  }
});

it("does not duplicate uncertainty where the questionnaire already expresses it", () => {
  for (const id of ["dados_q1", "dados_q5", "dados_q7", "pess_q5", "tec_q1d", "tec_q2c"]) {
    const item = question(id);
    if (item.type === "text") continue;
    expect(item.options.some(option => option.label === "Não sei afirmar")).toBe(false);
  }
});

it("keeps unknown expertise exclusive from concrete expertise", () => {
  const expertise = question("pess_q3");
  expect(expertise.type).toBe("multi");
  if (expertise.type !== "multi") return;
  expect(expertise.options.find(option => option.isUnknown)).toMatchObject({
    value: 0,
    isNone: true,
  });
});
```

- [ ] **Step 3: Write failing tests for unscored delay context**

```ts
it("turns delay reason into required unscored context", () => {
  const delayReason = question("est_q3a1");
  expect(delayReason.type).toBe("single");
  expect(isQuestionScored(delayReason)).toBe(false);
  if (delayReason.type !== "single") return;
  expect(delayReason.options.map(option => option.label)).toEqual([
    "Falta de engajamento ou disponibilidade dos times",
    "Desalinhamento entre o escopo e o processo interno real",
    "Falta de priorização da alta liderança",
    "Dependências de dados ou integrações",
    "Requisitos ou aprovações pouco claros",
    "Outro motivo",
    "Não sei afirmar",
  ]);

  const withoutReason = { est_q3: 5, est_q3a: 3 };
  const withReason = { ...withoutReason, est_q3a1: 1 };
  expect(calculateOverallScore(withReason)).toBe(calculateOverallScore(withoutReason));
  expect(calculatePillarScores(withReason)).toEqual(calculatePillarScores(withoutReason));
});

it("does not ask for a delay reason when there are no initiatives or visibility", () => {
  const strategy = SECTIONS.find(section => section.id === "estrategia")!;
  const delayReason = strategy.questions.find(item => item.id === "est_q3a1")!;
  expect(getQuestionFlowState(delayReason, strategy.questions, { est_q3: 5, est_q3a: 5 })).toBe("skipped");
  expect(getQuestionFlowState(delayReason, strategy.questions, { est_q3: 5, est_q3a: 0 })).toBe("skipped");
});
```

- [ ] **Step 4: Run the questionnaire tests and verify RED**

Run:

```bash
npx vitest run app/data.test.ts
```

Expected: FAIL because `dados_q3` is still under Data, `context`, `scored`, and `isUnknown` do not exist, and `est_q3a1` is still text.

- [ ] **Step 5: Extend the question and option schema**

In `app/data.ts`, add:

```ts
export interface SingleOption {
  value: number;
  label: string;
  note?: string;
  score: number;
  isUnknown?: boolean;
}

export interface MultiOption {
  value: number;
  label: string;
  note?: string;
  score: number;
  isNone?: boolean;
  isUnknown?: boolean;
}

interface BaseQuestion {
  id: string;
  pillar: string;
  text: string;
  context?: string;
  scored?: boolean;
  showIf?: ShowCondition;
  scorePillar?: string;
}

const UNKNOWN_NOTE = "Não há informação suficiente para afirmar com segurança.";

function unknownSingleOption(): SingleOption {
  return { value: 0, label: "Não sei afirmar", note: UNKNOWN_NOTE, score: 0, isUnknown: true };
}

export function isQuestionScored(question: Question): boolean {
  return question.type !== "text" && question.scored !== false;
}
```

Use an explicit multi option for `pess_q3`:

```ts
{ value: 0, label: "Não sei afirmar", note: UNKNOWN_NOTE, score: 0, isNone: true, isUnknown: true }
```

- [ ] **Step 6: Move and update the approved questionnaire content**

Move the unchanged `dados_q3` object into the Governance and Process question array, set `pillar: "governanca"`, and append `unknownSingleOption()`.

Append `unknownSingleOption()` exactly to every single-choice ID in the Step 2 list. Keep `pess_q3` on its explicit multi option. Do not renumber any existing option.

Set the `est_q1b` context to:

```ts
context: "Valor econômico é o impacto mensurável que a IA pode gerar, como reduzir custos ou tempo, aumentar receita, melhorar previsões e decisões recorrentes ou transformar dados em novos produtos, serviços e experiências.",
```

Add these options to `est_q3a` after `Raramente`:

```ts
{ value: 5, label: "Não há iniciativas para avaliar", note: "A organização ainda não possui iniciativas de IA cujo atraso possa ser avaliado.", score: 0 },
unknownSingleOption(),
```

Replace `est_q3a1` with:

```ts
{
  id: "est_q3a1",
  pillar: "estrategia",
  type: "single",
  scored: false,
  scorePillar: "governanca",
  text: "Qual você diria que é o principal motivo desses atrasos?",
  showIf: { qId: "est_q3a", values: [1, 2, 3] },
  options: [
    { value: 1, label: "Falta de engajamento ou disponibilidade dos times", score: 0 },
    { value: 2, label: "Desalinhamento entre o escopo e o processo interno real", score: 0 },
    { value: 3, label: "Falta de priorização da alta liderança", score: 0 },
    { value: 4, label: "Dependências de dados ou integrações", score: 0 },
    { value: 5, label: "Requisitos ou aprovações pouco claros", score: 0 },
    { value: 6, label: "Outro motivo", score: 0 },
    { value: 7, label: "Não sei afirmar", note: UNKNOWN_NOTE, score: 0, isUnknown: true },
  ],
},
```

- [ ] **Step 7: Exclude unscored context from all score helpers**

Update the helpers:

```ts
export function getQuestionScore(q: Question, answers: AnswerRecord): number | null {
  if (!isQuestionScored(q)) return null;
  // preserve the existing single and multi branches
}

export function getQuestionMax(q: Question): number {
  if (!isQuestionScored(q)) return 0;
  if (q.type === "single") return Math.max(...q.options.map(option => option.score));
  if (q.type === "multi") return q.options.filter(option => !option.isNone).reduce((sum, option) => sum + option.score, 0);
  return 0;
}
```

In both scoring loops, replace `if (q.type === "text") continue;` with `if (!isQuestionScored(q)) continue;`.

- [ ] **Step 8: Run the questionnaire tests and verify GREEN**

Run:

```bash
npx vitest run app/data.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add app/data.ts app/data.test.ts
git commit -m "fix: align questionnaire content and uncertainty"
```

---

### Task 2: Render Economic-Value Context and Preserve Compact Layout

**Files:**
- Create: `components/quiz/QuestionContext.tsx`
- Create: `components/quiz/QuestionContext.test.tsx`
- Modify: `components/quiz/QuizScreen.tsx:412-438`
- Modify: `app/globals.css:211-244,632-694`
- Test: `app/data.test.ts`

**Interfaces:**
- Consumes: `Question.context?: string` from Task 1
- Produces: `QuestionContext({ text }: { text?: string }): ReactElement | null`
- Produces: `.question-context` visual treatment

- [ ] **Step 1: Lock the approved content and write a failing render test**

Add this exact-copy assertion to the existing economic-value test:

```ts
expect(question("est_q1b").context).toBe(
  "Valor econômico é o impacto mensurável que a IA pode gerar, como reduzir custos ou tempo, aumentar receita, melhorar previsões e decisões recorrentes ou transformar dados em novos produtos, serviços e experiências."
);
```

Create `components/quiz/QuestionContext.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuestionContext } from "./QuestionContext";

describe("QuestionContext", () => {
  it("renders explanatory copy directly as question context", () => {
    expect(renderToStaticMarkup(<QuestionContext text="Valor econômico explicado" />)).toBe(
      '<p class="question-context">Valor econômico explicado</p>'
    );
  });

  it("renders nothing when no explanation is configured", () => {
    expect(renderToStaticMarkup(<QuestionContext />)).toBe("");
  });
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npx vitest run app/data.test.ts -t "defines economic value"
npx vitest run components/quiz/QuestionContext.test.tsx
```

Expected: the data copy test PASS and the component test FAIL because `QuestionContext.tsx` does not exist.

- [ ] **Step 3: Implement and wire the context render unit**

Create:

```tsx
export function QuestionContext({ text }: { text?: string }) {
  return text ? <p className="question-context">{text}</p> : null;
}
```

Import it in `QuizScreen.tsx` and insert between the `<h2>` and option components:

```tsx
<QuestionContext text={question.context} />
```

Do not render it in a nested card, tooltip, or modal.

- [ ] **Step 4: Add responsive context styling**

Add:

```css
.question-context {
  margin-top: 8px;
  max-width: 760px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .question-context { margin-top: 6px; font-size: 11px; line-height: 1.5; }
}
```

Keep `letter-spacing: 0` through inherited/global styles and verify the added paragraph does not force option text outside the viewport.

- [ ] **Step 5: Run component, full test, and build validation**

Run:

```bash
npx vitest run components/quiz/QuestionContext.test.tsx
npm test
npm run build
```

Expected:  all tests PASS and Next static export completes.

- [ ] **Step 6: Commit Task 2**

```bash
git add components/quiz/QuestionContext.tsx components/quiz/QuestionContext.test.tsx components/quiz/QuizScreen.tsx app/globals.css app/data.test.ts
git commit -m "feat: explain economic value in questionnaire"
```

---

### Task 3: Replace Option-Label Prose with Authored Next Actions

**Files:**
- Modify: `app/resultAnalysis.ts:117-192,395-428,520-549`
- Modify: `app/resultAnalysis.test.ts`

**Interfaces:**
- Consumes: `Question.scored?: boolean` and `isQuestionScored()` from Task 1
- Produces: `getQuestionNextAction(questionId: string): string | null`
- Preserves: `QuestionEvidence.targetState: string | null`

- [ ] **Step 1: Write failing tests for unscored context and actionable targets**

Add to `app/resultAnalysis.test.ts`:

Extend imports with `SECTIONS`, `getQuestionMax`, `isQuestionScored`, and `getQuestionNextAction` from their production modules.

```ts
it("keeps the selected delay reason as context instead of a scored gap", () => {
  const evidence = buildQuestionEvidence({ est_q3: 5, est_q3a: 1, est_q3a1: 3 });
  expect(evidence.find(item => item.id === "est_q3a1")).toMatchObject({
    answer: "Falta de priorização da alta liderança",
    normalizedScore: null,
    kind: "context",
    targetState: null,
  });
});

it("uses an authored action instead of the next answer label", () => {
  const evidence = buildQuestionEvidence({ est_q1: 3, est_q1b: 3 });
  const strategy = evidence.find(item => item.id === "est_q1")!;
  expect(strategy.targetState).toContain("comitê executivo");
  expect(strategy.targetState).toContain("ROI");
  expect(strategy.targetState).not.toMatch(/^(Sim|Não|Parcialmente|Formal)$/);
});

it("authors a next action for every scored question", () => {
  for (const question of SECTIONS.flatMap(section => section.questions)) {
    if (!isQuestionScored(question) || getQuestionMax(question) === 0) continue;
    expect(getQuestionNextAction(question.id), question.id).toBeTruthy();
  }
});

it("never emits the old next-level sentence in generic risks", () => {
  const answers: AnswerRecord = { pess_q4: 1, pess_q6: 1 };
  const signals = getRiskSignals(answers, scores({ pessoas: 20 }));
  expect(signals.map(signal => signal.detail).join(" ")).not.toContain("O próximo patamar de capacidade é");
  expect(signals.map(signal => signal.detail).join(" ")).toContain("Para avançar");
});
```

- [ ] **Step 2: Run focused result tests and verify RED**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts -t "authored action|authors a next action|selected delay|old next-level"
```

Expected: FAIL because the delay reason is currently text or scored and `nextCapability()` returns the next option label.

- [ ] **Step 3: Add the complete authored next-action map**

Add to `app/resultAnalysis.ts`:

```ts
const QUESTION_NEXT_ACTION: Record<string, string> = {
  dados_q1: "Definir as decisões prioritárias e garantir dados suficientes e relevantes para sustentá-las.",
  dados_q2: "Disponibilizar as fontes prioritárias por acessos governados e repetíveis, sem depender de solicitações manuais.",
  dados_q3: "Mapear e padronizar processos repetitivos para ampliar a capacidade sem crescimento linear do quadro.",
  dados_q4: "Consolidar histórico confiável e contínuo nas áreas em que previsões ou padrões podem gerar valor.",
  dados_q5: "Reduzir o tempo entre a geração do dado e a decisão, com atualização e acesso compatíveis com o ritmo do negócio.",
  dados_q6: "Mapear dados sensíveis, impacto de vazamento, responsáveis e controles antes de ampliar o uso de IA.",
  dados_q7: "Aumentar qualidade, rastreabilidade e transparência para tornar confiáveis as decisões baseadas em dados.",
  est_q1: "Organizar um comitê executivo para priorizar dores reais das áreas e selecionar um piloto de IA com ROI claro e mensurável.",
  est_q1a: "Mapear áreas e processos com maior potencial de retorno e comparar candidatos por impacto e viabilidade.",
  est_q1a1: "Documentar um roadmap de 12 a 24 meses com casos de uso, responsáveis, métricas e decisões de continuidade.",
  est_q1a1a: "Instituir revisão ao menos trimestral do roadmap, do valor capturado e das prioridades.",
  est_q1b: "Traduzir oportunidades de IA em hipóteses de impacto econômico, com linha de base e métrica de retorno.",
  est_q2: "Conectar a agenda de IA a mudanças de operação, decisão ou proposta de valor, além de ganhos pontuais de produtividade.",
  est_q3: "Definir um patrocinador executivo visível, com autoridade para priorizar e remover impedimentos.",
  est_q3a: "Identificar e tratar a causa recorrente dos atrasos antes de ampliar o portfólio de iniciativas.",
  pess_q1: "Estabelecer comunicação regular sobre objetivos, responsabilidades e resultados esperados da adoção de IA.",
  pess_q2: "Criar uma cadência segura de experimentação com problemas reais e aprendizado compartilhado.",
  pess_q2a: "Adotar um processo estruturado para priorizar, medir, revisar e decidir o destino de cada experimento.",
  pess_q3: "Definir um plano de capacidade para cobrir dados, IA, cloud e segurança com equipe interna ou parceiros.",
  pess_q4: "Conduzir gestão de mudança com usuários-chave, comunicação, suporte e feedback incorporados ao piloto.",
  pess_q5: "Formalizar critérios de negócio, técnicos, de risco e ROI para decidir quando IA é a solução adequada.",
  pess_q5a: "Criar um processo formal de priorização com critérios, responsáveis e cadência de decisão.",
  pess_q6: "Estruturar capacitação aplicada, suporte e metas mensuráveis de adoção para as equipes envolvidas.",
  gov_q1: "Documentar etapas, exceções, decisões e responsáveis do processo escolhido antes de automatizá-lo.",
  gov_q2: "Definir controles específicos de IA para dados, segurança, privacidade, revisão humana e responsabilização.",
  tec_q1: "Selecionar e entregar um primeiro caso de uso delimitado, integrado e medido em um fluxo real.",
  tec_q1b: "Validar integrações, dados, equipe, aprovações e caminho de produção antes de iniciar o piloto.",
  tec_q1c: "Definir um plano de retomada ou evolução para projetos parados e encerrar os que não têm valor demonstrável.",
  tec_q1d: "Mapear a arquitetura e os tipos de modelo usados para orientar suporte, risco e evolução técnica.",
  tec_q1e: "Integrar o projeto aos sistemas do fluxo real com acessos, erros e responsáveis definidos.",
  tec_q1f: "Vincular cada projeto a uma linha de base e a uma métrica concreta de custo, tempo, qualidade ou receita.",
  tec_q1g: "Padronizar componentes, integrações e controles para reutilizar a solução em novas áreas.",
  tec_q2a: "Instituir uma rotina de atualização, monitoramento e manutenção para as soluções em produção.",
  tec_q2b: "Consolidar soluções pontuais em um ecossistema com integrações, padrões e operação compartilhados.",
  tec_q2c: "Mapear e adequar o portfólio de modelos às decisões e fluxos em que cada abordagem gera mais valor.",
  tec_q2d: "Ampliar integrações reutilizáveis entre as soluções de IA e os sistemas internos prioritários.",
  tec_q2e: "Medir e comparar valor de negócio de forma consistente em todo o portfólio de IA.",
  tec_q2f: "Reutilizar componentes, monitoramento e controles ao expandir soluções para novas áreas.",
};

export function getQuestionNextAction(questionId: string): string | null {
  return QUESTION_NEXT_ACTION[questionId] ?? null;
}
```

- [ ] **Step 4: Make target generation score-aware and action-based**

Replace `nextCapability()` with:

```ts
function nextCapability(q: Question, answers: AnswerRecord): string | null {
  if (q.type === "text" || q.scored === false) return null;
  const score = getQuestionScore(q, answers);
  if (score === null || score >= getQuestionMax(q)) return null;
  return getQuestionNextAction(q.id);
}
```

In `buildQuestionEvidence`, derive context first:

```ts
const normalizedScore = question.type === "text" || question.scored === false || score === null
  ? null
  : max > 0 ? Math.round((score / max) * 100) : 0;
const kind: EvidenceKind = normalizedScore === null
  ? "context"
  : question.type === "single" && question.riskFlag && normalizedScore < 60
    ? "risk"
    : normalizedScore >= 60 ? "strength" : "gap";
```

Replace the generic detail sentence at the risk fallback with:

```ts
detail: [
  item.answerNote,
  item.targetState ? `Para avançar, ${item.targetState.charAt(0).toLocaleLowerCase("pt-BR")}${item.targetState.slice(1)}` : PILLAR_REASON[item.pillar],
].filter(Boolean).join(" "),
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts -t "authored action|authors a next action|selected delay|old next-level"
```

Expected: PASS.

- [ ] **Step 6: Run all result-analysis tests**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts
```

Expected: existing tests PASS or fail only where the old Data Foundation default is intentionally addressed in Task 4; do not weaken unrelated assertions.

- [ ] **Step 7: Commit Task 3**

```bash
git add app/resultAnalysis.ts app/resultAnalysis.test.ts
git commit -m "fix: generate actionable report next steps"
```

---

### Task 4: Centralize the Organizational Priority and Align the Roadmap

**Files:**
- Modify: `app/resultInsights.ts:896-1324`
- Modify: `app/resultAnalysis.test.ts`
- Modify: `components/results/ResultsScreen.tsx:5-14,91-106,205-237`
- Modify: `app/globals.css:310-360`

**Interfaces:**
- Produces: `PrimaryPriorityId = InsightPillarId | "portfolio"`
- Produces: `PrimaryPriority { id, title, actionLabel, context, recommendation: string[] }`
- Produces: `getPrimaryPriority({ answers, pillarScores, weakest }): PrimaryPriority`
- Extends: `ExecutiveSummary.priorityId: PrimaryPriorityId`
- Extends: `QuarterlyRecommendation.priorityId: PrimaryPriorityId`
- Consumes: existing `selectResultInsights()` and `QUARTERLY_PILLAR_ACTIONS`

- [ ] **Step 1: Replace Data Foundation expectations with failing congruence tests**

Add a helper:

```ts
function summarize(pillarScores: PillarScore[], answers: AnswerRecord = {}) {
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const result: AssessmentResult = { score: 58, level: "Prontidão Emergente", blocker: null };
  return {
    summary: buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest }),
    roadmap: buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest }),
  };
}
```

Add the primary regression:

```ts
it("aligns a people opportunity with the executive priority and first roadmap action", () => {
  const pillarScores = scores({ dados: 72, estrategia: 68, pessoas: 18, governanca: 62, tecnologia: 64 });
  const { summary, roadmap } = summarize(pillarScores, { pess_q4: 1, pess_q6: 1 });

  expect(summary.opportunity.join(" ")).toContain("Pessoas e Cultura");
  expect(summary.priorityId).toBe("pessoas");
  expect(summary.recommendationTitle).toBe("Programa de adoção e capacitação");
  expect(summary.immediateRecommendation.join(" ")).toMatch(/adoção|capacitação/);
  expect(roadmap[0]).toMatchObject({ priorityId: "pessoas" });
  expect(`${roadmap[0].focus} ${roadmap[0].title} ${roadmap[0].action}`).toMatch(/Pessoas|equipe|adoção|capacitação/i);
  expect(`${summary.immediateRecommendation.join(" ")} ${roadmap[0].action}`).not.toContain("Data Foundation");
});
```

Add table coverage:

```ts
it.each([
  ["dados", { dados: 15, estrategia: 68, pessoas: 62, governanca: 64, tecnologia: 66 }, "Fundação de dados orientada ao caso de uso"],
  ["estrategia", { dados: 70, estrategia: 15, pessoas: 62, governanca: 64, tecnologia: 66 }, "Comitê executivo e portfólio de IA"],
  ["governanca", { dados: 70, estrategia: 68, pessoas: 62, governanca: 15, tecnologia: 66 }, "Modelo de governança e processo"],
  ["tecnologia", { dados: 70, estrategia: 68, pessoas: 62, governanca: 64, tecnologia: 15 }, "Base técnica de entrega"],
] as const)("uses %s as opportunity, recommendation, and quarter-one priority", (id, overrides, title) => {
  const { summary, roadmap } = summarize(scores(overrides));
  expect(summary.priorityId).toBe(id);
  expect(summary.recommendationTitle).toBe(title);
  expect(roadmap[0].priorityId).toBe(id);
});

it("uses portfolio management only for balanced advanced profiles", () => {
  const pillarScores = scores({ dados: 82, estrategia: 80, pessoas: 79, governanca: 81, tecnologia: 83 });
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const result: AssessmentResult = { score: 81, level: "Prontidão Alta", blocker: null };
  const summary = buildExecutiveSummary({ answers: {}, pillarScores, result, strongest, weakest });
  expect(summary).toMatchObject({ priorityId: "portfolio", recommendationTitle: "Gestão do portfólio de IA" });
});
```

- [ ] **Step 2: Run the new congruence tests and verify RED**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts -t "people opportunity|uses .* opportunity|portfolio management"
```

Expected: FAIL because `priorityId` does not exist and the recommendation/roadmap still default to Data Foundation.

- [ ] **Step 3: Define the shared priority types and recommendation map**

Add after `ExecutiveSummary` support types:

```ts
export type PrimaryPriorityId = InsightPillarId | "portfolio";

export interface PrimaryPriority {
  id: PrimaryPriorityId;
  title: string;
  actionLabel: string;
  context: string;
  recommendation: string[];
}

const PRIMARY_RECOMMENDATIONS: Record<PrimaryPriorityId, Omit<PrimaryPriority, "id">> = {
  dados: {
    title: "Fundação de dados orientada ao caso de uso",
    actionLabel: "Estruturar agora",
    context: "Dados ligados a uma decisão prioritária",
    recommendation: [
      "Escolha uma decisão ou fluxo de negócio prioritário e organize as fontes, responsáveis, qualidade e acesso necessários para sustentá-lo.",
      "Meça a melhoria na decisão ou operação antes de ampliar a fundação para novos domínios.",
    ],
  },
  estrategia: {
    title: "Comitê executivo e portfólio de IA",
    actionLabel: "Alinhar agora",
    context: "Dores priorizadas e ROI mensurável",
    recommendation: [
      "Organize um comitê executivo para levantar as principais dores de cada área e comparar candidatos reais a um piloto de IA.",
      "Escolha o primeiro caso com patrocinador, linha de base e ROI claro e mensurável.",
    ],
  },
  pessoas: {
    title: "Programa de adoção e capacitação",
    actionLabel: "Mobilizar agora",
    context: "Mudança incorporada ao trabalho",
    recommendation: [
      "Identifique usuários-chave, resistências e lacunas de conhecimento no fluxo escolhido e prepare comunicação e capacitação aplicadas.",
      "Acompanhe uso, barreiras e qualidade semanalmente para transformar a solução em mudança real de trabalho.",
    ],
  },
  governanca: {
    title: "Modelo de governança e processo",
    actionLabel: "Definir agora",
    context: "Processos, controles e responsáveis",
    recommendation: [
      "Documente o processo real, suas exceções e responsáveis e defina controles mínimos de dados, segurança e revisão humana.",
      "Aplique esse modelo no primeiro caso antes de replicá-lo em outras áreas.",
    ],
  },
  tecnologia: {
    title: "Base técnica de entrega",
    actionLabel: "Preparar agora",
    context: "Integrações e operação confiáveis",
    recommendation: [
      "Defina integrações, ambientes, segurança, monitoramento e caminho de produção para um caso de uso delimitado.",
      "Entregue o piloto em um fluxo real e documente os componentes que podem ser reutilizados.",
    ],
  },
  portfolio: {
    title: "Gestão do portfólio de IA",
    actionLabel: "Escalar com disciplina",
    context: "Valor, risco e reutilização",
    recommendation: [
      "Priorize a expansão das soluções que já provaram valor e reutilize integrações, controles e práticas de adoção.",
      "Revise valor, risco, custo e desempenho como um portfólio e realoque investimento conforme os resultados.",
    ],
  },
};
```

- [ ] **Step 4: Implement one shared priority selector**

Add:

```ts
export function getPrimaryPriority({
  answers,
  pillarScores,
  weakest,
}: {
  answers: AnswerRecord;
  pillarScores: PillarScore[];
  weakest: PillarScore;
}): PrimaryPriority {
  const values = pillarScores.map(pillar => pillar.score);
  const balancedAdvanced = values.every(score => score >= 75) && Math.max(...values) - Math.min(...values) <= 5;
  if (balancedAdvanced) return { id: "portfolio", ...PRIMARY_RECOMMENDATIONS.portfolio };

  const scoreByPillar = Object.fromEntries(pillarScores.map(pillar => [pillar.id, pillar.score])) as Record<InsightPillarId, number>;
  const needsAttention = (pillar: InsightPillarId) => (scoreByPillar[pillar] ?? 0) < 75;
  const insights = selectResultInsights(answers, pillarScores, { min: 3, max: 6 });
  const attention =
    insights.find(insight => insight.type === "risco-critico" && needsAttention(insight.pillar)) ??
    insights.find(insight => insight.priority <= 2 && needsAttention(insight.pillar)) ??
    insights.find(insight => insight.pillar === weakest.id);
  const id = attention?.pillar ?? toPillarId(weakest.id);
  return { id, ...PRIMARY_RECOMMENDATIONS[id] };
}
```

- [ ] **Step 5: Make the executive summary consume the shared priority**

Change `ExecutiveSummary`:

```ts
export interface ExecutiveSummary {
  priorityId: PrimaryPriorityId;
  currentSituation: string[];
  risks: string[];
  opportunity: string[];
  recommendationTitle: string;
  recommendationAction: string;
  recommendationContext: string;
  immediateRecommendation: string[];
}
```

Inside `buildExecutiveSummary`, calculate:

```ts
const primaryPriority = getPrimaryPriority({ answers, pillarScores, weakest });
const opportunityPillar = primaryPriority.id === "portfolio" ? null : primaryPriority.id;
```

Build opportunity copy from `primaryPriority.id`; preserve the two existing portfolio opportunity sentences for `portfolio`, otherwise use `EXEC_OPPORTUNITY_TEXT` or `EXEC_SCALE_OPPORTUNITY_TEXT` for `opportunityPillar`.

Return:

```ts
priorityId: primaryPriority.id,
recommendationTitle: primaryPriority.title,
recommendationAction: primaryPriority.actionLabel,
recommendationContext: primaryPriority.context,
immediateRecommendation: primaryPriority.recommendation.map(safeClientText),
```

Delete `recommendationTitle`, `predictiveExpansion`, and hard-coded Data Foundation recommendation branches that are no longer used by the executive card. Preserve advanced portfolio evidence for the technical library in `getOpportunityTracks()`.

- [ ] **Step 6: Make quarter one consume the same priority**

Add `priorityId` to `QuarterlyRecommendation`. Remove the separate sub-60 roadmap return and the unconditional Data Foundation first item.

Call `getPrimaryPriority()` at the start of `buildQuarterlyRecommendations()`. For a pillar priority, choose its action tier from its score and `QUARTERLY_PILLAR_ACTIONS`. For `portfolio`, use this quarter-one item:

```ts
{
  id: "q1",
  priorityId: "portfolio",
  period: "Próximo trimestre",
  focus: "Gerir portfólio e valor",
  title: "Expandir o que já provou resultado",
  action: "Selecionar as soluções com melhor resultado mensurável, priorizar expansões adjacentes e definir uma revisão mensal de valor, risco, custo e desempenho.",
  outcome: "um portfólio priorizado por evidência, com componentes e controles reutilizados",
  ownerRole: "Comitê executivo de IA",
  dependency: "Resultados e responsáveis das soluções existentes identificados",
  effort: "Médio",
  successMetric: "Expansões aprovadas com meta incremental, responsável e revisão mensal",
}
```

For a pillar priority, use:

```ts
const primaryId = primaryPriority.id as InsightPillarId;
const primaryTier = actionTier(scoreByPillar[primaryId] ?? weakest.score);
const primaryCopy = tierCopy(QUARTERLY_PILLAR_ACTIONS[primaryId], primaryTier);

{
  id: "q1",
  priorityId: primaryId,
  period: "Próximo trimestre",
  focus: safeClientText(`${focusVerb(primaryTier)} ${EXEC_PILLAR_LABEL[primaryId]}`),
  title: safeClientText(primaryCopy.title),
  action: safeClientText(`${actionLead(primaryTier)}: ${primaryCopy.action}.`),
  outcome: safeClientText(primaryCopy.outcome),
  ownerRole: ACTION_META[primaryId].ownerRole,
  dependency: ACTION_META[primaryId].dependency,
  effort: "Médio",
  successMetric: ACTION_META[primaryId].successMetric,
}
```

Select quarter two and three deterministically:

```ts
const primaryPillar = primaryPriority.id === "portfolio" ? null : primaryPriority.id;
const insightOrder = selectResultInsights(answers, pillarScores, { min: 3, max: 6 })
  .filter(insight => insight.priority <= 3)
  .map(insight => insight.pillar);
const scoreOrder = [...pillarScores]
  .sort((a, b) => a.score - b.score)
  .map(pillar => toPillarId(pillar.id));
const remainingPillars = uniquePillars([...insightOrder, ...scoreOrder])
  .filter(pillar => pillar !== primaryPillar);
const secondPillar = remainingPillars[0];
const thirdPillar = remainingPillars[1];
```

The five configured scores guarantee both values. Build quarter two and three with the existing `tierCopy`, `ACTION_META`, and dependency sequencing, and assign `priorityId: secondPillar` / `priorityId: thirdPillar` explicitly.

Update the Strategy stabilize action to the approved committee/ROI direction:

```ts
stabilizeAction: "organizar um comitê executivo, levantar as dores prioritárias das áreas e selecionar um piloto com patrocinador, linha de base e ROI claro e mensurável",
```

- [ ] **Step 7: Update the executive recommendation UI**

In `ResultsScreen.tsx`, replace the product-title icon switch with:

```ts
const RECOMMENDATION_ICONS = {
  dados: Database,
  estrategia: Target,
  pessoas: Users,
  governanca: ShieldCheck,
  tecnologia: Cpu,
  portfolio: Layers3,
} as const;

const RecommendationIcon = RECOMMENDATION_ICONS[executiveSummary.priorityId];
```

Import `Cpu`, `Layers3`, `ShieldCheck`, `Target`, and `Users` from Lucide. Change the label to `Prioridade recomendada` and replace `executive-data-foundation` with `executive-priority-block`.

Rename the matching CSS selector without changing the established visual hierarchy; do not recolor the whole card based on pillar.

- [ ] **Step 8: Run congruence tests and verify GREEN**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts
```

Expected: all score-aware and congruence tests PASS. Update the old advanced test to expect `roadmap[0].priorityId` and an expansion-oriented title rather than unconditional `Consolidar Data Foundation`.

- [ ] **Step 9: Commit Task 4**

```bash
git add app/resultInsights.ts app/resultAnalysis.test.ts components/results/ResultsScreen.tsx app/globals.css
git commit -m "fix: align report priorities and roadmap"
```

---

### Task 5: Make the Technical Opportunity Library Neutral

**Files:**
- Modify: `app/resultAnalysis.ts:586-687`
- Modify: `components/results/DeepResultSections.tsx:258-307`
- Modify: `app/resultAnalysis.test.ts:97-139`

**Interfaces:**
- Preserves: `getOpportunityTracks(answers, pillarScores): OpportunityTrack[]`
- Changes: Data Foundation status is `prepare` below 75 and `maintain` at or above 75
- Changes: only proven advanced agent expansion can set `isFeatured: true`

- [ ] **Step 1: Write failing neutral-library tests**

Replace the two tests that require Data Foundation to be recommended with:

```ts
it("does not feature Data Foundation as a universal recommendation", () => {
  const answers: AnswerRecord = { dados_q1: 3, dados_q2: 3, dados_q4: 3 };
  const tracks = getOpportunityTracks(answers, scores({ dados: 72, estrategia: 68, pessoas: 55, governanca: 52, tecnologia: 63 }));
  expect(tracks.find(track => track.id === "data-foundation")).toMatchObject({
    status: "prepare",
    isFeatured: false,
    statusLabel: "Preparar a base",
  });
  expect(tracks.filter(track => track.isFeatured)).toHaveLength(0);
});

it("keeps unsupported predictive work deferred without declaring a technical winner", () => {
  const tracks = getOpportunityTracks({}, scores({ dados: 25, estrategia: 65, pessoas: 42, governanca: 42, tecnologia: 30 }));
  expect(tracks.find(track => track.id === "data-foundation")?.status).toBe("prepare");
  expect(tracks.find(track => track.id === "predictive-agents")?.status).toBe("defer");
  expect(tracks.every(track => !track.isFeatured)).toBe(true);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts -t "universal recommendation|technical winner"
```

Expected: FAIL because Data Foundation currently has `recommended` status and is featured.

- [ ] **Step 3: Remove the default feature and recommendation status**

In `getOpportunityTracks()`:

```ts
const dataFoundationStatus: OpportunityStatus = matureDataFoundation ? "maintain" : "prepare";
const featuredTrack: OpportunityTrack["id"] | null = provenPortfolio
  ? predictiveReady ? "predictive-agents" : "automation-agents"
  : null;
```

Use the normal `statusLabel(dataFoundationStatus)`. Replace the below-75 Data Foundation summary with:

```ts
"A organização ainda pode fortalecer qualidade, acesso, histórico e governança dos dados a partir dos domínios ligados às decisões prioritárias. Essa frente deve apoiar o caso de uso escolhido, não substituir a prioridade organizacional indicada no resumo."
```

Replace its start action with:

```ts
"Escolher o domínio de dados ligado ao caso prioritário e organizar fontes, responsáveis, qualidade, acesso e arquitetura na medida necessária para entregá-lo."
```

- [ ] **Step 4: Replace the library introduction and Data Foundation badge copy**

In `OpportunityLibrarySection`, use:

```ts
const scalingPortfolio = tracks.some(track => track.isFeatured && track.status === "maintain");
const intro = scalingPortfolio
  ? "A organização já reúne experiência prática para expandir soluções comprovadas. Compare as frentes abaixo por valor incremental, reutilização e capacidade de operação."
  : "As frentes abaixo são hipóteses técnicas. Avalie cada uma contra a prioridade organizacional do resumo e avance apenas quando os pré-requisitos do caso de uso estiverem claros.";
```

For the non-mature Data Foundation entry, replace `Entrada imediata / Sem requisitos prévios` with:

```tsx
<span><b>Preparação orientada ao caso</b>Fortaleça apenas os dados necessários para a prioridade escolhida.</span>
```

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
npx vitest run app/resultAnalysis.test.ts
npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add app/resultAnalysis.ts components/results/DeepResultSections.tsx app/resultAnalysis.test.ts
git commit -m "fix: present technical tracks as conditional options"
```

---

### Task 6: Synchronize Content References and Verify the Complete Report

**Files:**
- Modify: `app/resultInsights.ts:151-163`
- Modify: `assessment-insights.csv`
- Modify: `exports/executive-summary-copy-and-scoring.md`
- Modify: `exports/session-1-all-possible-texts.md`

**Interfaces:**
- Consumes: final questionnaire and report behavior from Tasks 1-5
- Produces: review artifacts that no longer describe old scoring or Data Foundation defaults

- [ ] **Step 1: Reclassify the authored operational-capacity insight**

Change result insight `dados-05` to:

```ts
{
  id: "governanca-escalabilidade-01",
  pillar: "governanca",
  questionId: "dados_q3",
  trigger: "dados_q3 = 1 (\"Não\", não cresce sem aumentar o quadro)",
  scoreCondition: "0/5",
  answerMatch: [eq("dados_q3", 1)],
  priority: 1,
  type: "oportunidade",
  theme: "governanca-escalabilidade",
  title: "Crescimento ainda depende de mais pessoas",
  insight: "O crescimento ainda escala de forma linear com o número de pessoas, sinal de que processos relevantes podem depender de trabalho manual ou pouca padronização. O próximo passo é mapear os fluxos repetitivos, suas exceções e responsáveis e então avaliar automação ou IA conforme o impacto esperado.",
},
```

Make the equivalent row change in `assessment-insights.csv`: ID, pillar, theme, title, and insight must match the TypeScript source.

- [ ] **Step 2: Update scoring and copy exports**

In `exports/executive-summary-copy-and-scoring.md`:

- remove `dados_q3` from the Data row;
- add `dados_q3` to Governance and Process;
- replace the three-product recommendation-title restriction with the six approved organizational priority titles;
- remove claims that Data Foundation is the default first movement;
- document that technical tracks are conditional hypotheses.

In `exports/session-1-all-possible-texts.md`:

- replace `Solução recomendada` references with `Prioridade recomendada`;
- list the five pillar-led titles and portfolio title;
- remove `Data Foundation como primeiro movimento` and replace it with the neutral below-75 technical-track copy;
- include the approved committee/ROI Strategy recommendation and People adoption recommendation.

- [ ] **Step 3: Scan for stale production phrases**

Run:

```bash
rg -n "O próximo patamar de capacidade é|Data Foundation é a solução recomendada|Adote Data Foundation como a primeira solução|Sem pré-requisitos" app components exports assessment-insights.csv
```

Expected: no matches.

Run:

```bash
rg -n "dados_q3" app/resultInsights.ts assessment-insights.csv exports/executive-summary-copy-and-scoring.md
```

Expected: every classification names Governance and Process; no Data scoring row contains `dados_q3`.

- [ ] **Step 4: Run complete automated verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: Vitest PASS, static export PASS, and `git diff --check` prints nothing.

- [ ] **Step 5: Inspect generated copy fixtures manually**

Use the test fixtures for People, Strategy, Data, Governance, Technology, and balanced advanced profiles. Confirm each output satisfies:

```text
executiveSummary.priorityId === quarterlyRecommendations[0].priorityId
executiveSummary.recommendationTitle matches the priority table
no primary recommendation defaults to Data Foundation for a different priority
all critical-path targets are actions, not answer labels
```

- [ ] **Step 6: Commit Task 6**

```bash
git add app/resultInsights.ts assessment-insights.csv exports/executive-summary-copy-and-scoring.md exports/session-1-all-possible-texts.md
git commit -m "docs: synchronize assessment scoring and report copy"
```

---

## Plan Completion Gate

Before starting central persistence, verify:

```bash
git status --short
npm test
npm run build
```

Expected: clean worktree, all tests PASS, and the static export succeeds. The persistence plan then builds one immutable snapshot from these finalized report APIs.
