# GitHub Infrastructure Final Hardening Report

## Summary

Final hardening pass after repository automation audit:
- Added `.pre-commit-config.yaml` with safe hygiene hooks (no formatters).
- Pinned `packageManager` to `pnpm@11.1.1` in `package.json`.
- Named all steps in CI workflow for readable logs.
- Added `timeout-minutes: 10` to Dependency Review workflow.
- Added `concurrency` to SonarQube Cloud workflow.
- Softened CodeQL default setup wording in docs.
- Added pre-commit.ci section to GitHub security settings docs.
- Verified all release-safety tests: hard-fail in release mode, no soft-skip regressions.

## Changed files

| File | Change |
|---|---|
| `.pre-commit-config.yaml` | Created — safe hooks: trailing-whitespace, end-of-file, YAML/JSON check, merge-conflict |
| `package.json` | Added `"packageManager": "pnpm@11.1.1"` |
| `.github/workflows/ci.yml` | Named all steps (Checkout, Enable Corepack, Setup Node, etc.) |
| `.github/workflows/dependency-review.yml` | Added `timeout-minutes: 10` at job level |
| `.github/workflows/sonarqube-cloud.yml` | Added `concurrency` group |
| `docs/development/github-security-settings.md` | Softened CodeQL phrasing; added §6 pre-commit.ci |

## Validation results

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | ✅ PASS | — |
| `pnpm lint` | ✅ PASS | — |
| `pnpm test` | ✅ PASS | 1011 tests, 32 files |
| `pnpm build` | ✅ PASS | Output: 523.31 kB |
| `pnpm test:release` | ✅ PASS | 309 release safety tests, 8 files |

## pre-commit.ci

- `.pre-commit-config.yaml` added with v5.0.0 hooks.
- Hooks: trailing-whitespace, end-of-file-fixer, check-yaml, check-json, check-merge-conflict.
- Excluded: `pnpm-lock.yaml`, `.output/`, `dist/`.
- No formatters or linters added.
- **Manual step**: if `pre-commit.ci - push` status appears in PR, either enable the GitHub App or disable it in repository settings.

## Release safety

| Test | Status | Notes |
|---|---|---|
| `generated-manifest-safety.test.ts` | ✅ PASS | Hard-fail on missing `.output/` when `RELEASE_AUDIT=true` |
| `content-script-safety.test.ts` | ✅ PASS | Hard-fail on missing bundles when `RELEASE_AUDIT=true` |
| `storage-api-safety.test.ts` | ✅ PASS | Forbids `chrome.storage.local.onChanged` (102 source files checked) |

## Remaining manual GitHub UI steps

- [ ] Add `SONAR_TOKEN` to repository secrets (see `docs/development/sonarqube-cloud-setup.md`)
- [ ] Enable Dependabot alerts + security updates (Settings → Code security)
- [ ] Enable Secret scanning + Push protection (if available on plan)
- [ ] Enable CodeQL default setup (JS/TS)
- [ ] Add branch/ruleset protection for `main` after first green CI run:
  - Required checks: `ci`, `dependency-review`
  - Restrict deletions, block force pushes
- [ ] Verify Actions tab shows: CI, Dependency Review, SonarQube Cloud
- [ ] Decide whether to enable pre-commit.ci GitHub App

## Recommendation

✅ **Ready to merge.** All validation passes. No product code changed. No permissions, secrets, or deployment added. The remaining steps are manual GitHub UI configuration that cannot be automated via repository files.
