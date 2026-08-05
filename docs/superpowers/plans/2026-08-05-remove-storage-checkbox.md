# Remove Storage Checkbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the report-storage checkbox while preserving the existing snapshot and PHP persistence contract.

**Architecture:** The identity form will collect and validate only name and email. `normalizeParticipant()` will continue adding `storageAcknowledged: true` as a legacy compatibility field, so drafts, snapshots, and the PHP endpoint remain unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, PHP 8.2, static export deployed through GitHub Actions.

## Global Constraints

- Keep name and email required.
- Do not modify the PHP payload schema or existing JSON reports.
- Do not remove or overwrite production report files.
- Preserve retry, immutable snapshot, and draft-resume behavior.
- Deploy only after tests and the production build pass.

---

### Task 1: Remove The Checkbox While Preserving Submission Compatibility

**Files:**
- Create: `components/results/ReportIdentityGate.test.tsx`
- Modify: `components/results/ReportIdentityGate.tsx`
- Modify: `app/reportSubmission.ts`
- Modify: `app/reportSubmission.test.ts`
- Modify: `app/i18n.ts`
- Modify: `app/globals.css`
- Verify unchanged: `public/api/reports.php`
- Verify unchanged: `server/reportsEndpoint.test.ts`

**Interfaces:**
- Consumes: `normalizeParticipant(input: ParticipantInput): ParticipantIdentity`
- Produces: `ParticipantInput` containing only `name` and `email`; normalization still produces `ParticipantIdentity` with `storageAcknowledged: true`.

- [ ] **Step 1: Write failing validation and UI tests**

Update the participant tests so valid input has no acknowledgement property:

```ts
expect(validateParticipant({ name: "Gabi Silva", email: "gabi@example.com" })).toEqual({});
expect(normalizeParticipant({ name: "  Gabi Silva  ", email: "  GABI@EXAMPLE.COM " })).toEqual({
  name: "Gabi Silva",
  email: "gabi@example.com",
  storageAcknowledged: true,
});
```

Create a server-rendered component test:

```tsx
const markup = renderToStaticMarkup(
  <LanguageProvider>
    <ReportIdentityGate
      pendingReport={null}
      submitState="idle"
      errorMessage={null}
      onSubmit={() => undefined}
      onRetry={() => undefined}
    />
  </LanguageProvider>
);
expect(markup).not.toContain('type="checkbox"');
expect(markup).not.toContain("Concordo que a Snowfox armazene");
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- app/reportSubmission.test.ts components/results/ReportIdentityGate.test.tsx`

Expected: FAIL because `ParticipantInput` still requires `storageAcknowledged` and the component still renders the checkbox.

- [ ] **Step 3: Implement the minimal compatibility change**

Change the client input contract and normalization:

```ts
export interface ParticipantInput {
  name: string;
  email: string;
}

export function normalizeParticipant(input: ParticipantInput): ParticipantIdentity {
  // existing validation and name/email normalization
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    storageAcknowledged: true,
  };
}
```

In `ReportIdentityGate`, remove the checkbox state, JSX, checkbox error handling, and acknowledgement value passed into validation. Remove `identityAcknowledgement` from both languages and delete the unused checkbox CSS. Change the form-label selector to target the two remaining labels directly.

- [ ] **Step 4: Run focused tests and verify success**

Run: `npm test -- app/reportSubmission.test.ts components/results/ReportIdentityGate.test.tsx`

Expected: both test files pass and the rendered form has no checkbox.

- [ ] **Step 5: Verify PHP compatibility and the complete application**

Run: `RUN_PHP_INTEGRATION=1 npm test`

Expected: all TypeScript and PHP integration tests pass, including the server-side requirement for `storageAcknowledged: true`.

Run: `npm run build`

Expected: static production export completes successfully.

- [ ] **Step 6: Commit the implementation**

```bash
git add app/reportSubmission.ts app/reportSubmission.test.ts app/i18n.ts app/globals.css components/results/ReportIdentityGate.tsx components/results/ReportIdentityGate.test.tsx
git commit -m "fix: remove report storage checkbox"
```

### Task 2: Deploy And Verify Without Touching Stored Reports

**Files:**
- Verify unchanged: `.github/workflows/deploy-ai-readiness.yml`
- Verify remotely: `/opt/snowfox-wordpress/data/ai-readiness-reports`

**Interfaces:**
- Consumes: the committed static export and existing GitHub Actions deployment workflow.
- Produces: production identity form without a checkbox while retaining the same PHP JSON payload contract.

- [ ] **Step 1: Record the pre-deploy report count**

Use the existing read-only SSH/PHP count command against `/opt/snowfox-wordpress/data/ai-readiness-reports`.

Expected: `2` JSON files before deployment.

- [ ] **Step 2: Push the verified commit to `master`**

Run: `git push origin master`

Expected: push succeeds and triggers the existing guarded deployment workflow.

- [ ] **Step 3: Wait for the deployment workflow**

Run: `gh run watch --exit-status`

Expected: build, PHP integration, mount-write guard, and atomic publish steps pass.

- [ ] **Step 4: Verify production output and storage preservation**

Confirm `https://snowfox-ai.com/assessments/ai-readiness/` returns HTTP 200, its published JavaScript does not contain the acknowledgement copy, and the remote report directory still contains at least the same two JSON files.

- [ ] **Step 5: Report the deployment result**

State the production URL, test/build result, report count before and after, and explicitly confirm that no existing JSON report was modified or deleted.
