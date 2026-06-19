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
| ITER-003 | EPIC-01 | Add domain models and shared type contracts | planned | `feat: add domain model contracts` |
| ITER-004 | EPIC-01 | Add Dexie schema v1, migrations, settings storage | planned | `feat: add local storage schema` |
| ITER-005 | EPIC-02 | Add HHAdapter interface and vacancy parser skeleton | planned | `feat: add hh vacancy parser skeleton` |
| ITER-006 | EPIC-02 | Add parser fixture harness and first sanitized fixtures | planned | `test: add vacancy parser fixtures` |

## Phase 1: Read & Assist MVP

| Iteration | Epic | Goal | Status | Commit |
| --- | --- | --- | --- | --- |
| ITER-007 | EPIC-03 | Save current vacancy locally and manage statuses | planned | `feat: add local vacancy tracker` |
| ITER-008 | EPIC-04 | Implement explainable rule-based scoring | planned | `feat: add rule based scoring` |
| ITER-009 | EPIC-05 | Build side panel, popup, and dashboard shell | planned | `feat: add extension ui shell` |
| ITER-010 | EPIC-06 | Implement redaction, payload preview, Strict Privacy | planned | `feat: add ai privacy layer` |
| ITER-011 | EPIC-06 | Add AI provider interface, mock provider, cache | planned | `feat: add ai analysis workflow` |
| ITER-012 | EPIC-07 | Add Cover Letter Studio editor and copy workflow | planned | `feat: add cover letter studio` |
| ITER-013 | EPIC-08 | Add CSV/JSON export and delete all data | planned | `feat: add export and data deletion` |
| ITER-014 | EPIC-09 | Add n8n webhook client with HMAC and retry queue | planned | `feat: add opt in n8n events` |
| ITER-015 | EPIC-10 | Add privacy/safety tests and release checklist | planned | `test: add release safety checks` |
| ITER-016 | EPIC-10 | Manual QA pass and Phase 1 release candidate docs | planned | `docs: prepare phase 1 release candidate` |

## Cursor/Codex Rule

Do not ask autopilot to implement more than one row at a time. If it touches unrelated epics, reject or split the change.
