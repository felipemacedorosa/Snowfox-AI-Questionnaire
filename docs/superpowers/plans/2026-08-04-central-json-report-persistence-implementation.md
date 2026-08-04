# Central JSON Report Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require name and email before results, save one immutable personalized report JSON on the Snowfox server, and reveal the report only after the server confirms the durable write.

**Architecture:** Build the complete report once in a pure TypeScript snapshot builder and use that same snapshot for rendering and persistence. A same-origin PHP endpoint validates the snapshot and atomically stores one idempotent JSON file outside the atomically replaced web release directory; the browser draft retains pending state for safe retries and migration from version 1.

**Tech Stack:** TypeScript 5, React 19, Next.js 16 static export, Vitest 4, PHP 8.2+, Apache/PHP on OVH, JSON files, GitHub Actions.

## Global Constraints

- Execute the questionnaire/report congruence plan first; this plan consumes its final report APIs.
- Require only name, email, and storage acknowledgement; do not add company, phone, CRM, or marketing consent.
- Use request `schemaVersion: 1` and `assessmentVersion: 2`.
- Generate one UUID v4 `submissionId` per report and reuse it for every retry.
- Do not reveal results before a successful `200` or `201` persistence response.
- Store reports at `/opt/snowfox-wordpress/data/ai-readiness-reports`, outside the deployed web directory.
- Do not expose report list/read/delete operations over HTTP.
- Do not write a raw IP address into report JSON.
- Reject requests larger than 256 KiB.
- A repeated ID with identical canonical content is idempotent; changed content with the same ID returns `409`.
- Do not add client or server dependencies.
- Follow test-driven development: write and run each failing test before changing production code.

---

## File Structure

### Files to create

- `app/reportSnapshot.ts`: pure report snapshot types and builder shared by rendering and submission.
- `app/reportSnapshot.test.ts`: deterministic snapshot tests.
- `app/assessmentDraft.ts`: version-2 draft schema, version-1 migration, and runtime parsing.
- `app/assessmentDraft.test.ts`: draft validation and migration tests.
- `app/reportSubmission.ts`: participant validation and `fetch` client for the PHP endpoint.
- `app/reportSubmission.test.ts`: validation, success, and retry-contract tests.
- `components/results/ReportIdentityGate.tsx`: required name/email/storage-acknowledgement form and saving/retry states.
- `public/api/reports.php`: same-origin validating and atomically writing persistence endpoint.
- `server/reportsEndpoint.test.ts`: PHP endpoint integration tests run through Vitest.

### Files to modify

- `app/page.tsx`: version-2 draft state, snapshot creation, submit/retry flow, and result gate.
- `components/results/ResultsScreen.tsx`: render the confirmed immutable snapshot instead of recomputing from answers.
- `components/landing/LandingScreen.tsx`: describe a saved-but-pending report accurately.
- `components/Navbar.tsx`: show saving state without claiming the report is saved prematurely.
- `app/globals.css`: compact identification gate and error/loading states.
- `.github/workflows/deploy-ai-readiness.yml`: provision PHP in CI, verify exported endpoint, and create the durable data directory.

---

### Task 1: Build One Deterministic Report Snapshot

**Files:**
- Create: `app/reportSnapshot.ts`
- Create: `app/reportSnapshot.test.ts`

**Interfaces:**
- Produces: `ParticipantIdentity`
- Produces: `ReportContents`
- Produces: `ReportSnapshot`
- Produces: `BuildReportSnapshotInput`
- Produces: `buildReportSnapshot(input): ReportSnapshot`
- Consumes: final `getPrimaryPriority`, `buildExecutiveSummary`, `buildQuarterlyRecommendations`, and analysis functions from the congruence plan

- [ ] **Step 1: Write the failing deterministic snapshot test**

Create `app/reportSnapshot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildReportSnapshot } from "./reportSnapshot";

describe("buildReportSnapshot", () => {
  it("builds one deterministic immutable report payload", () => {
    const input = {
      answers: {
        dados_q1: 2,
        dados_q2: 3,
        dados_q3: 1,
        est_q1: 3,
        est_q1b: 2,
        pess_q4: 2,
        pess_q6: 1,
        gov_q1: 2,
        gov_q2: 2,
        tec_q1: 1,
        tec_q1b: 2,
      },
      participant: {
        name: "Teste Interno Snowfox",
        email: "teste-interno@snowfox.ai",
        storageAcknowledged: true as const,
      },
      submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
      clientSubmittedAt: "2026-08-04T20:00:00.000Z",
    };

    const first = buildReportSnapshot(input);
    const second = buildReportSnapshot(input);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      schemaVersion: 1,
      assessmentVersion: 2,
      submissionId: input.submissionId,
      participant: input.participant,
      clientSubmittedAt: input.clientSubmittedAt,
      answers: input.answers,
    });
    expect(first.report.executiveSummary.priorityId).toBe(first.report.quarterlyRecommendations[0].priorityId);
    expect(first.report.overallScore).toBeTypeOf("number");
    expect(first.report.pillarScores).toHaveLength(5);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.report)).toBe(true);
    expect(Object.isFrozen(first.report.pillarScores)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the snapshot test and verify RED**

Run:

```bash
npx vitest run app/reportSnapshot.test.ts
```

Expected: FAIL because `app/reportSnapshot.ts` does not exist.

- [ ] **Step 3: Define the snapshot contract**

Create `app/reportSnapshot.ts` with:

```ts
export interface ParticipantIdentity {
  name: string;
  email: string;
  storageAcknowledged: true;
}

