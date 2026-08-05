# Report Version And Deploy Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish report version `v1.2.12` in the report heading and automatically verify deployment identity and JS/CSS cache behavior.

**Architecture:** `package.json` is the single version source consumed by the UI and release scripts. CI emits a deployment manifest, enforces version changes for new production commits, atomically publishes the static export, and verifies the production manifest, HTML, and hashed assets.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Node.js 22 scripts, Apache `.htaccess`, PHP 8.2, GitHub Actions.

## Global Constraints

- Display exactly `v1.2.12` in Portuguese and English report headings.
- Never duplicate the version literal in production source.
- Do not change report snapshot or saved JSON schemas.
- Never delete, synchronize, print, or mutate respondent JSON files.
- HTML and deployment metadata must not remain stale; hashed JS/CSS may be cached immutably.

---

### Task 1: Versioned Report Heading

**Files:**
- Create: `app/reportVersion.ts`
- Create: `app/reportVersion.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/i18n.ts`
- Modify: `components/results/ResultsScreen.tsx`

**Interfaces:**
- Produces: `REPORT_VERSION: string` from `package.json`.
- Produces: `reportDate(date: string, version: string): string` in both languages.

- [ ] Write a failing test asserting package version `1.2.12`, semantic-version shape, and both exact localized headings.
- [ ] Run `npm test -- app/reportVersion.test.ts` and confirm failure because the version and heading contract are absent.
- [ ] Set package and lockfile version to `1.2.12`, export `REPORT_VERSION`, add the version parameter to both heading functions, and pass it from `ResultsScreen`.
- [ ] Re-run the focused test and confirm success.

### Task 2: Deployment Manifest And Asset Verification

**Files:**
- Create: `scripts/deploymentManifest.mjs`
- Create: `scripts/deploymentManifest.test.mjs`
- Create: `public/.htaccess`
- Modify: `package.json`

**Interfaces:**
- `buildManifest({ reportVersion, commitSha, builtAt })` validates and returns deployment metadata.
- `writeManifest(outputDir, metadata)` writes `deployment.json` after the static build.
- `verifyStaticExport(outputDir, basePath)` checks referenced JS/CSS locally.
- CLI modes: `write`, `verify-local`, `check-version`, and `verify-production`.

- [ ] Write failing tests for manifest validation, writing, local HTML asset resolution, and invalid/missing asset rejection.
- [ ] Run `npm test -- scripts/deploymentManifest.test.mjs` and confirm failure because the module is absent.
- [ ] Implement the dependency-free Node module and CLI.
- [ ] Add package scripts for manifest writing and local export verification.
- [ ] Add Apache cache rules: HTML/JSON `no-cache, no-store, must-revalidate`; JS/CSS `public, max-age=31536000, immutable`.
- [ ] Re-run focused tests and confirm success.

### Task 3: Durable Release Rules And Workflow Enforcement

**Files:**
- Create: `AGENTS.md`
- Create: `docs/RELEASE.md`
- Modify: `.github/workflows/deploy-ai-readiness.yml`

**Interfaces:**
- The workflow passes `REPORT_VERSION`, `GITHUB_SHA`, production URL, and event type to the release CLI.
- Push deployments reject a version already published by another commit; manual recovery deploys may reuse it.

- [ ] Document the mandatory version bump, tests, deployment checks, cache checks, and report-storage safety rules.
- [ ] Configure checkout with full history and remove workflow path exclusions.
- [ ] Before build, run the production version gate.
- [ ] After build, write and locally validate `deployment.json` and all referenced JS/CSS.
- [ ] After atomic publish, verify HTTP 200, exact version/SHA, heading copy, asset existence, and cache headers in production.

### Task 4: Verify, Commit, Deploy, And Inspect Production

**Files:**
- Verify: all changed files and generated `out/` export.
- Verify remotely: `/opt/snowfox-wordpress/data/ai-readiness-reports` without reading respondent content.

**Interfaces:**
- Consumes: commit on `master` and the guarded deployment workflow.
- Produces: production heading `Relatório personalizado · <data> · v1.2.12` and matching `/deployment.json`.

- [ ] Record the production JSON count and mtimes before deployment.
- [ ] Run `RUN_PHP_INTEGRATION=1 npm test` with PHP 8.2 and require all tests to pass.
- [ ] Delete only `.next` and `out`, run a clean production build, write the manifest, and run local asset verification.
- [ ] Verify no stale headline/cache strings, run `git diff --check`, and review the scoped diff.
- [ ] Commit all source, workflow, tests, and documentation with version `1.2.12`.
- [ ] Push `master` and wait for the workflow with `--exit-status`.
- [ ] Fetch production HTML and `deployment.json` with cache-busting parameters; verify heading version and JS/CSS headers.
- [ ] Confirm report JSON count and mtimes are unchanged and report the production URL.
