# Prompt: ITER-020 Surface State Consistency

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 3, 11, 12
3. `docs/development/epics/EPIC-11-runtime-workflow-completion.md`
4. `docs/development/iterations/ITER-020-surface-state-consistency.md`
5. `docs/development/manual-qa-run-2026-06-20.md`

Task: make popup, side panel, and dashboard reflect the same saved vacancy state and score/profile context.

Allowed scope:

- shared local state read/update paths;
- side panel and popup consistency work;
- score explanation visibility;
- focused tests;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- no speculative global state rewrite;
- no n8n work;
- no new permissions;
- preserve existing privacy boundaries.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: sync runtime surfaces`
