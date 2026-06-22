# Audit 2026-06-22 — Closure Report

Source: external full extension audit received on `2026-06-22`
Decision report: `docs/development/audit-2026-06-22-decision-report.md`
Epic: `EPIC-37 — Audit Closure And Trust Surface Alignment`

## Purpose

This report is the final closure artifact for the 2026-06-22 audit. It records what was implemented, what was intentionally reused from existing planned iterations, what was deferred as external/manual, and what remains as backlog. Reading this report should be sufficient to understand the audit disposition without returning to chat history.

---

## 1. Implemented — Closed

### 1.1 Sonar Coverage Baseline (ITER-076)

| Attribute | Value |
|---|---|
| Finding | Sonar is advisory and has no coverage input |
| Status | ✅ **closed** |
| Commit | `ci: add sonar coverage baseline` |

**Changes:**
- Added `@vitest/coverage-v8` and `pnpm test:coverage` script
- Wired `coverage/lcov.info` into `sonar-project.properties` (`sonar.javascript.lcov.reportPaths`)
- Updated `.github/workflows/sonarqube-cloud.yml` to run `pnpm test:coverage` instead of `pnpm test`
- Updated `docs/development/sonarqube-cloud-setup.md` §6 from TODO to configured
- SonarCloud identity confirmed: `sonar.projectKey=VacancyPilot_VacancyPilot`, `sonar.organization=VacancyPilot`
- Sonar remains **advisory mode** — no blocking quality gate

### 1.2 HR Timeline Trust Surface (ITER-077)

| Attribute | Value |
|---|---|
| Finding | HR timeline stores HTML snippets (innerHTML) |
| Status | ✅ **closed** |
| Commit | `fix: harden hr timeline trust surface` |

**Changes:**
- Removed `html` field from `RawHrTimelineDTO` and `rawHtml` from `HrTimelineEntry`
- Adapter (`hh-adapter.ts`) no longer captures `innerHTML` — only `textContent`
- Normalizer (`hr-timeline-sync.ts`) no longer maps HTML to stored entries
- All 6 HR fixture `expected.json` files cleaned of redundant `html` fields
- Export and IndexedDB storage now carry plain text only — no HH markup

### 1.3 Audit Closure Report (ITER-078)

| Attribute | Value |
|---|---|
| Finding | Audit closure artifact was missing |
| Status | ✅ **closed** |
| Commit | `docs: finalize 2026-06-22 audit closure` |

This document is the implementation artifact.

---

## 2. Reused Existing Work — No Duplication

These audit findings map to runtime/UI iterations already planned under `EPIC-35` (Runtime Stabilization) and `EPIC-36` (Runtime Visual Consistency). They were **not** re-implemented here.

| Audit Finding | Existing Target | Epic |
|---|---|---|
| Popup side panel may lose user gesture | `ITER-069` | EPIC-35 |
| Badge side panel open may depend on background gesture | `ITER-069`, `ITER-072` | EPIC-35, EPIC-36 |
| Popup may open as a tiny strip | `ITER-072` | EPIC-36 |
| About and Onboarding still overlap | `ITER-073` | EPIC-36 |
| Dashboard/options responsive cleanup needed | `ITER-074`, `ITER-075` | EPIC-36 |
| Final runtime visual consistency report missing | `ITER-075` | EPIC-36 |

---

## 3. Deferred — External / Manual

### 3.1 SonarCloud Org/Project Identity

| Attribute | Value |
|---|---|
| Original status | `iurii-izman` — outdated |
| Current status | **resolved** — confirmed as `VacancyPilot_VacancyPilot` / `VacancyPilot` |
| Manual step | Done — values updated in `sonar-project.properties` and `sonarqube-cloud-setup.md` |

### 3.2 `SONAR_TOKEN` Repository Secret

| Attribute | Value |
|---|---|
| Status | **manual** — never stored in repo |
| Manual step | The `SONAR_TOKEN` must exist in GitHub repository secrets (`Settings → Secrets and variables → Actions → SONAR_TOKEN`). The workflow gracefully skips the scan if the token is absent. |

### 3.3 Dependency Review Strict Mode

| Attribute | Value |
|---|---|
| Status | **deferred** |
| Reason | Changing advisory → blocking is a repo-policy decision. Should be enabled deliberately after the baseline is proven stable, not during audit closure. |
| Prerequisites | Green CI for 2+ weeks; zero critical dependency alerts; team comfortable with review workflow. |

### 3.4 n8n Permission Model

| Attribute | Value |
|---|---|
| Status | **deferred by product boundary** |
| Reason | Already deferred in spec §26.5 and iteration map (`ITER-043`). Not a closure item for this audit pass. |

---

## 4. Accepted Without Follow-Up

| Audit Finding | Reason |
|---|---|
| API keys are local plaintext by design | Already handled in AI/trust work. Disclosure and testing preserved in existing AI settings lifecycle. No dedicated follow-up needed now. |

---

## 5. Backlog — Not In Current Closure Scope

These are legitimate ideas from the audit that remain in the project backlog but are **not** part of this closure pass. They will be triaged during the next planning cycle:

- Public store submission readiness
- Multi-site expansion
- Backend sync (if ever needed)

---

## 6. Final Disposition Summary

| Category | Count | Items |
|---|---|---|
| **Implemented (EPIC-37)** | 3 | ITER-076, ITER-077, ITER-078 |
| **Reused (EPIC-35/36)** | 6 | ITER-069..ITER-075 |
| **Deferred external** | 2 | SONAR_TOKEN (manual), Dependency Review (policy) |
| **Deferred product** | 1 | n8n permission model |
| **Accepted** | 1 | API key plaintext |
| **Backlog** | 3 | Public release, multi-site, sync |

---

## 7. Post-Closure Checklist

- [x] Sonar coverage runs in CI (`pnpm test:coverage` → `coverage/lcov.info`)
- [x] Sonar project identity confirmed (`VacancyPilot_VacancyPilot` / `VacancyPilot`)
- [x] HR timeline stores plain text only — no `innerHTML`
- [x] Runtime/UI findings mapped to existing iterations — no duplicate work
- [x] Manual `SONAR_TOKEN` handoff documented
- [x] Closure report committed
- [x] Iteration map updated (ITER-076/077/078 → `done`)
- [ ] `SONAR_TOKEN` added to GitHub repository secrets (manual, outside repo)
- [ ] Dependency Review strict mode decision (deferred, future decision)

---

*Report generated on 2026-06-22. EPIC-37 is complete. The 2026-06-22 audit is closed.*
