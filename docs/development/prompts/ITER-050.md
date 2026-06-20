# Prompt: ITER-050 React Stack Alignment

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-27-dependency-and-toolchain-maintenance.md`
4. `docs/development/iterations/ITER-050-react-stack-alignment.md`

Task: resolve the remaining React dependency drift as one coherent stack decision instead of a partial major bump.

Allowed scope:

- `react`, `react-dom`, and their type packages as one aligned surface;
- narrowly required compatibility fixes;
- focused validation for popup, side panel, and dashboard surfaces.

Hard constraints:

- no product feature expansion;
- no opportunistic UI rewrites;
- no unrelated dependency churn;
- no permission or manifest changes.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `chore: align react stack`
