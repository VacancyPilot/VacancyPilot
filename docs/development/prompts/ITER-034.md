# Prompt: ITER-034 Search Result Badges

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-20-search-triage-core.md`
4. `docs/development/iterations/ITER-034-search-result-badges.md`

Task: implement lightweight search-result badges on HH search cards using local data and visible-card parsing.

Allowed scope:

- compact badge rendering on search cards;
- minimal supporting tests/styles;
- local read-only badge state presentation.

Hard constraints:

- no quick actions yet;
- no heavy React mount per card;
- no hidden fetches;
- no queue/dashboard work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add search result badges`
