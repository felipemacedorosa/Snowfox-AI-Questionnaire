# Questionnaire, Report Congruence, and Persistence Design

**Date:** 2026-08-04
**Status:** Approved

## Context

The assessment currently has three related problems:

1. Some questionnaire content is misplaced or asks respondents to assert facts they may not know.
2. Report sections can contradict each other because the main opportunity is calculated from the answers while Data Foundation is hard-coded as the default recommendation and first roadmap action.
3. Only the current browser draft is retained. Completed reports are not saved centrally.

This design corrects those problems without changing the five-pillar assessment model or introducing an external data service.

## Goals

- Place each question in the pillar that best represents the capability being assessed.
- Make uncertain but legitimate answers possible without encouraging respondents to guess.
- Replace vague generated prose with specific, actionable next steps.
- Make the executive opportunity, primary recommendation, and first roadmap action agree.
- Save every completed report centrally as a durable JSON file on the Snowfox server.
- Collect the respondent's name and email with explicit storage notice before revealing the report.

## Non-Goals

- Building a report administration interface.
- Adding company, phone, marketing consent, authentication, or CRM integration.
- Moving reports to a database or external SaaS.
- Reworking the visual identity or general assessment navigation.
- Replacing the three technical opportunity tracks with a new product catalog.

## Questionnaire Changes

### Operational capacity question

Move `dados_q3`, "É possível crescer a capacidade operacional sem necessariamente aumentar o quadro de pessoas na mesma proporção?", from the Dados section to Governança e Processo.

Keep the existing question ID so version-1 browser drafts remain compatible. Change its scoring pillar and authored insight pillar to `governanca`. The overall maximum score remains unchanged, but the question now contributes to the Governance and Process pillar rather than Data.

Update the corresponding insight metadata, CSV reference, scoring documentation, and exported copy references so no source continues to classify it as a Data question.

### Economic value explanation

Add optional explanatory copy to the question model and render it directly below a question when present. For `est_q1b`, explain economic value as measurable business impact, including:

- reducing cost or execution time;
- increasing revenue or conversion;
- improving forecasts and recurring decisions;
- transforming data into products, services, or differentiated customer experiences.

The explanation informs the answer but does not alter scoring.

### Delay reason choices

Replace the optional free-text `est_q3a1` with a required, single-choice, unscored contextual question. Choices are:

- Falta de engajamento ou disponibilidade dos times
- Desalinhamento entre o escopo e o processo interno real
- Falta de priorização da alta liderança
- Dependências de dados ou integrações
- Requisitos ou aprovações pouco claros
- Outro motivo
- Não sei afirmar

Add `scored?: false` to the question model. Unscored choice questions count toward completion and are included as contextual evidence, but are excluded from overall and pillar scoring, gap generation, and target-state generation.

Add "Não há iniciativas para avaliar" and "Não sei afirmar" to the parent delay-frequency question. Neither answer reveals the delay-reason follow-up.

### Uncertainty answers

Use the label **"Não sei afirmar"** consistently. It receives score zero because lack of institutional visibility is itself a readiness gap, but it must not trigger an authored condition intended for a different concrete answer.

Add it to these questions:

| Pillar/section | Question IDs |
| --- | --- |
| Dados | `dados_q2`, `dados_q4`, `dados_q6` |
| Governança e Processo | `dados_q3`, `gov_q1`, `gov_q2` |
| Estratégia | `est_q1`, `est_q1a`, `est_q1a1`, `est_q1a1a`, `est_q1b`, `est_q2`, `est_q3`, `est_q3a`, `pess_q1`, `pess_q2`, `pess_q2a` |
| Pessoas e Cultura | `pess_q3`, `pess_q4`, `pess_q5a`, `pess_q6` |
| Tecnologia | `tec_q1`, `tec_q1b`, `tec_q1c`, `tec_q1e`, `tec_q1f`, `tec_q1g`, `tec_q2a`, `tec_q2b`, `tec_q2d`, `tec_q2e`, `tec_q2f` |

Do not add it to:

- direct personal-experience questions `dados_q5` and `dados_q7`;
- questions whose existing choice already expresses uncertainty, such as `dados_q1` ("Sem clareza"), `pess_q5` ("Sem conhecimento"), `tec_q1d`, and `tec_q2c` ("Não sei");
- the closed delay-reason question beyond its explicitly listed contextual choice.

