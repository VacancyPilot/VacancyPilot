# EPIC-23: HR Communication Hub

## Goal

Help the user process HR replies and plan follow-up actions from local, read-only data without turning the extension into a chat bot or hidden inbox monitor.

## Inputs

- `docs/Техническое заданиеV.1.md` sections `Phase 5`, `14.2`, `19.5`, `24.3`
- current repository state after `EPIC-25` and `EPIC-28`

## In Scope

- read-only parsing of user-opened HH application / negotiation pages;
- local HR timeline entries linked to `Application`;
- reply classification:
  - `invitation`
  - `rejection`
  - `question`
  - `test_task`
  - `interview`
  - `unknown`
- dashboard / application workspace for timeline review;
- follow-up planning and reply-draft preparation with copy-only workflow;
- focused tests for parser, classification, and no-automation boundaries.

## Explicitly Deferred

- background polling of HH;
- hidden chat capture;
- auto-reply or auto-send;
- programmatic writes into HH message fields;
- `n8n` / Telegram delivery;
- multi-site expansion;
- public-release packaging.

## Success Criteria

- the user can understand what HR already sent and what action is next from local state only;
- all HR capture remains visible, user-opened, and read-only;
- any reply help stays manual, copy-based, and policy-safe.
