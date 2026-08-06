# Question-Led AI Roadmap And Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the weakest questionnaire answers in the lowest-scoring pillar into concrete roadmap activities, improve the desktop questionnaire layout, remove report communication overlap, and release the result to production.

**Architecture:** Keep the existing scoring, critical-path selection, and report snapshot as the evidence source. Add a dedicated activity catalog that maps selected weak question IDs to bounded roadmap activities and converts them into the existing quarterly recommendation interface, falling back to the current pillar roadmap when no weak gates exist. Preserve the report's four chapters so risks remain diagnostic, opportunities remain technical hypotheses, and the action plan becomes the sole concrete execution sequence.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, Vitest, PHP 8.2 integration tests, CSS, GitHub Actions, OVH deployment.

## Global Constraints

- `package.json` remains the only source of truth for report versioning.
- Respondent JSON content must not be printed or included in test, build, or deployment logs.
- Report activities must be evidence-based and presented as Snowfox recommendations without naming the source framework.
- The production cache contract and complete release procedure in `docs/RELEASE.md` remain mandatory.

---

### Task 1: Question-Led Activity Selection

**Files:**
- Create: `app/roadmapActivities.ts`
- Modify: `app/reportSnapshot.ts`
- Test: `app/roadmapActivities.test.ts`
- Test: `app/reportSnapshot.test.ts`

**Interfaces:**
- Consumes: `CriticalPathGate[]`, `AnswerRecord`, `Lang`, and the existing `QuarterlyRecommendation` contract.
- Produces: `buildQuestionLedRoadmap(gates, answers, lang): QuarterlyRecommendation[] | null`.

- [ ] **Step 1: Write failing tests for data, strategy, people, governance, engineering, value, delay-cause routing, deduplication, localization, and no-gap fallback.**
- [ ] **Step 2: Run `npx vitest run app/roadmapActivities.test.ts app/reportSnapshot.test.ts` and confirm failure because the activity builder and snapshot behavior do not exist.**
- [ ] **Step 3: Implement a typed activity catalog and question-to-activity mapping with a concrete first deliverable, outcome, owner, dependency, and completion measure for each activity.**
- [ ] **Step 4: Compute critical path once in `buildReportSnapshot`, prefer the question-led roadmap when gates exist, and retain the existing maturity-based roadmap as the advanced/no-gap fallback.**
- [ ] **Step 5: Run the focused tests and confirm they pass.**

### Task 2: Report Communication Audit And Action-Plan Copy

**Files:**
- Modify: `app/i18n.ts`
- Modify: `components/results/ResultsScreen.tsx`
- Test: `components/results/ResultsScreen.test.tsx`

**Interfaces:**
- Consumes: the question-led `quarterlyRecommendations` already stored in `ReportSnapshot`.
- Produces: a four-chapter report in which summary states the organizational priority, risks explain evidence, opportunities remain hypotheses, and the action plan contains the only ordered implementation activities.

- [ ] **Step 1: Write a failing static-render test that verifies the action plan identifies its activity-framework alignment without adding another duplicate report chapter.**
- [ ] **Step 2: Run the focused component test and confirm the expected copy is absent.**
- [ ] **Step 3: Rewrite the action-plan introduction to explain that activities come from the weakest answers in the lowest pillar; remove wording that repeats the summary or implies that opportunities are already approved priorities.**
- [ ] **Step 4: Render a restrained framework label in each roadmap detail while preserving owner, dependency, and success evidence.**
- [ ] **Step 5: Run focused report tests and review PT/EN generated text for within-section repetition and cross-section contradictions.**

### Task 3: Desktop Questionnaire Layout

**Files:**
- Modify: `app/globals.css`
- Test: `components/quiz/QuizScreen.test.tsx`

**Interfaces:**
- Consumes: the existing `.quiz-layout`, `.assessment-rail`, `.question-panel`, and `.question-card` DOM structure.
- Produces: a desktop layout with the navigation rail close to the left viewport edge, a wider question panel, and centered question content without changing tablet/mobile behavior.

- [ ] **Step 1: Add a failing source-level layout contract test for the desktop viewport rules and unchanged responsive breakpoint.**
- [ ] **Step 2: Run the test and confirm failure against the current centered `page-frame` layout.**
- [ ] **Step 3: Add desktop-only width and margin rules, preserve the 300px rail, reduce excess inter-column space, and increase centered question content width from 820px to 980px.**
- [ ] **Step 4: Run the focused test, start the dev server, and inspect desktop plus mobile screenshots for clipping, overlap, and regressions.**

### Task 4: Version And Complete Local Verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify if required: version-sensitive tests

**Interfaces:**
- Produces: a unique patch report version and a verified static export in `out`.

- [ ] **Step 1: Run `npm version patch --no-git-tag-version` and verify package files agree.**
- [ ] **Step 2: Run `RUN_PHP_INTEGRATION=1 npm test` under PHP 8.2 and confirm zero failures.**
- [ ] **Step 3: Delete only generated `.next` and `out` directories.**
- [ ] **Step 4: Run `NEXT_PUBLIC_BASE_PATH=/assessments/ai-readiness npm run build`.**
- [ ] **Step 5: Generate `out/deployment.json` with `npm run release:manifest -- "$(git rev-parse HEAD)" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"` and run `npm run release:verify-local`.**
- [ ] **Step 6: Review `git diff --check`, the complete diff, and production report metadata count/mtimes without reading respondent content.**

### Task 5: Commit, Push, Deploy, And Production Verification

**Files:**
- Verify unchanged: `.github/workflows/deploy-ai-readiness.yml`
- Verify remotely: `/opt/snowfox-wordpress/data/ai-readiness-reports`

**Interfaces:**
- Consumes: locally verified source and static export.
- Produces: a production deployment whose manifest matches the committed SHA.

- [ ] **Step 1: Commit all intended source, test, plan, and version changes with one release-ready commit.**
- [ ] **Step 2: Regenerate `out/deployment.json` using the exact new commit SHA and rerun `npm run release:verify-local`.**
- [ ] **Step 3: Push `master` and identify the exact `deploy-ai-readiness.yml` run.**
- [ ] **Step 4: Watch that workflow with `gh run watch <run-id> --exit-status` until successful.**
- [ ] **Step 5: Run the independent production verifier with the exact committed SHA.**
- [ ] **Step 6: Compare aggregate report count and mtimes with the pre-deploy metadata and confirm no saved report was modified or deleted.**
