# Iteration Map

Status values:

- `planned`
- `in_progress`
- `done`
- `blocked`
- `deferred`

## Phase 0: Foundation

| Iteration | Epic | Goal | Status | Commit |
| --- | --- | --- | --- | --- |
| ITER-001 | EPIC-00 | Scaffold WXT + React + TypeScript extension | done | `chore: scaffold extension foundation` |
| ITER-002 | EPIC-00 | Add lint/test/typecheck/build scripts and CI smoke shape | planned | `chore: add project quality scripts` |
| ITER-003 | EPIC-01 | Add domain models and shared type contracts | done | `feat: add domain model contracts` |
| ITER-004 | EPIC-01 | Add Dexie schema v1, migrations, settings storage | done | `feat: add local storage schema` |
| ITER-005 | EPIC-02 | Add HHAdapter interface and vacancy parser skeleton | done | `feat: add hh vacancy parser skeleton` |
| ITER-006 | EPIC-02 | Add parser fixture harness and first sanitized fixtures | done | `test: add vacancy parser fixtures` |

## Phase 1: Read & Assist MVP

| Iteration | Epic | Goal | Status | Commit |
| --- | --- | --- | --- | --- |
| ITER-007 | EPIC-03 | Save current vacancy locally and manage statuses | done | `feat: add local vacancy tracker` |
| ITER-008 | EPIC-04 | Implement explainable rule-based scoring | done | `feat: add rule based scoring` |
| ITER-009 | EPIC-05 | Build side panel, popup, and dashboard shell | done | `feat: add extension ui shell` |
| ITER-010 | EPIC-06 | Implement redaction, payload preview, Strict Privacy | done | `feat: add ai privacy layer` |
| ITER-011 | EPIC-06 | Add AI provider interface, mock provider, cache | done | `feat: add ai analysis workflow` |
| ITER-012 | EPIC-07 | Add Cover Letter Studio editor and copy workflow | done | `feat: add cover letter studio` |
| ITER-013 | EPIC-08 | Add CSV/JSON export and delete all data | done | `feat: add export and data deletion` |
| ITER-014 | EPIC-09 | Add n8n webhook client with HMAC and retry queue | deferred | `feat: add opt in n8n events` |
| ITER-015 | EPIC-10 | Add privacy/safety tests and release checklist | done | `test: add release safety checks` |
| ITER-016 | EPIC-10 | Manual QA pass and Phase 1 release candidate docs | done | `docs: prepare phase 1 release candidate` |

## Phase 1 Follow-up: Runtime Completion

| Iteration | Epic | Goal | Status | Commit |
| --- | --- | --- | --- | --- |
| ITER-017 | EPIC-11 | Wire popup actions and live vacancy state | done | `feat: wire popup runtime actions` |
| ITER-018 | EPIC-11 | Replace dashboard vacancy shell with runtime views | done | `feat: add dashboard runtime views` |
| ITER-019 | EPIC-11 | Add profile and resume management flow | done | `feat: add profile resume management` |
| ITER-020 | EPIC-11 | Sync popup, side panel, and dashboard state | done | `feat: sync runtime surfaces` |
| ITER-021 | EPIC-11 | Fix runtime QA findings and prep rerun | done | `fix: address runtime qa findings` |

> **ITER-021 note**: Closed after live browser rerun confirmation for the current Phase 1 core flow. Keep `docs/development/manual-qa-run-2026-06-20.md` as the regression reference for future hardening passes.
>
> **ITER-014 decision**: n8n deferred from current Phase 1 completion path (PHASE-1-SIGNOFF). n8n is opt-in Labs, not Core; the spec lists n8n permission model as an open decision (spec 26.5). Will be re-evaluated post live-rerun confirmation.

## Post-Phase-1: Audit Hardening

| Iteration | Epic | Goal | Status | Commit |
| --- | --- | --- | --- | --- |
| ITER-022 | EPIC-12 | Confirm or refute external audit findings and produce a triaged hardening report | planned | `docs: triage external audit findings` |

## Cursor/Codex Rule

Do not ask autopilot to implement more than one row at a time. If it touches unrelated epics, reject or split the change.
