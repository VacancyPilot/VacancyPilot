# Prompt: ITER-049 TypeScript 6 Migration

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-27-dependency-and-toolchain-maintenance.md`
4. `docs/development/iterations/ITER-049-typescript-6-migration.md`

Task: perform a real TypeScript 6 migration pass and make the repository green on TS6.

Allowed scope:

- TypeScript 6 upgrade;
- `tsconfig` cleanup for TS6 deprecations;
- narrowly required code/config/test adjustments caused by TS6.

Hard constraints:

- no React stack move yet;
- no broad WXT rewrite outside the already refreshed baseline;
- no product feature work;
- no unrelated refactors.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `chore: migrate to typescript 6`
