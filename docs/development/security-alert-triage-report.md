# Security Alert Triage Report

## Summary

- **Critical alerts before**: 2 (shell-quote, vitest)
- **Critical alerts after**: 0
- **High alerts**: 9 (tar, esbuild — all transitive via WXT, out of scope for this PR)
- **Branch**: `security/critical-dependency-alerts`
- **Merge-ready**: ✅ yes (pending CI and GitHub Security refresh)

## Alert inventory

| Severity | Package | Version before | Patched version | Path | Action |
|---|---|---|---|---|---|
| critical | shell-quote | 1.7.3 | >=1.8.4 | wxt→web-ext-run→fx-runner | pnpm overrides → 1.8.4 |
| critical | vitest | 2.1.8 | >=3.2.6 | direct | bump to ^3.2.6 |
| high | tar | 6.2.1 | >=7.5.11 | wxt→c12/giget→tar | deferred |
| moderate | esbuild | 0.21.5 | >=0.24.3 | wxt, vitest | partially resolved by vitest upgrade |

## Critical remediation

### shell-quote (GHSA-w7jw-789q-3m8p)

- **Vulnerability**: `quote()` does not escape newlines in object `.op` values
- **Vulnerable range**: >=1.1.0 <=1.8.3
- **Patched version**: >=1.8.4
- **Dependency chain**: `wxt@0.19.27 → web-ext-run@0.2.4 → fx-runner@1.4.0 → shell-quote@1.7.3`
- **Fix**: Added `overrides.shell-quote: 1.8.4` to `pnpm-workspace.yaml`
- **Reason for override approach**: `shell-quote` is pinned by `fx-runner@1.4.0` and WXT 0.20.x still uses `web-ext-run@^0.2.4`, so updating WXT does not resolve this. `pnpm.overrides` in `package.json` is deprecated in pnpm v10+; settings moved to `pnpm-workspace.yaml`.

### vitest (GHSA-5xrq-8626-4rwp)

- **Vulnerability**: When Vitest UI server is listening, arbitrary file can be read and executed
- **Vulnerable range**: <3.2.6
- **Patched version**: >=3.2.6
- **Fix**: Bumped `vitest` from `^2.1.8` to `^3.2.6` (V3 dist-tag, minimal patched version)
- **Why not latest (4.1.9)**: Minimal patched version (3.2.6) is preferred to reduce breaking change risk
- **Breaking changes assessed**: Vitest config (defineConfig, resolve.alias, test.include) fully compatible; release-safety config (env flag + re-export) fully compatible

## Dependency changes

| Package | From | To | Why |
|---|---|---|---|
| vitest (devDep) | ^2.1.8 | ^3.2.6 | GHSA-5xrq-8626-4rwp — critical RCE via UI server |
| shell-quote (override) | 1.7.3 | 1.8.4 | GHSA-w7jw-789q-3m8p — quote() newline escaping |
| @vitest/* sub-packages | 2.1.8 | 3.2.6 | vitest major upgrade sub-dependencies |
| vite-node | 2.1.8 | 3.2.4 | vitest sub-dependency |
| tinyrainbow | 1.2.0 | 2.0.0 | vitest sub-dependency |
| pathe | 1.1.2 | 2.0.3 | vitest sub-dependency |

## Validation

| Command | Result | Notes |
|---|---|---|
| pnpm typecheck | ✅ pass | tsc --noEmit |
| pnpm lint | ✅ pass | eslint |
| pnpm test | ✅ pass | 1017/1017 tests, 33 files |
| pnpm build | ✅ pass | WXT chrome-mv3, 525 KB |
| pnpm test:release | ✅ pass | 311/311 release-safety tests |
| pnpm audit (critical) | ✅ 0 critical | shell-quote + vitest resolved |

## Remaining alerts

All remaining alerts are transitive through WXT (tar, esbuild) and require WXT upstream updates or additional overrides. These are deferred to a follow-up high-alert triage PR.

| Severity | Count | Package(s) |
|---|---|---|
| high | 9 | tar (6), esbuild (3) |
| moderate | 12 | esbuild |
| low | 3 | esbuild |

## Dependabot PR recommendations

| PR | Dependency | Action |
|---|---|---|
| #1 | SonarSource/sonarqube-scan-action 7→8 | Hold |
| #2 | actions/setup-node 4→6 | Test separately |
| #3 | actions/checkout 4→7 | Test separately |
| #4 | development-minor-patch group | Review after criticals |
| #5 | vitest 2→4 | Superseded by this manual PR (3.2.6 chosen) |
| #6 | typescript 5.9→6.0 | Hold |
| #7 | react/react-dom/@types | Hold |

## Next steps

1. Open PR from `security/critical-dependency-alerts` to `main`
2. Wait for CI (typecheck, lint, test, build, release-safety)
3. Wait for GitHub Security alert refresh to confirm remediation
4. After merge: proceed with high alert triage (tar, esbuild overrides)
5. After high alerts: review low-risk Dependabot PRs

## 2026-06-21 follow-up: final moderate alert disposition

- GitHub Dependabot alert `#10` (`uuid`, moderate) was reviewed after the larger toolchain/security waves.
- Path: `wxt -> web-ext-run -> node-notifier -> uuid@8.3.2`
- Scope: `development`, `transitive`, not part of the shipped VacancyPilot runtime bundle.
- Result: dismissed on GitHub as `tolerable_risk`.

Reason:

- the affected `uuid` buffer-write API is not called by VacancyPilot runtime code;
- the package is reachable only through dev-time extension tooling;
- a narrow local override did not apply cleanly without pulling broad toolchain churn into the repository;
- the remaining risk is bounded upstream tooling risk rather than a product/runtime exposure.
