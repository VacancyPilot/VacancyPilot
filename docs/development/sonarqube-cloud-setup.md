# SonarQube Cloud Setup — Manual Steps

VacancyPilot uses SonarQube Cloud (sonarcloud.io) in **advisory mode**.
The scan runs on every PR and push to `main` but does **not** block merges.
This document describes how to set it up and when to transition to blocking mode.

## Selected analysis mode

VacancyPilot uses **GitHub Actions analysis** as the primary SonarQube Cloud mode.

Automatic Analysis should be disabled in SonarCloud to avoid conflicts with
the GitHub Actions scan configured in `.github/workflows/sonarqube-cloud.yml`.

Sonar remains advisory until:
- CI is stable for 2+ weeks;
- critical/high security alerts are triaged;
- coverage is configured (see §6);
- project baseline is stable with zero new code issues.

## 1. Create a SonarQube Cloud Project

1. Go to [https://sonarcloud.io](https://sonarcloud.io) and sign in with GitHub.
2. Click **"+"** → **Analyze new project**.
3. Select organization: **`VacancyPilot`**.
4. Select repository: **`VacancyPilot/VacancyPilot`**.
5. Choose **"With GitHub Actions"** as the analysis method.
6. Follow the wizard — it will show a `SONAR_TOKEN` value.
   - Copy the token **immediately** (you won't see it again).

## 2. Add SONAR_TOKEN to GitHub Secrets

1. Go to the repository on GitHub:
   **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `SONAR_TOKEN`
3. Value: the token from step 1.
4. Click **Add secret**.

Once the secret is added, the next PR or push to `main` will trigger the
SonarQube scan automatically.

## 3. Project Configuration

The project is configured via `sonar-project.properties` at the repository root:

| Property | Value | Why |
|---|---|---|
| `sonar.projectKey` | `VacancyPilot_VacancyPilot` | Unique project ID on SonarCloud |
| `sonar.organization` | `VacancyPilot` | SonarCloud organization key |
| `sonar.sources` | `entrypoints,src` | Source directories |
| `sonar.tests` | `src,entrypoints` | Test directories |
| `sonar.qualitygate.wait` | *(commented out)* | Advisory mode — no blocking |

Important:

- the GitHub repository is `VacancyPilot/VacancyPilot`;
- the SonarCloud organization key does **not** need to equal the GitHub org display name;
- if Sonar scans fail after org/repository changes, re-check the exact key pair in SonarCloud UI before changing them again.

## 4. Why Advisory Mode?

SonarQube quality gates are strict by default. In early development:

- Rapid refactoring produces temporary new-code issues.
- False positives on early-stage code are common.
- Blocking merges on every new issue slows velocity.

Advisory mode means:

- ✅ The scan runs and reports issues in the SonarCloud UI.
- ✅ Developers can review issues on their own schedule.
- ❌ The scan does **not** block PR merges.
- ❌ Sonar is **not** added as a required branch check.

## 5. Transition to Blocking Mode

Switch to blocking mode when **all** of these are true:

- [ ] CI (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) is green for 2+ weeks.
- [ ] SonarQube reports **zero new code issues** for at least 3 consecutive PRs.
- [ ] The team is comfortable resolving Sonar issues (no surprise failures).
- [ ] Coverage is configured (see section 6).

### How to enable blocking mode

1. Uncomment in `sonar-project.properties`:
   ```properties
   sonar.qualitygate.wait=true
   ```

2. In GitHub **Settings → Branches → Branch protection for `main`**:
   - Add `SonarQube Cloud` to required status checks.

3. Commit both changes and verify that:
   - PRs that fail the Quality Gate are correctly blocked.
   - PRs that pass continue to merge normally.

## 6. Coverage

Coverage is configured locally via Vitest V8 provider. The workflow
upload step is intentionally omitted — Sonar reads `coverage/lcov.info`
directly from the workspace during the `sonarqube-scan-action` step.

### Local usage

```bash
pnpm test:coverage
```

This generates `coverage/lcov.info` and prints a text summary.
The `coverage/` directory is git-ignored.

### What is repo-local vs. what is external

| Layer | Where | Status |
|---|---|---|
| Vitest V8 coverage + LCOV | repo | configured |
| `sonar.javascript.lcov.reportPaths` | `sonar-project.properties` | wired |
| CI step runs `pnpm test:coverage` | `.github/workflows/sonarqube-cloud.yml` | active |
| `sonar.projectKey` / `sonar.organization` | `sonar-project.properties` | configured for current transferred repo namespace; re-verify in SonarCloud UI if scans fail |
| `SONAR_TOKEN` secret | GitHub repository secrets | **manual — never stored in repo** |

Coverage wiring is now repo-local and complete. The remaining external setup
work is:

1. verify in SonarCloud UI if the transferred repository uses a different key pair in practice;
2. update `sonar-project.properties` only if those values differ;
3. keep `SONAR_TOKEN` in GitHub repository secrets, never in the repo.

## 7. Key Metrics to Watch

After the first scan, review these metrics on [sonarcloud.io](https://sonarcloud.io):

| Metric | Priority | Action |
|---|---|---|
| **New Code Issues** | Critical | Must reach zero before blocking mode. Fix as they appear. |
| **Security Hotspots** | High | Review each one — some may be false positives for a local-first extension. |
| **Reliability (Bugs)** | High | Fix any bug rated B or above. |
| **Maintainability** | Medium | Address code smells over time — don't let debt accumulate. |
| **Duplication** | Low | Monitor. Acceptable baseline for early-stage projects is < 10%. |
| **Coverage** | Later | Target > 60% before adding to quality gate. Configure after tests stabilize. |
