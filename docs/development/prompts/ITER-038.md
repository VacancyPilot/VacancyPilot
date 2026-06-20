# Prompt: ITER-038 Company Greylist And Phase 2 Dashboard

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-21-queue-and-dashboard-followup.md`
4. `docs/development/iterations/ITER-038-company-greylist-and-phase2-dashboard.md`

Task: implement company greylist support and strengthen dashboard workflows for the Phase 2 local triage/queue loop.

Allowed scope:

- company greylist persistence and controls;
- stronger dashboard filters/views;
- tests required for the new local workflow behavior.

Hard constraints:

- no guided apply;
- no multi-site work;
- no unsafe HH automation.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add company greylist workflow`
