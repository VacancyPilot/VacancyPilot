# EPIC-13: Confirmed Audit Fixes

## Goal

Fix only the audit findings that were confirmed in `ITER-022`, using narrow iterations that improve reliability without expanding product scope.

## Inputs

- `docs/development/ITER-022-triage-report.md`
- `docs/vacancypilot_deep_repo_audit_2026-06-20.md`
- current repository state after Phase 1 signoff

## In Scope

- storage and badge cleanup hardening;
- save/status semantics;
- score recompute and lifecycle integrity for profile/resume flows;
- cover-letter privacy alignment;
- HH parser hardening and fixture growth;
- dashboard refresh and generated-manifest release safety checks.

## Explicitly Deferred

- `ITER-014` / n8n implementation;
- UI language localization pass;
- scoring synonym dictionary;
- public-release asset pack;
- AI production provider work;
- search badges and other Phase 2 features.

## Success Criteria

- confirmed P0 issues are closed;
- confirmed P1 issues are either fixed or intentionally deferred with rationale;
- hardened core flow passes automated checks and is ready for another focused browser rerun;
- the project can enter Phase 2 on a more reliable base.
