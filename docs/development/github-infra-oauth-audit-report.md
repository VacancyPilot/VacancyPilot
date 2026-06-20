# GitHub Infrastructure OAuth Audit Report

## Summary

Short verdict:
- Merge-ready: no
- Blocking checks: `pre-commit.ci - pr` on PR #8
- Advisory checks: `dependency-review`, GitHub Actions `sonarqube`
- Manual settings still needed:
  - reconnect or disable `pre-commit.ci`
  - decide SonarQube mode: Automatic Analysis vs GitHub Actions scan
  - enable CodeQL default setup
  - enable secret scanning / push protection if available
  - finish GitHub security UI review for Dependency Review support

## Repository identity

- Canonical repo: `VacancyPilot/VacancyPilot`
- Visibility: `public`
- Default branch: `main`
- Current remote: `git@github.com:iurii-izman/VacancyPilot.git`
- Transfer/rename status: repository has been transferred; GitHub push output redirects to `git@github.com:VacancyPilot/VacancyPilot.git`
- Current PR: `#8` `chore: finalize GitHub infrastructure hardening`

## PR and checks status

PR facts for `#8`:

- State: `OPEN`
- Draft: `false`
- Mergeable: `UNKNOWN` at API read time
- Base: `main`
- Head: `chore/github-infra-final-hardening`
- Head SHA: `013fa3b7cd0c90e8f8627f0b73bc88534cebb2b5`
- Changed files: `7`
- Additions / deletions: `111 / 10`

| Check | Status | Conclusion | Blocking? | Root cause | Action |
|---|---|---|---|---|---|
| `ci` | completed | success | no | Full validation passed | none |
| `dependency-review` | completed | failure | no | GitHub reported `Dependency review is not supported on this repository. Please ensure that Dependency graph is enabled along with GitHub Advanced Security.` | keep workflow advisory; verify repo-side support in GitHub UI |
| `sonarqube` | completed | failure | no | GitHub Actions Sonar scan conflicts with Sonar Automatic Analysis: `You are running CI analysis while Automatic Analysis is enabled.` | keep workflow advisory; choose one Sonar mode in UI |
| `SonarCloud Code Analysis` | completed | success | no | SonarQube Cloud GitHub App analysis succeeded; PR quality gate passed | keep as informational unless team later standardizes on it |
| `pre-commit.ci - pr` | completed | failure | yes for clean merge | external app reports `private repos require a paid plan` | reconnect app after repo transfer or disable app |

## CI audit

Workflow: `.github/workflows/ci.yml`

Verdict: `PASS`

Checks:

- permissions: `contents: read` only
- no secrets required
- no deployment / publish / artifact upload
- no write permissions
- allowed actions are limited to intended ecosystem:
  - `actions/checkout@v4`
  - `actions/setup-node@v4`
- `timeout-minutes: 15` present
- `concurrency` present
- triggers: `pull_request`, `push` to `main`, `workflow_dispatch`

Executed stages:

- checkout
- corepack
- setup node
- install dependencies
- typecheck
- lint
- tests
- build
- release safety tests

Notes:

- annotation only: GitHub warns that Node 20 is deprecated inside some actions metadata, but the workflow itself sets `node-version: 22`

## Dependency Review audit

Workflow: `.github/workflows/dependency-review.yml`

Current failure root cause from logs:

```text
Dependency review is not supported on this repository. Please ensure that Dependency graph is enabled along with GitHub Advanced Security.
```

Classification:

- Case B — GitHub feature / setup limitation

Observed repo-side facts:

- Dependabot alerts exist and are enabled
- public repo
- dependency review action still fails on PR #8

Interpretation:

- repository-side support for Dependency Review is incomplete or misconfigured
- this is not a workflow syntax problem and not a lockfile parsing problem

Action taken:

- workflow step is now `continue-on-error: true`

Recommendation:

- keep Dependency Review advisory until GitHub UI support is confirmed working
- once GitHub-side support is verified, remove advisory mode and re-evaluate whether to require it on `main`

## SonarQube Cloud audit

### SonarQube Cloud status

| Item | Status | Notes |
|---|---|---|
| Project key | pass | `iurii-izman_VacancyPilot` |
| Organization key | pass | `iurii-izman` |
| GitHub App analysis | pass | `SonarCloud Code Analysis` check succeeded on PR #8 |
| Workflow secret presence | pass | `SONAR_TOKEN` exists as repository secret |
| GitHub Actions scan | advisory failure | fails because Automatic Analysis is also enabled |
| Quality gate | pass | SonarQube Cloud PR check says `Quality Gate passed` |
| PR decoration | pass | PR decoration exists through SonarQube Cloud app check |
| Main branch configured | inferred pass | Sonar auto-configured branch `main` in logs |
| Coverage | advisory gap | `0.0% Coverage on New Code`; coverage not configured yet |

Root cause from logs:

```text
You are running CI analysis while Automatic Analysis is enabled.
```

Interpretation:

- this is not a token absence problem
- this is not a `sonar-project.properties` key mismatch
- this is a configuration conflict between two Sonar modes

Action taken:

- GitHub Actions Sonar step is now `continue-on-error: true`
- docs updated with exact manual decision point

Recommendation:

- keep Sonar advisory for now
- do not require the GitHub Actions `sonarqube` check
- choose either:
  - keep Automatic Analysis + GitHub App only
  - or disable Automatic Analysis and keep GitHub Actions scan

## Dependabot audit

File: `.github/dependabot.yml`

Verdict: `PASS with follow-up needed`

Configuration facts:

- ecosystems:
  - `npm`
  - `github-actions`
- weekly schedule: Monday 09:00 `Europe/Chisinau`
- open PR limits:
  - npm: `5`
  - actions: `3`