export interface ReportContents {
  overallScore: number;
  result: AssessmentResult;
  pillarScores: PillarScore[];
  strongest: PillarScore;
  weakest: PillarScore;
  primaryPriority: PrimaryPriority;
  executiveSummary: ExecutiveSummary;
  quarterlyRecommendations: QuarterlyRecommendation[];
  evidence: QuestionEvidence[];
  profile: ReadinessProfile;
  criticalPath: CriticalPathGate[];
  nextLevel: NextLevelTarget;
  riskSignals: RiskSignal[];
  opportunityTracks: OpportunityTrack[];
}

export interface ReportSnapshot {
  schemaVersion: 1;
  assessmentVersion: 2;
  submissionId: string;
  participant: ParticipantIdentity;
  clientSubmittedAt: string;
  answers: AnswerRecord;
  report: ReportContents;
}

export interface BuildReportSnapshotInput {
  answers: AnswerRecord;
  participant: ParticipantIdentity;
  submissionId: string;
  clientSubmittedAt: string;
}
```

Import each referenced type from `data`, `resultAnalysis`, and `resultInsights`; do not duplicate those types.

Add a recursive freeze helper:

```ts
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
```

- [ ] **Step 4: Implement the pure builder**

```ts
export function buildReportSnapshot(input: BuildReportSnapshotInput): ReportSnapshot {
  const answers = structuredClone(input.answers);
  const pillarScores = calculatePillarScores(answers);
  const overallScore = calculateOverallScore(answers);
  const result = applyBlockerRules(overallScore, pillarScores);
  const strongest = pillarScores.reduce((current, item) => item.score > current.score ? item : current);
  const weakest = pillarScores.reduce((current, item) => item.score < current.score ? item : current);
  const primaryPriority = getPrimaryPriority({ answers, pillarScores, weakest });
  const executiveSummary = buildExecutiveSummary({ answers, pillarScores, result, strongest, weakest });
  const quarterlyRecommendations = buildQuarterlyRecommendations({ answers, pillarScores, result, strongest, weakest });

  const snapshot: ReportSnapshot = {
    schemaVersion: 1,
    assessmentVersion: 2,
    submissionId: input.submissionId,
    participant: { ...input.participant },
    clientSubmittedAt: input.clientSubmittedAt,
    answers,
    report: {
      overallScore,
      result,
      pillarScores,
      strongest,
      weakest,
      primaryPriority,
      executiveSummary,
      quarterlyRecommendations,
      evidence: buildQuestionEvidence(answers),
      profile: getReadinessProfile(pillarScores, result),
      criticalPath: getCriticalPath(answers, pillarScores, result),
      nextLevel: getNextLevelTarget(result),
      riskSignals: getRiskSignals(answers, pillarScores),
      opportunityTracks: getOpportunityTracks(answers, pillarScores),
    },
  };

  return deepFreeze(snapshot);
}
```

Import every called function from its existing owner. Do not read `Date`, `window`, storage, or environment variables in this builder.

- [ ] **Step 5: Run the snapshot test and verify GREEN**

Run:

```bash
npx vitest run app/reportSnapshot.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the independently compiling snapshot unit**

Run:

```bash
npm test
```

Expected: PASS.

Commit:

```bash
git add app/reportSnapshot.ts app/reportSnapshot.test.ts
git commit -m "feat: build immutable assessment report snapshots"
```

---

### Task 2: Parse and Migrate Version-2 Browser Drafts

**Files:**
- Create: `app/assessmentDraft.ts`
- Create: `app/assessmentDraft.test.ts`
- Modify: `app/page.tsx:12-41`

**Interfaces:**
- Produces: `AssessmentDraftV2`
- Produces: `ReportSubmissionReceipt`
- Produces: `parseAssessmentDraft(value: unknown): AssessmentDraftV2 | null`
- Consumes: `ReportSnapshot` from Task 1

- [ ] **Step 1: Write failing parser and migration tests**

Create `app/assessmentDraft.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseAssessmentDraft } from "./assessmentDraft";

describe("parseAssessmentDraft", () => {
  it("migrates a version-1 completed draft to an unsaved version-2 report", () => {
    expect(parseAssessmentDraft({
      version: 1,
      screen: "results",
      resumeScreen: "results",
      section: 4,
      answers: { tec_q1: 1, tec_q1b: 2 },
      updatedAt: "2026-08-04T19:00:00.000Z",
    })).toEqual({
      version: 2,
      screen: "results",
      resumeScreen: "results",
      section: 4,
      answers: { tec_q1: 1, tec_q1b: 2 },
      pendingReport: null,
      reportReceipt: null,
      updatedAt: "2026-08-04T19:00:00.000Z",
    });
  });

  it("rejects malformed answers, snapshots, and receipts", () => {
    expect(parseAssessmentDraft({ version: 2, screen: "results", section: 4, answers: { bad: {} } })).toBeNull();
    expect(parseAssessmentDraft({ version: 2, screen: "results", section: 4, answers: {}, pendingReport: { submissionId: 12 } })).toBeNull();
  });
});
```

