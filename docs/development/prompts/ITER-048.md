# Prompt: ITER-048 WXT Stack Refresh And Dependency Baseline

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-27-dependency-and-toolchain-maintenance.md`
4. `docs/development/iterations/ITER-048-wxt-stack-refresh-and-dependency-baseline.md`

Task: replace the stale grouped Dependabot dependency batch with a deliberate WXT-stack refresh and clean dependency baseline.

Allowed scope:

- `wxt`, `@wxt-dev/module-react`, and directly related lockfile/config updates;
- compatibility fixes required by that stack refresh;
- focused validation adjustments only where the refreshed stack truly requires them.

Hard constraints:

- no TypeScript 6 migration yet;
- no React major decision yet;
- no product feature work;
- no permission expansion or manifest broadening.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `chore: refresh wxt dependency baseline`
