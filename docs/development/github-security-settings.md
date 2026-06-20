# GitHub Security Settings — Manual Steps

These steps must be performed in the GitHub repository UI after the initial
push of CI/Dependabot configuration. They cannot be automated via files alone.

## 1. Dependabot

- **Settings → Code security → Dependabot alerts** → Enable
- **Settings → Code security → Dependabot security updates** → Enable
  - This auto-opens PRs for known vulnerabilities after Dependabot alerts fire.
  - The `.github/dependabot.yml` handles version updates; security updates
    are a separate toggle in the UI.

## 2. Secret Scanning

- **Settings → Code security → Secret scanning** → Enable (if available on plan)
- **Settings → Code security → Push protection** → Enable
  - Blocks pushes that contain detected secrets before they reach the remote.
  - Available on public repos (free) and private repos with GitHub Advanced Security.

## 3. CodeQL (Default Setup)

- **Settings → Code security → Code scanning** → Add default setup
  - Language: JavaScript / TypeScript
  - This uses GitHub's default CodeQL configuration — no custom workflow needed.
  - CodeQL default setup runs according to GitHub's default setup configuration,
    typically on pull requests and pushes to the default branch. Exact behavior can
    depend on repository settings and GitHub plan availability.
  - Note: CodeQL needs `.github/workflows/codeql.yml` only for advanced config.
    Default setup works without a workflow file.

## 4. Branch Protection — `main`

- **Settings → Branches → Add rule** (target: `main`)
  - ✅ **Restrict deletions**
  - ✅ **Block force pushes**
  - ✅ **Require a pull request before merging**
    - Dismiss stale reviews when new commits are pushed: enabled
  - ✅ **Require status checks to pass before merging**
    - Search for `ci` and add it (must run at least once in a PR first)
    - Search for `dependency-review` and add it (ditto)
    - ✅ Require branches to be up to date before merging
  - ❌ Do NOT require approvals for now (single-developer project)
  - ❌ Do NOT restrict pushes to specific people/teams (no CODEOWNERS review yet)

> **After the first green CI run on a PR**, come back and add `ci` and
> `dependency-review` as required status checks. Until then, leave the
> checks list empty or temporarily skip status-check enforcement.

## 5. Ruleset (Alternative to Branch Protection)

If your plan supports rulesets (newer GitHub feature):

- **Settings → Rulesets → New ruleset**
  - Target: `main`
  - Enforcement: Active
  - Rules:
    - Restrict deletions
    - Block force pushes
    - Require a pull request before merging
    - Require status checks to pass: `ci`
    - Add `dependency-review` only after the repository-side support issue is resolved
    - Do not require the GitHub Actions `sonarqube` workflow while Sonar remains advisory
  - This is the modern replacement for branch protection rules.

## 6. pre-commit.ci

The repository may show a `pre-commit.ci - push` status if the GitHub App is enabled.
This repo includes a minimal `.pre-commit-config.yaml` only for safe file hygiene checks:
trailing whitespace, end-of-file fixer, YAML/JSON validation and merge-conflict detection.

If pre-commit.ci is not needed, it can be disabled in the GitHub App settings for this repository.
If it shows `private repos require a paid plan` after the repository transfer to `VacancyPilot/VacancyPilot`,
either reconnect the app to the new public repository or disable it entirely.

## 7. Verification

After all settings are applied:

- [ ] Push a test commit to a branch, open a PR — CI runs
- [ ] Dependabot opened at least one version-update PR (may take until Monday 09:00 Europe/Chisinau)
- [ ] Secret scanning is listed as enabled on the Security tab
- [ ] CodeQL default setup shows "Configured" status
- [ ] Force push to main is rejected
