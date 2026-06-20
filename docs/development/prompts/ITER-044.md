# Prompt: ITER-044 HR Timeline Capture And Classification

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-23-hr-communication-hub.md`
4. `docs/development/iterations/ITER-044-hr-timeline-capture-and-classification.md`

Task: implement the safe read-only HR communication layer by parsing visible HH application / negotiation surfaces into local classified timeline data.

Allowed scope:

- HH adapter parsing for `applications` / `messages` surfaces;
- sanitized fixtures and parser coverage;
- local HR timeline data model and persistence wiring;
- reply classification logic;
- focused tests for parser, classification, and no-hidden-automation behavior.

Hard constraints:

- no hidden polling of HH;
- no auto-reply or auto-send;
- no writes into HH message fields;
- no webhook / Telegram delivery;
- no broad permissions.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add hr timeline capture`