Add fixtures built with `buildReportSnapshot()` for these assertions:

```ts
it("retains a valid pending report for idempotent retry", () => {
  const draft = makeValidDraft({ pendingReport: validSnapshot, reportReceipt: null });
  expect(parseAssessmentDraft(draft)?.pendingReport).toEqual(validSnapshot);
});

it("requires a confirmed receipt to match its pending snapshot", () => {
  const draft = makeValidDraft({
    pendingReport: validSnapshot,
    reportReceipt: { submissionId: crypto.randomUUID(), receivedAt: "2026-08-04T20:01:00+00:00", payloadHash: "a".repeat(64) },
  });
  expect(parseAssessmentDraft(draft)).toBeNull();
});
```

- [ ] **Step 2: Run draft tests and verify RED**

Run:

```bash
npx vitest run app/assessmentDraft.test.ts
```

Expected: FAIL because `assessmentDraft.ts` does not exist.

- [ ] **Step 3: Define the version-2 draft contract**

```ts
export interface ReportSubmissionReceipt {
  submissionId: string;
  receivedAt: string;
  payloadHash: string;
}

export interface AssessmentDraftV2 {
  version: 2;
  screen: AppScreen;
  resumeScreen?: "quiz" | "results" | null;
  section: number;
  answers: AnswerRecord;
  pendingReport: ReportSnapshot | null;
  reportReceipt: ReportSubmissionReceipt | null;
  updatedAt: string;
}
```

Implement guards for answers, participant, UUID v4, ISO timestamps, all `ReportContents` keys, and a 64-character hexadecimal receipt hash. A receipt is valid only when a pending snapshot exists and both IDs match.

Version-1 migration preserves `screen`, `resumeScreen`, `section`, `answers`, and `updatedAt`, then adds null persistence fields. `page.tsx` continues to clamp the section after parsing.

- [ ] **Step 4: Run draft tests and verify GREEN**

Run:

```bash
npx vitest run app/assessmentDraft.test.ts
```

Expected: PASS.

- [ ] **Step 5: Replace page-level draft guards**

Delete private `AssessmentDraft`, `isAnswerRecord`, and `isAssessmentDraft` from `app/page.tsx`. Import `AssessmentDraftV2` and `parseAssessmentDraft`; hydrate `pendingReport` and `reportReceipt` in addition to existing fields.

- [ ] **Step 6: Run tests and commit Task 2**

Run:

```bash
npm test
```

Expected: PASS.

Commit:

```bash
git add app/assessmentDraft.ts app/assessmentDraft.test.ts app/page.tsx
git commit -m "feat: migrate assessment drafts for report persistence"
```

---

### Task 3: Implement and Integration-Test the PHP JSON Endpoint

**Files:**
- Create: `public/api/reports.php`
- Create: `server/reportsEndpoint.test.ts`

**Interfaces:**
- Consumes: exact `ReportSnapshot` JSON contract from Task 1
- Produces: `POST /api/reports.php`
- Produces success: `{ submissionId: string, receivedAt: string, payloadHash: string }`
- Produces errors: `{ error: string, code: string }`
- Reads: `SNOWFOX_AI_REPORT_DIR` for tests; defaults to the production durable path

- [ ] **Step 1: Write a valid endpoint fixture and failing creation test**

Create `server/reportsEndpoint.test.ts`. Start PHP once per suite with a temporary report directory and a free loopback port:

```ts
import { chmod, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildReportSnapshot } from "../app/reportSnapshot";

const snapshot = buildReportSnapshot({
  answers: { dados_q1: 2, est_q1: 3, est_q1b: 2, tec_q1: 1, tec_q1b: 2 },
  participant: { name: "Teste Endpoint", email: "endpoint@snowfox.ai", storageAcknowledged: true },
  submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
  clientSubmittedAt: "2026-08-04T20:00:00.000Z",
});
```

Use a helper that binds a temporary Node TCP server to port `0`, reads the assigned port, closes it, then starts:

```ts
php = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", "public"], {
  cwd: process.cwd(),
  env: { ...process.env, SNOWFOX_AI_REPORT_DIR: reportDir },
  stdio: "pipe",
});
```

Poll `GET /api/reports.php` until it returns `405`. Define:

```ts
const post = (body: unknown, requestOrigin = origin) => fetch(`${origin}/api/reports.php`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: requestOrigin },
  body: JSON.stringify(body),
});
```

Use `beforeEach` to remove only files created inside the suite's temporary `reportDir`, so each test starts with zero JSON and lock files. Never point cleanup at the production default path.

Then test:

```ts
it("writes one validated report outside the web root", async () => {
  const response = await post(snapshot);
  expect(response.status).toBe(201);
  const receipt = await response.json();
  expect(receipt).toMatchObject({ submissionId: snapshot.submissionId });

  const files = await readdir(reportDir);
  expect(files.filter(file => file.endsWith(".json"))).toEqual([`${snapshot.submissionId}.json`]);
  const saved = JSON.parse(await readFile(path.join(reportDir, `${snapshot.submissionId}.json`), "utf8"));
  expect(saved).toMatchObject({ ...snapshot, receivedAt: receipt.receivedAt, payloadHash: receipt.payloadHash });
  expect(saved).not.toHaveProperty("ip");
});
```

Ensure `afterAll` terminates PHP and removes the temporary report directory.

