# Prompt: ITER-018 Dashboard Runtime Views

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 3, 11, 22.4
3. `docs/development/epics/EPIC-11-runtime-workflow-completion.md`
4. `docs/development/iterations/ITER-018-dashboard-runtime-views.md`
5. `docs/development/manual-qa-run-2026-06-20.md`

Task: replace the main dashboard vacancy shell with real local data views for tracked vacancies.

Allowed scope:

- options/dashboard runtime vacancy views;
- minimal repository/service helpers needed for rendering;
- focused tests;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- no broad UI redesign;
- no n8n work;
- no new permissions;
- keep export/privacy sections working.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: add dashboard runtime views`