For `pess_q3`, "Não sei afirmar" behaves like "Nenhuma das anteriores": it is exclusive of expertise selections but remains semantically distinct.

Use value `0` for uncertainty answers. Existing values and saved answers remain valid. Conditional follow-ups do not list value `0`, so an uncertainty answer safely closes that branch.

## Congruent Report Model

### One primary priority

Introduce a shared priority selector that returns the organizational pillar requiring the first action. It uses the highest-priority critical insight that still needs attention, then other high-priority insights, then the weakest pillar. A profile returns the portfolio-level priority only when all five pillars score at least 75 and the difference between the strongest and weakest pillar is at most five points.

All of the following consume that same result:

- the executive summary's "Maior oportunidade";
- the executive summary's "Prioridade recomendada";
- the first quarter of the action plan.

This prevents separate functions from independently choosing incompatible recommendations.

### Pillar-led recommendations

The primary recommendation is an organizational action, not necessarily a Snowfox technical solution:

| Primary priority | Recommendation direction |
| --- | --- |
| Dados | Fundação de dados orientada ao caso de uso |
| Estratégia | Comitê executivo e portfólio de IA |
| Pessoas e Cultura | Programa de adoção e capacitação |
| Governança e Processo | Modelo de governança e processo |
| Tecnologia | Base técnica de entrega |
| Balanced advanced portfolio | Gestão do portfólio de IA |

For example, a Pessoas e Cultura opportunity produces an adoption and capability recommendation and makes that the first roadmap action. A data action can appear in quarter two or three only when the shared ranking selects Data as one of the two remaining pillar priorities; Data Foundation is never inserted into the roadmap unconditionally.

Change the executive card label from "Solução recomendada" to "Prioridade recomendada" and select its icon from the primary pillar rather than from one of three product names.

### Technical opportunity library

Keep Data Foundation, Automation Agents, and Predictive Agents as technical hypotheses. Their statuses continue to reflect observed prerequisites, but Data Foundation is no longer automatically featured or labeled as the universal recommended solution.

Use a neutral library introduction that tells the reader to evaluate the tracks against the organizational priority and prerequisites. Data Foundation can be "Preparar a base" or "Manter e expandir"; agent tracks can be ready, deferred, prepared, or expanded. An expansion track is featured only when the overall score is at least 75, the organization reports at least five AI projects, and at least one project has measurable business results. Predictive expansion still requires its existing data and technology prerequisites.

### Actionable generated copy

Stop deriving report prose by inserting the next option label into "O próximo patamar de capacidade é ...".

Create an authored next-action map keyed by question ID. Every scored question that can become generic evidence has a concise action describing an organizational change, such as:

- organize an executive committee to rank business problems and select a pilot with measurable ROI;
- document the real process, exceptions, and owners before automation;
- formalize prioritization criteria and decision cadence;
- create an applied training and adoption program;
- make priority data available through repeatable access and quality controls.

Critical-path targets and generic risk details use these actions. Tests reject the old phrase and target text that consists only of response labels such as "Sim", "Não", or "Formal".

## Central JSON Persistence

### Identification gate

Before entering the results screen, require:

- name;
- valid email;
- acknowledgement that Snowfox will store the identification and assessment data to register and follow up on the diagnosis.

This is storage acknowledgement, not marketing consent. Do not collect additional fields.

When a version-1 draft already points to results, migrate it to version 2 and show the identification gate before revealing or submitting that report.

### Report snapshot

Create one pure report builder used both by the UI and persistence. The immutable snapshot includes:

- schema and assessment version;
- stable client-generated `submissionId`;
- respondent name and email;
- raw answers;
- overall score, readiness level, and blocker;
- pillar scores;
- executive summary and selected primary priority;
- critical path and risk signals;
- technical opportunity tracks;
- quarterly action plan;
- client submission timestamp.

The server adds its own authoritative receipt timestamp. Saving the generated copy as well as raw answers preserves exactly what the client saw even if report logic changes later.

The request body has exactly this top-level contract:

```json
{
  "schemaVersion": 1,
  "assessmentVersion": 2,
  "submissionId": "uuid-v4",
  "participant": {
    "name": "Respondent name",
    "email": "name@example.com",
    "storageAcknowledged": true
  },
  "clientSubmittedAt": "ISO-8601 timestamp",
  "answers": {},
  "report": {}
}
```

The saved envelope adds `receivedAt` and `payloadHash`. The hash is calculated from a canonical representation of the validated request and is used only to distinguish a valid retry from conflicting content that reused an ID.

