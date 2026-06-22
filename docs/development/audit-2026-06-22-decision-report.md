# Audit 2026-06-22 Decision Report

Source audit: external full extension audit received on `2026-06-22`

Purpose: convert the audit into the next disciplined work pack without duplicating the runtime/UI iterations that are already prepared.

## Decision Summary

The audit is useful, but it mixes four different classes of work:

1. runtime/UI defects already mapped to `EPIC-35` and `EPIC-36`;
2. repo-local quality/trust improvements that still need implementation;
3. external infrastructure or repository-policy decisions that cannot be safely completed from local code alone;
4. legitimate backlog ideas that should stay out of the next narrow pack.

The correct response is not a single giant new PR. The correct response is:

- keep the popup, badge, About/Onboarding, dashboard, and final visual-report work on `ITER-069`..`ITER-075`;
- create one small follow-up epic for the remaining repo-local quality/trust items;
- explicitly defer SonarCloud identity and other external policy changes until they are confirmed in the relevant UI/settings.

## Finding Triage

| Audit finding | Status | Decision | Target |
| --- | --- | --- | --- |
| Sonar project identity still points to `iurii-izman` | likely valid, but externally confirmable only | defer as manual infra handoff; do not guess new keys in code | `ITER-078` report + manual step |
| Popup side panel may still lose user gesture | already mapped | keep on existing runtime fix path | `ITER-069` |
| Badge side panel open may still depend on background gesture behavior | already mapped | keep on existing runtime/badge QA path | `ITER-069`, `ITER-072` |
| Popup may still open as a tiny strip | already mapped | keep on popup shell pass | `ITER-072` |
| Final runtime visual consistency report appears missing | already mapped | keep on final visual pass | `ITER-075` |
| Sonar is advisory and has no coverage input | confirmed, repo-local | implement | `ITER-076` |
| Dependency Review remains advisory | external/repo-policy decision | defer until stricter checks are intentionally enabled | report only |
| About and Onboarding still overlap | already mapped | keep on role-separation pass | `ITER-073` |
| Dashboard/options responsive cleanup still needed | already mapped | keep on dashboard/final visual pass | `ITER-074`, `ITER-075` |
| n8n permission story unresolved | already known and spec-aligned | keep deferred | none |
| API keys are local plaintext by design | mostly already handled | no dedicated follow-up now; preserve disclosure/testing in existing AI/trust work | none |
| HR timeline stores HTML snippets | confirmed, repo-local | implement a safer trust boundary | `ITER-077` |

## Do Now

These are the non-duplicated items worth implementing after the prepared runtime/UI pack:

### 1. Coverage baseline for advisory Sonar

Status: `confirmed`

Why now:

- local and fully actionable inside the repo;
- improves signal quality without forcing a Sonar quality gate decision;
- does not depend on external permission or product-boundary changes.

Target:

- `ITER-076`

### 2. HR timeline trust-surface hardening

Status: `confirmed`

Why now:

- the adapter still captures HR timeline HTML snippets;
- exported local data therefore carries more markup and privacy surface than needed for the MVP trust model;
- this is repo-local, safety-relevant, and narrow enough for one focused iteration.

Target:

- `ITER-077`

### 3. Audit closure report and infra handoff

Status: `confirmed`

Why now:

- the audit includes valid external follow-ups that should not disappear into chat history;
- we need one explicit closure artifact stating what was implemented, what stayed on existing runtime/UI rows, and what remains manual.

Target:

- `ITER-078`

## Explicitly Reused Existing Work

Do not create duplicate prompts for these items. They are already prepared and should stay where they are:

- popup-to-side-panel runtime reliability: `ITER-069`
- popup shell stability and badge polish: `ITER-072`
- About vs Onboarding role separation: `ITER-073`
- dashboard responsive shell cleanup: `ITER-074`
- final runtime visual consistency report: `ITER-075`

## Deferred External / Policy Items

### SonarCloud org/project identity after repository transfer

Status: `deferred external infra`

Reason:

- likely a real problem;
- cannot be safely corrected from local code without the exact SonarCloud UI values;
- changing `sonar.projectKey` or `sonar.organization` blindly would be a guess, not a fix.

### Dependency Review strict mode

Status: `deferred repo policy`

Reason:

- changing advisory vs blocking behavior is a workflow policy decision;
- it should be done deliberately after the desired baseline is proven.

### n8n permission model

Status: `deferred by product boundary`

Reason:

- already deferred in the current specification and implementation map;
- not a closure item for this audit pass.

## Final Scope Decision

Proceed with one follow-up epic focused on:

1. advisory Sonar coverage signal inside the repo;
2. HR timeline trust-surface reduction;
3. explicit audit closure documentation and manual infra handoff.

Do not spin up a duplicate runtime/UI epic for issues already mapped to `EPIC-35` and `EPIC-36`.
