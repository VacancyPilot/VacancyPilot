# ITER-060: AI Settings Lifecycle Hardening

Epic: EPIC-31  
Commit: `fix: harden ai settings lifecycle`

## Goal

Make AI settings and local API-key handling more predictable, explicit, and recoverable for private users.

## Scope

- review current AI settings persistence and reset/update behavior;
- harden local key lifecycle UX and warnings without inventing fake security guarantees;
- improve empty/error/saved states for provider configuration;
- add focused tests for settings persistence and key-handling behavior.

## Non-Goals

- no backend vault;
- no sync storage;
- no new provider integrations requiring architecture changes;
- no `n8n` or public release work.

## Acceptance Criteria

- AI settings changes behave predictably across popup/dashboard/side panel surfaces where relevant;
- API-key handling is explicit about local-only storage and reset/delete behavior;
- tests cover the main lifecycle transitions.

## Validation

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