### Client state and submission

Store `submissionId`, participant data, acknowledgement, submission state, and returned server timestamp in the local draft. Generate the ID once with `crypto.randomUUID()` and reuse it for every retry.

Submit the snapshot to `${NEXT_PUBLIC_BASE_PATH}/api/reports.php`. The report remains behind the identification/saving state until the server confirms persistence. On failure, retain the pending snapshot and show a retry action. Reloading resumes the same submission instead of creating a duplicate.

Successful restart clears the local draft but never deletes the server report.

### PHP endpoint

Ship a same-origin PHP endpoint in the static export. It accepts only `POST application/json` and performs:

- same-origin validation;
- request-size limit of 256 KiB;
- strict UUID, name, email, version, answers, and report-object validation;
- rejection of unexpected top-level fields;
- server-side receipt timestamp;
- atomic write using a temporary file, lock, restrictive permissions, and rename;
- idempotent success when a valid file for the same `submissionId` already exists;
- JSON error responses without echoing personal data.

Do not expose list or read operations over HTTP. Authorized Snowfox operators retrieve files through server access. No raw IP address is written into report files.

### Durable location and deployment

Store reports under:

`/opt/snowfox-wordpress/data/ai-readiness-reports`

This path is outside `/opt/snowfox-wordpress/html/assessments/ai-readiness`, which is atomically replaced on each deployment. Update the deployment workflow to create the data directory if absent and assign the web process only the permissions needed to create report files. Deploys must never remove, replace, or synchronize this directory.

The endpoint path remains inside the published assessment so browser submissions are same-origin.

## Error Handling

- Invalid name or email is blocked in the client and revalidated by the server.
- Validation failures return `400`; unsupported methods return `405`; oversized payloads return `413`; origin failures return `403`; write failures return `500` with a generic message.
- A duplicate valid `submissionId` returns the original receipt metadata and does not create another file.
- A duplicate ID with different content returns `409` rather than overwriting the original report.
- The client distinguishes validation errors from temporary server failures and never claims a report was saved without a successful response.

## Testing

### Questionnaire and scoring

- The operational-capacity question appears only under Governance and Process and contributes to that pillar.
- Every approved question contains "Não sei afirmar" exactly once.
- Questions explicitly excluded from the uncertainty list remain unchanged.
- Uncertainty answers score zero and close unsupported conditional branches.
- The delay reason is required context and never changes overall or pillar scores.
- Economic-value explanatory copy is associated with `est_q1b`.

### Report logic

- A Pessoas e Cultura opportunity produces a people-led executive recommendation and first roadmap action.
- Equivalent fixtures cover Data, Strategy, Governance, and Technology priorities.
- The executive opportunity, recommendation priority, and roadmap quarter one share one priority ID.
- Data Foundation is not featured by default when a different organizational pillar is primary.
- No generated report contains "O próximo patamar de capacidade é" or a bare response label as an action.
- Existing advanced-portfolio behavior still expands proven automation or predictive work without asking the client to rebuild foundations.

### Persistence

- The report builder is deterministic for fixed timestamps and IDs.
- Client retries reuse the same submission ID.
- The PHP endpoint creates one JSON file for a valid request.
- Repeating the same request is idempotent.
- Reusing an ID with changed content returns `409`.
- Invalid method, origin, content type, size, name, email, UUID, or payload shape is rejected.
- Saved files contain server receipt time and the full approved snapshot but no IP field.
- A build copies the PHP endpoint into the final static export.

CI will provision PHP for syntax and endpoint integration tests, then run the existing Vitest suite and Next production build.

## Rollout and Verification

1. Deploy the endpoint and durable directory setup together with the client changes.
2. Submit a production smoke-test assessment using a clearly marked internal test identity.
3. Verify one JSON file exists outside the release directory, has restrictive permissions, and contains the same score and recommendation shown in the browser.
4. Resubmit/reload and confirm no duplicate file is created.
5. Verify a subsequent deployment leaves the saved JSON untouched.

## Acceptance Criteria

- The boss's four questionnaire/copy examples are corrected in the live flow.
- Reports do not recommend Data Foundation as the main action when the calculated opportunity is another pillar.
- The first roadmap action agrees with the executive recommendation.
- Every report requires name and email and is confirmed by the server before display.
- Every confirmed submission has exactly one durable JSON file that survives deployments.
- Existing tests, new tests, PHP integration tests, and the production build pass.
