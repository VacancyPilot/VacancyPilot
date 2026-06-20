# Prompt: ITER-017 Popup Runtime Actions

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 3, 11, 22.4
3. `docs/development/epics/EPIC-11-runtime-workflow-completion.md`
4. `docs/development/iterations/ITER-017-popup-runtime-actions.md`
5. `docs/development/manual-qa-run-2026-06-20.md`

Task: wire the popup to real local vacancy actions and live state for the current HH vacancy page.

Allowed scope:

- popup runtime action logic;
- local tracker/scoring integration needed by popup;
- minimal shared helpers/hooks needed for popup state;
- focused tests;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- no HH form writes;
- no synthetic DOM events;
- no hidden HH fetches;
- no new broad permissions;
- keep changes tightly scoped to popup/runtime flow.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: wire popup runtime actions`
