# Prompt: ITER-033 Search Card Parser And Fixtures

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-20-search-triage-core.md`
4. `docs/development/iterations/ITER-033-search-card-parser-and-fixtures.md`

Task: implement the safe search-card parser layer for HH search results, with sanitized fixtures and tests.

Allowed scope:

- search-card parser contracts and parser implementation;
- search-card fixtures and fixture harness/tests;
- only visible-card DOM extraction.

Hard constraints:

- no badge rendering yet;
- no quick save/reject yet;
- no queue/dashboard work;
- no hidden fetch of full vacancy pages.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add hh search card parser`
