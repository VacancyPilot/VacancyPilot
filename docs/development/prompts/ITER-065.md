# Prompt: ITER-065 UI Foundations And Shell Consistency

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-33-ui-foundation-and-surface-consistency.md`
4. `docs/development/iterations/ITER-065-ui-foundations-and-shell-consistency.md`

Task: create a shared UI foundation and normalize shell styling across popup, side panel, dashboard, and trust surfaces.

Allowed scope:

- shared tokens or primitive style helpers;
- repeated layout/panel/button/section styling cleanup;
- popup, side panel, dashboard, onboarding, permissions, and privacy shell consistency;
- focused tests updated for structure-sensitive rendering changes.

Hard constraints:

- no broad visual rebrand;
- no CSS framework migration;
- no dark mode system;
- no new product behavior outside what the UI refactor needs.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `refactor: unify ui surface foundations`
