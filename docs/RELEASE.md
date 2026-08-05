# Production Release Checklist

## Version

1. Choose the release version and update the single source of truth:

   ```bash
   npm version patch --no-git-tag-version
   ```

2. Confirm `package.json` and `package-lock.json` contain the same semantic version.
3. Confirm the report heading test expects the selected release version.

The push-triggered workflow compares the candidate version with `/deployment.json` in production. A new commit cannot reuse the currently published version. `workflow_dispatch` may redeploy the same commit and version for recovery.

## Local Verification

Run PHP integration tests with PHP 8.2, then create a clean static export:

```bash
RUN_PHP_INTEGRATION=1 npm test
find .next out -depth -delete
NEXT_PUBLIC_BASE_PATH=/assessments/ai-readiness npm run build
npm run release:manifest -- "$(git rev-parse HEAD)" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
npm run release:verify-local
```

The local verifier must find every JS/CSS URL referenced by generated HTML and confirm the corresponding hashed file exists under `out/_next/static`.

## Deploy

Push the verified production HEAD and wait for the exact workflow run:

```bash
git push origin master
gh run list --workflow deploy-ai-readiness.yml --limit 3
gh run watch <run-id> --exit-status
```

The workflow must pass all of these stages:

- report-version gate;
- PHP 8.2 tests;
- static production build;
- deployment manifest generation;
- local JS/CSS reference verification;
- PHP endpoint syntax validation;
- persistent report mount writability check;
- atomic publication;
- production identity and cache verification.

## Production Verification

Run the same verifier independently after deployment:

```bash
node scripts/deploymentManifest.mjs verify-production \
  https://snowfox-ai.com/assessments/ai-readiness/ \
  "$(git rev-parse HEAD)"
```

It verifies:

- production HTML returns HTTP 200;
- `deployment.json` contains the exact package version and commit SHA;
- the published JavaScript contains the report heading and version;
- all JS/CSS referenced by production HTML return HTTP 200;
- HTML and manifest cannot remain stale in cache;
- hashed JS/CSS are cached as immutable assets.

Finally, compare the aggregate report count and mtimes before and after deployment. Do not print names, emails, answers, or complete report JSON during routine release verification.
