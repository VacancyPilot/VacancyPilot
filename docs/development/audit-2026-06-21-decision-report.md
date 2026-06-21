# Audit 2026-06-21 Decision Report

Source audit: external deep repository/product audit received on `2026-06-21`

Purpose: convert the audit into an actionable implementation decision pack without mixing product work, infra-only work, and out-of-scope ideas.

## Decision Summary

The audit is directionally useful, but it mixes three different categories:

1. real code/runtime gaps we should fix now;
2. external infrastructure decisions that are valid but not product-implementation work;
3. broader future improvements that should stay in backlog until the current product surface is tighter.

The next active implementation pack should therefore be a narrow post-audit hardening epic with four iterations:

- `ITER-055` schema/data-lifecycle hardening;
- `ITER-056` migration boot + runtime QA evidence pack;
- `ITER-057` profile experience/seniority model;
- `ITER-058` scoring calibration on top of the new profile model.

## Do Now

These findings are confirmed enough, local enough, and valuable enough to enter the next active epic.

### 1. Schema source-of-truth and HR data lifecycle

Status: `confirmed`

Why now:

- `TABLE_NAMES` still comes from `SCHEMA_V1`;
- `labsActions` and `hrTimeline` are still special-cased or omitted in lifecycle utilities;
- this can produce incomplete export/delete/count behavior, which is a real local-first trust issue.

Target iteration:

- `ITER-055`

### 2. Migration boot wiring and regression proof

Status: `confirmed in principle`

Why now:

- migration helpers exist;
- migration bookkeeping should be explicitly exercised and wired into safe boot surfaces;
- this is a small reliability investment before the data model grows further.

Target iteration:

- `ITER-056`

### 3. Runtime context proof without permission expansion

Status: `partially confirmed / verification-oriented`

Why now:

- the audit correctly highlights the risk area around `activeTab`, `chrome.tabs.*`, and side-panel context;
- we already have working runtime flows and manual QA evidence, so the right move is not a new permission;
- the right move is a focused QA matrix refresh around vacancy/search/HR/delete-export flows and an explicit recorded decision to avoid `tabs` unless reproducibly necessary.

Target iteration:

- `ITER-056`

### 4. Experience-aware scoring

Status: `confirmed product gap`

Why now:

- current scoring already admits in code that profile experience is not modeled and experience is effectively neutral;
- this directly affects ranking quality and is local-first product work, not speculative infrastructure.

Target iterations:

- `ITER-057` for profile model/editor fields
- `ITER-058` for scoring logic and risk flags

## Backlog

These ideas are valid, but they should not displace the narrower reliability/scoring work above.

### Parser health/debug telemetry

Status: `backlog`

Reason:

- useful, but not as urgent as data-lifecycle correctness;
- debug telemetry and selector health panels are secondary once fixture coverage is already strong.

### Small design system / shared UI tokens

Status: `backlog`

Reason:

- real maintainability value;
- not the best next move while confirmed data-integrity and scoring-quality gaps remain open.

### JSON import / restore

Status: `backlog`

Reason:

- strategically useful;
- more invasive than the current hardening pack;
- should be designed as its own data-ownership epic, not squeezed into audit cleanup.

### AI provider lifecycle gateway

Status: `backlog`

Reason:

- important only when real provider usage becomes a live product path;
- the current AI layer is still mostly local/privacy-oriented and opt-in.

### Guided Apply semantics expansion

Status: `backlog`

Reason:

- worth tightening further later with extra release-safety checks;
- not the highest-value next pack compared with schema lifecycle and scoring quality.

## Deferred External / Infra Decisions

These are real concerns, but they are not the right next Zed implementation pack because they depend on repo settings or third-party configuration.

### Sonar project identity after repo transfer

Status: `deferred external infra`

Reason:

- likely valid;
- requires SonarCloud project/org confirmation outside local code alone;
- should be handled as an infra alignment task, not mixed into the next product epic.

### Dependency Review advisory mode

Status: `deferred external infra`

Reason:

- already intentionally advisory;
- changing gate severity is a repository policy decision, not product implementation;
- revisit only when the team explicitly wants stricter PR blocking.

## Rejected For Current Pack

These are not accepted into the next pack.

### Adding broad `tabs` permission

Status: `rejected unless runtime evidence forces it`

Reason:

- violates the current minimal-permission posture;
- no current evidence justifies broadening permissions before another targeted runtime proof pass.

### Public beta / store-readiness work

Status: `rejected for current pack`

Reason:

- this is later-phase release work;
- it should not interrupt local reliability hardening.

### Multi-site expansion

Status: `rejected for current pack`

Reason:

- not connected to the confirmed audit findings;
- increases scope with little value to the next reliability milestone.

## Final Scope Decision

Proceed with a new post-audit implementation epic focused on:

1. complete current-schema data lifecycle correctness;
2. explicit migration/runtime proof without permission expansion;
3. candidate-specific experience/seniority scoring improvements.

Do not pull Sonar/Dependency Review policy changes, design-system work, import/restore, or public-release tasks into this pack.