- [ ] **Step 2: Add failing idempotency, conflict, and validation tests**

```ts
it("returns the original receipt for an identical retry", async () => {
  const first = await post(snapshot);
  const firstReceipt = await first.json();
  const second = await post(snapshot);
  expect(first.status).toBe(201);
  expect(second.status).toBe(200);
  expect(await second.json()).toEqual(firstReceipt);
  expect((await readdir(reportDir)).filter(file => file.endsWith(".json"))).toHaveLength(1);
});

it("rejects changed content that reuses a submission id", async () => {
  await post(snapshot);
  const response = await post({ ...snapshot, participant: { ...snapshot.participant, name: "Outro Nome" } });
  expect(response.status).toBe(409);
});

it.each([
  ["wrong method", () => fetch(`${origin}/api/reports.php`, { method: "GET" }), 405],
  ["wrong origin", () => post(snapshot, "https://example.com"), 403],
  ["wrong content type", () => fetch(`${origin}/api/reports.php`, { method: "POST", headers: { "content-type": "text/plain", origin }, body: JSON.stringify(snapshot) }), 415],
  ["invalid name", () => post({ ...snapshot, participant: { ...snapshot.participant, name: "X" } }), 400],
  ["invalid email", () => post({ ...snapshot, participant: { ...snapshot.participant, email: "not-an-email" } }), 400],
  ["missing acknowledgement", () => post({ ...snapshot, participant: { ...snapshot.participant, storageAcknowledged: false } }), 400],
  ["invalid uuid", () => post({ ...snapshot, submissionId: "bad-id" }), 400],
  ["invalid report shape", () => post({ ...snapshot, report: { overallScore: 50 } }), 400],
  ["extra top-level field", () => post({ ...snapshot, extra: true }), 400],
] as const)("rejects %s", async (_label, request, expectedStatus) => {
  expect((await request()).status).toBe(expectedStatus);
});
```

Add an oversized request containing a 257 KiB string and expect `413`.

Add a write-failure test that temporarily applies mode `0500` to the suite's temporary report directory, posts a snapshot with a different UUID, expects `500` and code `storage_unavailable`, then restores mode `0700` in `finally`.

- [ ] **Step 3: Run endpoint tests and verify RED**

Run:

```bash
php -v
npx vitest run server/reportsEndpoint.test.ts
```

Expected: PHP 8.2+ is available; tests FAIL because `/api/reports.php` does not exist.

- [ ] **Step 4: Create response, origin, and schema-validation helpers**

Create `public/api/reports.php` with `declare(strict_types=1);` and:

```php
function respond(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function reject_request(int $status, string $code, string $message): never {
    respond($status, ['error' => $message, 'code' => $code]);
}

function has_exact_keys(array $value, array $expected): bool {
    $actual = array_keys($value);
    sort($actual);
    sort($expected);
    return $actual === $expected;
}

function canonicalize(mixed $value): mixed {
    if (!is_array($value)) return $value;
    if (array_is_list($value)) return array_map('canonicalize', $value);
    ksort($value);
    foreach ($value as $key => $item) $value[$key] = canonicalize($item);
    return $value;
}
```

Enforce in order:

```php
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reject_request(405, 'method_not_allowed', 'Método não permitido.');

$host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
$originHost = strtolower((string) parse_url($_SERVER['HTTP_ORIGIN'] ?? '', PHP_URL_HOST));
if ($host === '' || $originHost === '' || !hash_equals($host, $originHost)) {
    reject_request(403, 'origin_not_allowed', 'Origem não permitida.');
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') reject_request(415, 'unsupported_media_type', 'Envie JSON.');
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 262144) reject_request(413, 'payload_too_large', 'Relatório excede o limite permitido.');
```

Read at most 262145 bytes. Reject empty, invalid, non-object, or oversized bodies. Require exact top-level keys:

```php
['schemaVersion', 'assessmentVersion', 'submissionId', 'participant', 'clientSubmittedAt', 'answers', 'report']
```

Require exact participant keys:

```php
['name', 'email', 'storageAcknowledged']
```

Apply these exact validation rules:

