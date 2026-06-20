# SonarQube Cloud Setup — Manual Steps

VacancyPilot uses SonarQube Cloud (sonarcloud.io) in **advisory mode**.
The scan runs on every PR and push to `main` but does **not** block merges.
This document describes how to set it up and when to transition to blocking mode.

Current canonical GitHub repository: `VacancyPilot/VacancyPilot`

## 1. Create a SonarQube Cloud Project

1. Go to [https://sonarcloud.io](https://sonarcloud.io) and sign in with GitHub.
2. Click **"+"** → **Analyze new project**.
3. Select organization: **`iurii-izman`**.
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

## 2a. Automatic Analysis conflict

If the GitHub Actions workflow fails with:

```text
You are running CI analysis while Automatic Analysis is enabled.
```

then SonarQube Cloud is already analyzing the repository through the GitHub App.

Choose one mode and keep only one:

1. **Recommended now**: keep Automatic Analysis enabled and treat the GitHub Actions `sonarqube` workflow as advisory only.
2. Or disable Automatic Analysis in SonarQube Cloud project settings and keep only the GitHub Actions scan.

Do not make the GitHub Actions Sonar workflow a required branch check while this conflict exists.

## 3. Project Configuration

The project is configured via `sonar-project.properties` at the repository root:

| Property | Value | Why |
|---|---|---|
| `sonar.projectKey` | `iurii-izman_VacancyPilot` | Unique project ID on SonarCloud |
| `sonar.organization` | `iurii-izman` | GitHub organization |
| `sonar.sources` | `entrypoints,src` | Source directories |
| `sonar.tests` | `src,entrypoints` | Test directories |
| `sonar.qualitygate.wait` | *(commented out)* | Advisory mode — no blocking |

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

## 6. Coverage (TODO)

Coverage is not yet configured. To add it:

```bash
pnpm add -D @vitest/coverage-v8
```

Then update `vitest.config.ts`:

```ts
test: {
  include: ["**/*.test.ts", "**/*.test.tsx"],
  coverage: {
    provider: "v8",
    reporter: ["lcov", "text"],
  },
},
```

Add a script to `package.json`:

```json
"test:coverage": "vitest run --coverage"
```

Then uncomment in `sonar-project.properties`:

```properties
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

And in `.github/workflows/sonarqube-cloud.yml`, replace the `pnpm test` step
with the `pnpm test:coverage` TODO step.

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
