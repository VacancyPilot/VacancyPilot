# Prompt: ITER-036 Search Triage Runtime Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-20-search-triage-core.md`
4. `docs/development/iterations/ITER-036-search-triage-runtime-hardening.md`

Task: harden the search triage surface for dynamic HH result pages and add the required search-surface safety/runtime tests.

Allowed scope:

- dynamic-list handling;
- dedupe/re-render protection;
- search-surface safety/runtime test coverage;
- focused performance-minded cleanup.

Hard constraints:

- no queue/dashboard work;
- no hidden full-vacancy fetches;
- no heavy architectural rewrite.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: harden search triage runtime`