- schema version integer `1` and assessment version integer `2`;
- UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`, case-insensitive;
- trimmed UTF-8 name length 2-120 characters;
- email accepted by `FILTER_VALIDATE_EMAIL` and at most 254 characters;
- acknowledgement exactly `true`;
- client timestamp accepted by `DateTimeImmutable` and containing an explicit timezone;
- answers is an associative object with keys matching `^[a-z0-9_]+$`; values are finite numbers, strings up to 2,000 characters, or arrays of finite numbers;
- report has exact keys `overallScore`, `result`, `pillarScores`, `strongest`, `weakest`, `primaryPriority`, `executiveSummary`, `quarterlyRecommendations`, `evidence`, `profile`, `criticalPath`, `nextLevel`, `riskSignals`, `opportunityTracks`;
- overall score is finite and 0-100; object fields are associative arrays and list fields are arrays.

- [ ] **Step 5: Implement canonical hash, lock, idempotency, and atomic write**

Use:

```php
$canonicalJson = json_encode(canonicalize($payload), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
$payloadHash = hash('sha256', $canonicalJson);
$reportDir = getenv('SNOWFOX_AI_REPORT_DIR') ?: '/opt/snowfox-wordpress/data/ai-readiness-reports';
if (!is_dir($reportDir) || !is_writable($reportDir)) reject_request(500, 'storage_unavailable', 'Não foi possível salvar o relatório.');

$filePath = $reportDir . DIRECTORY_SEPARATOR . strtolower($payload['submissionId']) . '.json';
$lockPath = $filePath . '.lock';
$lock = fopen($lockPath, 'c');
if ($lock === false || !flock($lock, LOCK_EX)) reject_request(500, 'storage_unavailable', 'Não foi possível salvar o relatório.');
```

Inside the lock:

1. If the file exists, decode it and compare `payloadHash`. Return its existing receipt with `200` when equal; return `409` when different.
2. Set `$receivedAt` with UTC `DateTimeInterface::ATOM`.
3. Build the saved envelope from request fields plus `receivedAt` and `payloadHash`.
4. Write encoded JSON plus a newline to `tempnam($reportDir, '.report-')` using `LOCK_EX`.
5. Apply `chmod($tempPath, 0640)` and `rename($tempPath, $filePath)`.
6. Release/close the lock and remove the `.lock` file.
7. Return `{ submissionId, receivedAt, payloadHash }` with `201`.

Wrap JSON and filesystem exceptions and return generic `500` without names, emails, paths, or raw request data.

- [ ] **Step 6: Run endpoint tests and verify GREEN**

Run:

```bash
php -l public/api/reports.php
npx vitest run server/reportsEndpoint.test.ts
```

Expected: syntax check reports no errors and all endpoint tests PASS.

- [ ] **Step 7: Verify static export includes valid PHP**

Run:

```bash
npm run build
test -f out/api/reports.php
php -l out/api/reports.php
```

Expected: all commands succeed.

- [ ] **Step 8: Commit Task 3**

```bash
git add public/api/reports.php server/reportsEndpoint.test.ts
git commit -m "feat: persist assessment reports as server JSON"
```

---

### Task 4: Validate Identity and Submit with Idempotent Retries

**Files:**
- Create: `app/reportSubmission.ts`
- Create: `app/reportSubmission.test.ts`

**Interfaces:**
- Produces: `ParticipantInput`
- Produces: `ParticipantValidationErrors`
- Produces: `validateParticipant(input): ParticipantValidationErrors`
- Produces: `normalizeParticipant(input): ParticipantIdentity`
- Produces: `submitReportSnapshot(snapshot, fetcher?): Promise<ReportSubmissionReceipt>`
- Produces: `ReportSubmissionError`

- [ ] **Step 1: Write failing participant-validation tests**

Create `app/reportSubmission.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { normalizeParticipant, submitReportSnapshot, validateParticipant } from "./reportSubmission";

describe("participant validation", () => {
  it("requires a usable name, email, and acknowledgement", () => {
    expect(validateParticipant({ name: "", email: "x", storageAcknowledged: false })).toEqual({
      name: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      storageAcknowledged: "Confirme o armazenamento para gerar o relatório.",
    });
  });

  it("normalizes valid identity without adding fields", () => {
    expect(normalizeParticipant({ name: "  Gabi Silva  ", email: "  GABI@EXAMPLE.COM ", storageAcknowledged: true })).toEqual({
      name: "Gabi Silva",
      email: "gabi@example.com",
      storageAcknowledged: true,
    });
  });
});
```

- [ ] **Step 2: Write failing submission-contract tests**

Use a snapshot fixture from `buildReportSnapshot()` and add:

```ts
it("posts the unchanged snapshot to the same-origin endpoint", async () => {
  const receipt = {
    submissionId: snapshot.submissionId,
    receivedAt: "2026-08-04T20:01:00+00:00",
    payloadHash: "a".repeat(64),
  };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt), {
    status: 201,
    headers: { "content-type": "application/json" },
  }));

  await expect(submitReportSnapshot(snapshot, fetcher, "/Snowfox-AI-Questionnaire")).resolves.toEqual(receipt);
  expect(fetcher).toHaveBeenCalledWith("/Snowfox-AI-Questionnaire/api/reports.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
});

it("surfaces a retryable server failure without changing the snapshot", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "storage_unavailable", error: "Não foi possível salvar o relatório." }), { status: 500 }));
  const before = JSON.stringify(snapshot);
  await expect(submitReportSnapshot(snapshot, fetcher, "")).rejects.toMatchObject({ retryable: true, status: 500 });
  expect(JSON.stringify(snapshot)).toBe(before);
});

it("does not mark a conflicting id as retryable", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "submission_conflict", error: "Identificador já utilizado." }), { status: 409 }));
  await expect(submitReportSnapshot(snapshot, fetcher, "")).rejects.toMatchObject({ retryable: false, status: 409 });
});
```

- [ ] **Step 3: Run submission tests and verify RED**

Run:

```bash
npx vitest run app/reportSubmission.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 4: Implement validation, normalization, and typed failures**