- labels configured
- commit prefixes:
  - npm: `deps`
  - actions: `ci`
- groups:
  - `production-minor-patch`
  - `development-minor-patch`
  - `actions-minor-patch`
- no auto-merge

Open Dependabot PRs observed:

| PR | Title | Status summary | Safe to merge now? | Notes |
|---|---|---|---|---|
| `#7` | `deps: bump react, react-dom and @types/react` | open | no | needs normal validation |
| `#6` | `deps: bump typescript from 5.9.3 to 6.0.3` | open | no | likely high breakage risk |
| `#5` | `deps: bump vitest from 2.1.9 to 4.1.9` | open | no | major testing change |
| `#4` | `deps: bump the development-minor-patch group with 3 updates` | open | maybe later | grouped minor/patch |
| `#3` | `ci: bump actions/checkout from 4 to 7` | open | maybe later | verify workflow compatibility |
| `#2` | `ci: bump actions/setup-node from 4 to 6` | open | maybe later | verify workflow compatibility |
| `#1` | `ci: bump SonarSource/sonarqube-scan-action from 7 to 8` | open | maybe later | relevant after Sonar mode decision |

Dependabot alerts observed:

- multiple open alerts exist, including:
  - `vitest` critical advisory on current line
  - several `tar` high / medium transitives
  - `vite` medium
  - `esbuild` medium

These are real follow-up items but are outside the narrow infra PR scope unless dependency review stabilization explicitly requires them.

## GitHub Security Settings audit

| Setting | Actual status | Desired status | Action |
|---|---|---|---|
| Repository visibility | public | public | none |
| Default branch | `main` | `main` | none |
| Allow squash merge | enabled | enabled | none |
| Allow merge commit | enabled | acceptable | optional tighten later |
| Allow rebase merge | enabled | acceptable | optional tighten later |
| Auto-merge | disabled | disabled for now | none |
| Delete branch on merge | disabled | preferably enabled | optional UI change |
| Issues | enabled | acceptable | none |
| Projects | enabled | acceptable | none |
| Wiki | disabled | disabled | none |
| Discussions | disabled | disabled | none |
| Actions enabled | yes | yes | none |
| Allowed actions policy | `all` | preferably selected allowlist | tighten later in UI |
| Workflow permissions default | `read` | `read` | none |
| Workflows can approve PRs | false | false | none |
| Dependabot alerts | enabled | enabled | none |
| Dependabot security updates | enabled | enabled | none |
| Secret scanning | disabled | enabled if available | manual UI step |
| Push protection | disabled | enabled if available | manual UI step |
| CodeQL default setup | not configured | configured | manual UI step |
| Code scanning alerts | no analysis found | at least CodeQL default setup present | manual UI step |
| Repository secrets | `SONAR_TOKEN` only | `SONAR_TOKEN` only unless justified | none |
| Repository variables | none | none or non-sensitive only | none |

## Branch / Ruleset audit

Current state:

- classic branch protection on `main`: not configured
- active repository ruleset exists:
  - target: branch
  - enforcement: active
  - rules:
    - deletion blocked
    - non-fast-forward blocked

Assessment:

- good early-stage baseline
- does not yet require PRs or status checks
- avoids solo-developer deadlock

Recommendation for current stage:

- keep existing ruleset
- later add:
  - require PR before merging
  - require `ci`
- do not require:
  - `dependency-review` until repo-side support works
  - GitHub Actions `sonarqube` while advisory

## Release Safety audit

Observed files:

- `src/release-safety/generated-manifest-safety.test.ts`
- `src/release-safety/content-script-safety.test.ts`
- `src/release-safety/storage-api-safety.test.ts`
- `vitest.release.config.ts`
- `package.json` `test:release`

Confirmed:

- release mode hard-fails if generated manifest is missing
- generated content-script bundle checks hard-fail in release audit mode
- `chrome.storage.local.onChanged` is forbidden by static safety test
- manifest permissions are restricted
- broad host permissions are forbidden
- content-script match patterns are restricted to HH vacancy / search pages
- no HH fetch / XHR
- no auto-click / value writes

## Local validation

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | pass | local branch clean |
| `pnpm lint` | pass | no lint issues |
| `pnpm test` | pass | branch passed locally |
| `pnpm build` | pass | build succeeded |
| `pnpm test:release` | pass | release-safety suite succeeded |

## Changed files

Files changed during this audit:

- `.github/workflows/dependency-review.yml`
  - switched Dependency Review to advisory mode with `continue-on-error: true`
- `.github/workflows/sonarqube-cloud.yml`
  - switched SonarQube scan step to advisory mode with `continue-on-error: true`
- `SECURITY.md`
  - updated vulnerability-report URL to canonical repo
- `docs/development/github-security-settings.md`
  - updated ruleset guidance and pre-commit.ci transfer note
- `docs/development/sonarqube-cloud-setup.md`
  - updated canonical repo path and documented Automatic Analysis conflict

## Remaining manual steps

Only actions that cannot be automated via repo files:

1. Decide Sonar mode in SonarQube Cloud UI:
   - keep Automatic Analysis and ignore GitHub Actions Sonar as advisory
   - or disable Automatic Analysis and rely on the workflow scan
2. Resolve `pre-commit.ci`:
   - reconnect app to the transferred public repository
   - or disable the app for this repository
3. Enable CodeQL default setup in GitHub UI
4. Enable Secret scanning / Push protection if available
5. Investigate why repository-side Dependency Review support is unavailable and, once fixed, remove advisory mode if desired
6. Update local git remote to canonical URL for developer convenience:
   - `git remote set-url origin git@github.com:VacancyPilot/VacancyPilot.git`

## Recommendation

Ready to merge after manual GitHub settings
