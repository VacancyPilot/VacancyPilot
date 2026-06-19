# Prompt: ITER-013 Export And Delete

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 14, 19.4, 26.5
3. `docs/development/epics/EPIC-08-export-delete-and-data-ownership.md`
4. `docs/development/iterations/ITER-013-export-delete.md`

Task: implement CSV/JSON export and explicit local data deletion workflows for the Phase 1 MVP.

Allowed scope:

- export service functions;
- JSON export envelope;
- CSV export for user-facing entities;
- export UI entry points;
- delete-one/delete-all local data actions if already covered by the iteration spec;
- safety confirmations and warnings;
- tests for export shape, secret exclusion, and destructive flows;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- no n8n implementation in this iteration;
- no new broad or sensitive permissions unless strictly required and explicitly justified;
- API keys and sensitive integration credentials must not appear in export;
- destructive actions must require explicit confirmation;
- prefer export-before-delete UX;
- keep the implementation local-first and scoped to existing product boundaries.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: add export and data deletion`