```ts
export interface ParticipantInput {
  name: string;
  email: string;
  storageAcknowledged: boolean;
}

export type ParticipantValidationErrors = Partial<Record<keyof ParticipantInput, string>>;

export function validateParticipant(input: ParticipantInput): ParticipantValidationErrors {
  const errors: ParticipantValidationErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  if (name.length < 2 || name.length > 120) errors.name = "Informe seu nome.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Informe um e-mail válido.";
  if (!input.storageAcknowledged) errors.storageAcknowledged = "Confirme o armazenamento para gerar o relatório.";
  return errors;
}

export function normalizeParticipant(input: ParticipantInput): ParticipantIdentity {
  const errors = validateParticipant(input);
  if (Object.keys(errors).length > 0) throw new Error("Participant must be valid before normalization.");
  return { name: input.name.trim(), email: input.email.trim().toLocaleLowerCase("pt-BR"), storageAcknowledged: true };
}

export class ReportSubmissionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}
```

- [ ] **Step 5: Implement the exact POST client**

```ts
type Fetcher = typeof fetch;

export async function submitReportSnapshot(
  snapshot: ReportSnapshot,
  fetcher: Fetcher = fetch,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
): Promise<ReportSubmissionReceipt> {
  let response: Response;
  try {
    response = await fetcher(`${basePath}/api/reports.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
  } catch {
    throw new ReportSubmissionError("Não foi possível conectar ao servidor. Tente novamente.", 0, "network_error", true);
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof body.error === "string" ? body.error : "Não foi possível salvar o relatório.";
    const code = typeof body.code === "string" ? body.code : "unknown_error";
    throw new ReportSubmissionError(message, response.status, code, response.status >= 500 || response.status === 0);
  }

  if (
    body.submissionId !== snapshot.submissionId ||
    typeof body.receivedAt !== "string" ||
    typeof body.payloadHash !== "string" ||
    !/^[0-9a-f]{64}$/i.test(body.payloadHash)
  ) {
    throw new ReportSubmissionError("O servidor retornou uma confirmação inválida.", response.status, "invalid_receipt", true);
  }
  return body as unknown as ReportSubmissionReceipt;
}
```

- [ ] **Step 6: Run tests and commit Task 4**

Run:

```bash
npx vitest run app/reportSubmission.test.ts
```

Expected: PASS.

Commit:

```bash
git add app/reportSubmission.ts app/reportSubmission.test.ts
git commit -m "feat: validate and submit report identity"
```

---

### Task 5: Gate Results Behind Confirmed Persistence

**Files:**
- Create: `components/results/ReportIdentityGate.tsx`
- Modify: `app/page.tsx:43-220`
- Modify: `components/results/ResultsScreen.tsx`
- Modify: `components/landing/LandingScreen.tsx:18-100`
- Modify: `components/Navbar.tsx:9-70`
- Modify: `app/globals.css`
- Test: `app/assessmentDraft.test.ts`
- Test: `app/reportSubmission.test.ts`

**Interfaces:**
- Consumes: `buildReportSnapshot()`, `parseAssessmentDraft()`, `validateParticipant()`, `normalizeParticipant()`, and `submitReportSnapshot()`
- Produces: `ReportIdentityGate` props `{ pendingReport, submitState, errorMessage, onSubmit, onRetry }`
- Changes: `ResultsScreen` receives `snapshot: ReportSnapshot`

- [ ] **Step 1: Add the confirmed-report parser test**

Add to `app/assessmentDraft.test.ts`:

```ts
it("retains the exact confirmed snapshot and receipt", () => {
  const draft = makeValidDraft({
    pendingReport: validSnapshot,
    reportReceipt: {
      submissionId: validSnapshot.submissionId,
      receivedAt: "2026-08-04T20:01:00+00:00",
      payloadHash: "a".repeat(64),
    },
  });
  expect(parseAssessmentDraft(draft)).toEqual(draft);
});
```

Run:

```bash
npx vitest run app/assessmentDraft.test.ts -t "confirmed snapshot"
```

Expected: PASS only after Task 2's snapshot/receipt cross-field guard is complete.

- [ ] **Step 2: Create the focused identity gate UI**

`ReportIdentityGate.tsx` owns local input values only before the first submit. Use `validateParticipant()` on submit and `normalizeParticipant()` before calling `onSubmit`.

Render this structure:

```tsx
<section className="report-identity page-frame" aria-labelledby="report-identity-title">
  <div className="report-identity-copy">
    <span className="section-kicker"><span className="kicker-line" /> Última etapa</span>
    <h1 id="report-identity-title">Identifique seu diagnóstico</h1>
    <p>Informe seus dados para salvar o relatório e acessar a leitura completa.</p>
  </div>
  <form className="report-identity-form" onSubmit={handleSubmit} noValidate>
    <label>
      <span>Nome</span>
      <input name="name" autoComplete="name" maxLength={120} disabled={locked} value={name} onChange={handleName} />
      {errors.name && <small role="alert">{errors.name}</small>}
    </label>
    <label>
      <span>E-mail</span>
      <input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} disabled={locked} value={email} onChange={handleEmail} />
      {errors.email && <small role="alert">{errors.email}</small>}
    </label>
    <label className="report-storage-acknowledgement">
      <input type="checkbox" checked={storageAcknowledged} disabled={locked} onChange={handleAcknowledgement} />
      <span>Concordo que a Snowfox armazene meu nome, e-mail e respostas para registrar e acompanhar este diagnóstico.</span>
    </label>
    {errors.storageAcknowledged && <small role="alert">{errors.storageAcknowledged}</small>}
    {errorMessage && <div className="report-submit-error" role="alert">{errorMessage}</div>}
    <button className="button-primary" type={locked ? "button" : "submit"} onClick={locked ? onRetry : undefined} disabled={submitState === "saving"}>
      {submitState === "saving" ? "Salvando relatório..." : locked ? "Tentar novamente" : "Salvar e ver relatório"}
    </button>
  </form>
