# Repository Instructions

## Report Version

- `package.json` is the only source of truth for the customer-facing report version.
- Every commit intended to become the production `master` or `main` HEAD must use a version not previously published by another commit.
- Bump the version with `npm version patch --no-git-tag-version` unless the requested release specifies an exact minor or major version.
- Never hardcode the report version in application components, translations, scripts, or Markdown examples that claim to be current. Import or read it from `package.json`.
- Update version-sensitive tests in the same commit.

## Required Verification

- Run the complete test suite with PHP 8.2: `RUN_PHP_INTEGRATION=1 npm test`.
- Delete only generated `.next` and `out` directories before the final production build.
- Build with `NEXT_PUBLIC_BASE_PATH=/assessments/ai-readiness npm run build`.
- Generate `out/deployment.json` with the exact commit SHA and run `npm run release:verify-local`.
- Push only after tests, build, manifest generation, and local asset verification pass.
- Wait for the deployment workflow to finish successfully and run the production verification command from `docs/RELEASE.md`.

## Cache Contract

- HTML and `deployment.json` must return `Cache-Control: no-cache, no-store, must-revalidate`.
- Content-hashed JS and CSS under `_next/static` must return `Cache-Control: public, max-age=31536000, immutable`.
- Production verification must fetch HTML and assets with cache-busting query parameters and confirm every referenced JS/CSS asset returns HTTP 200.

## Saved Reports

- Never delete, move, synchronize, overwrite, print, or include respondent JSON in test or deployment logs.
- The persistent directory `/opt/snowfox-wordpress/data/ai-readiness-reports` is outside the atomic web deployment path.
- Deployment checks may inspect only directory writability, aggregate file count, filenames, hashes, permissions, and mtimes unless the user explicitly requests report content.