</section>
```

Use `LoaderCircle` from Lucide while saving, with `aria-live="polite"` and stable button dimensions. Do not add a marketing checkbox, company input, or nested card.

- [ ] **Step 3: Add draft-backed submission state in `Home`**

Add:

```ts
const [pendingReport, setPendingReport] = useState<ReportSnapshot | null>(null);
const [reportReceipt, setReportReceipt] = useState<ReportSubmissionReceipt | null>(null);
const [reportSubmitState, setReportSubmitState] = useState<"idle" | "saving" | "failed">("idle");
const [reportSubmitError, setReportSubmitError] = useState<string | null>(null);
```

Hydrate both persistence fields from `parseAssessmentDraft()`. Include them in `buildDraft()` with `version: 2`.

Extract one `persistDraft(draft: AssessmentDraftV2)` helper used by both debounced autosave and critical report writes. It serializes to the existing storage key and updates `SaveState`; it must not swallow a local failure while claiming the report is centrally saved.

When an answer changes after a report was built, clear `pendingReport`, `reportReceipt`, and submission errors. On restart, clear all persistence state in addition to answers.

- [ ] **Step 4: Implement submit and retry without changing IDs**

```ts
const saveReport = useCallback(async (snapshot: ReportSnapshot) => {
  setReportSubmitState("saving");
  setReportSubmitError(null);
  try {
    const receipt = await submitReportSnapshot(snapshot);
    setReportReceipt(receipt);
    persistDraft(buildDraft({ pendingReport: snapshot, reportReceipt: receipt }));
    setReportSubmitState("idle");
  } catch (error) {
    const message = error instanceof ReportSubmissionError
      ? error.message
      : "Não foi possível salvar o relatório. Tente novamente.";
    setReportSubmitError(message);
    setReportSubmitState("failed");
  }
}, [buildDraft, persistDraft]);

const handleReportIdentity = useCallback((participant: ParticipantIdentity) => {
  const snapshot = buildReportSnapshot({
    answers,
    participant,
    submissionId: crypto.randomUUID(),
    clientSubmittedAt: new Date().toISOString(),
  });
  setPendingReport(snapshot);
  persistDraft(buildDraft({ pendingReport: snapshot, reportReceipt: null }));
  void saveReport(snapshot);
}, [answers, buildDraft, persistDraft, saveReport]);

const retryReport = useCallback(() => {
  if (pendingReport) void saveReport(pendingReport);
}, [pendingReport, saveReport]);
```

Adjust `buildDraft` to accept field overrides or build the explicit next draft before state updates. The critical requirement is that the exact pending snapshot is in local storage before network completion. Never regenerate identity, timestamp, or submission ID on retry.

Resume a pending write once after hydration:

```ts
useEffect(() => {
  if (!hydrated || !pendingReport || reportReceipt || reportSubmitState !== "idle") return;
  void saveReport(pendingReport);
}, [hydrated, pendingReport, reportReceipt, reportSubmitState, saveReport]);
```

After a failed automatic attempt, state becomes `failed`, so this effect does not loop; the locked form exposes the explicit retry button.

- [ ] **Step 5: Gate the result branch and finish the snapshot caller change**

Replace the result branch:

```tsx
{screen === "results" && (!pendingReport || !reportReceipt) && (
  <ReportIdentityGate
    pendingReport={pendingReport}
    submitState={reportSubmitState}
    errorMessage={reportSubmitError}
    onSubmit={handleReportIdentity}
    onRetry={retryReport}
  />
)}

{screen === "results" && pendingReport && reportReceipt && (
  <ResultsScreen snapshot={pendingReport} onRestart={restart} />
)}
```

The gate initializes identity from `pendingReport?.participant` and locks fields whenever a pending report exists. A migrated version-1 result naturally shows the blank gate. Do not provide a continue-without-saving action.

Complete the deferred Task 1 `ResultsScreen` change now: render only values from `snapshot.report` and derive the displayed date from `clientSubmittedAt`.

- [ ] **Step 6: Update landing and navigation copy**

Pass `reportConfirmed={Boolean(reportReceipt)}` to `LandingScreen`.

For a results draft without confirmation, render:

```text
Seu diagnóstico está pronto para ser salvo.
Informe seus dados para registrar e acessar o relatório.
```

For a confirmed receipt, preserve `Seu relatório está pronto.`.

In Navbar, keep the local draft save semantics. When the results screen is gated, pass a context boolean and show `Finalizar relatório`; never label a pending central report as saved.

- [ ] **Step 7: Add compact responsive styling**

Add, adapting existing input/focus variables where available:

```css
.report-identity { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(320px, 1fr); gap: 56px; align-items: start; padding-block: 72px; }
.report-identity-copy h1 { max-width: 560px; margin-top: 14px; font-family: 'Montserrat', sans-serif; font-size: 36px; line-height: 1.15; }
.report-identity-copy p { max-width: 520px; margin-top: 16px; color: var(--muted); line-height: 1.65; }
.report-identity-form { display: grid; gap: 18px; padding-top: 4px; }
.report-identity-form label { display: grid; gap: 7px; }
.report-identity-form input[type="text"], .report-identity-form input[type="email"] { min-height: 46px; padding: 0 13px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--ink); }
.report-storage-acknowledgement { grid-template-columns: 18px minmax(0, 1fr); align-items: start; }
.report-submit-error { padding: 11px 13px; border-left: 3px solid var(--amber); background: rgba(239, 177, 76, 0.08); color: var(--ink-soft); }

@media (max-width: 760px) {
  .report-identity { grid-template-columns: 1fr; gap: 32px; padding-block: 36px; }
  .report-identity-copy h1 { font-size: 28px; }
}
```

Keep all text inside its grid track at 320 px width. Do not use viewport-scaled type, decorative gradients, or a card around the form.

- [ ] **Step 8: Run automated verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests PASS, static export succeeds, and diff check prints nothing.

- [ ] **Step 9: Manually verify the browser state machine**

Build with an empty base path for local PHP serving, then run:

```bash
NEXT_PUBLIC_BASE_PATH="" npm run build
mkdir -p /tmp/snowfox-ai-reports
SNOWFOX_AI_REPORT_DIR=/tmp/snowfox-ai-reports php -S 127.0.0.1:8013 -t out
```

Open `http://127.0.0.1:8013/` and verify desktop and mobile widths:

1. incomplete name/email/acknowledgement shows field-level errors;
2. valid submit shows a stable saving state;
3. server failure retains locked identity and offers retry;
4. retry uses one submission ID and creates one JSON;
5. reload before confirmation restores pending report and retry;
6. confirmed report renders the exact saved score and priority;
7. restart clears local state but leaves the JSON file.

- [ ] **Step 10: Commit Task 5**

```bash
git add app/page.tsx components/results/ReportIdentityGate.tsx components/results/ResultsScreen.tsx components/landing/LandingScreen.tsx components/Navbar.tsx app/globals.css app/assessmentDraft.test.ts app/reportSubmission.test.ts
git commit -m "feat: require saved identity before report access"
```

---

### Task 6: Provision Durable Storage and CI Verification

**Files:**
- Modify: `.github/workflows/deploy-ai-readiness.yml`

**Interfaces:**
- Produces production directory: `/opt/snowfox-wordpress/data/ai-readiness-reports`
- Preserves deployment target: `/opt/snowfox-wordpress/html/assessments/ai-readiness`

- [ ] **Step 1: Add PHP provisioning before tests**

After Node setup and before `npm ci`, add:

```yaml
      - name: Set up PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          coverage: none
```

Keep `npm test` as the single CI test entry point. Vitest's current default include already discovers `server/reportsEndpoint.test.ts`; do not add a second test command.

- [ ] **Step 2: Verify the static export contains valid PHP**

After the build step, add:

```yaml
      - name: Verify report endpoint export
        run: |
          test -f out/api/reports.php
          php -l out/api/reports.php
```

- [ ] **Step 3: Define the durable path once**

Add to workflow `env`:

```yaml
  REPORT_DATA_PATH: /opt/snowfox-wordpress/data/ai-readiness-reports
```

Do not place it under `DEPLOY_PATH` or include it in the release archive.

- [ ] **Step 4: Create but never replace the report directory**

In the publish script, after `ssh_opts` and `destination` are defined but before release upload, run:

```bash
ssh "${ssh_opts[@]}" "$destination" \
  "sudo -n install -d -o www-data -g www-data -m 0750 '$REPORT_DATA_PATH'"
```

Do not add `rm`, `rsync --delete`, `mv`, backup rotation, or recursive ownership changes against `REPORT_DATA_PATH`.

- [ ] **Step 5: Run the full release verification locally**

Run:

```bash
npm test
npm run build
test -f out/api/reports.php
php -l out/api/reports.php
git diff --check
```

Expected: tests PASS, build PASS, endpoint exists with valid PHP syntax, and diff check is clean.

- [ ] **Step 6: Review the workflow for destructive path overlap**

Run:

```bash
git diff -- .github/workflows/deploy-ai-readiness.yml
```

Confirm:

```text
REPORT_DATA_PATH != DEPLOY_PATH
REPORT_DATA_PATH is only passed to install -d
all release replacement commands still target DEPLOY_PATH or remote temporary paths
```

- [ ] **Step 7: Commit Task 6**

```bash
git add .github/workflows/deploy-ai-readiness.yml
git commit -m "ci: provision durable assessment report storage"
```

---

## Production Rollout Gate

After merging and deployment:

1. Submit one assessment using `Teste Interno Snowfox` and a Snowfox-controlled email.
2. Confirm the browser receives `201` and shows the report.
3. On the server, run an authorized read-only check:

```bash
sudo -n find /opt/snowfox-wordpress/data/ai-readiness-reports -maxdepth 1 -type f -name '*.json' -printf '%f %m %u:%g %s bytes\n'
```

Expected: one UUID-named JSON, mode `640`, owned by the web process/group, with a plausible nonzero size.

4. Compare JSON `report.overallScore`, `report.executiveSummary.priorityId`, and the first roadmap `priorityId` to the browser.
5. Reload/retry and confirm the file count does not increase.
6. Run a second deployment and confirm the file remains unchanged.

Do not use a production report as a test fixture and do not print name, email, or full answers into CI or deployment logs.
