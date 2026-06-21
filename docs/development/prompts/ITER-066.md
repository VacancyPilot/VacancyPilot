# Prompt: ITER-066 Shared UI States And Responsive Polish

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-33-ui-foundation-and-surface-consistency.md`
4. `docs/development/iterations/ITER-066-shared-ui-states-and-responsive-polish.md`

Task: standardize shared UI states and improve responsive density across the extension surfaces.

Allowed scope:

- empty/loading/error state consistency;
- popup and side-panel responsive polish;
- spacing/scrolling/section-density cleanup in runtime views;
- focused tests for state rendering where practical.

Hard constraints:

- no navigation rewrite;
- no new product modules;
- no major logic expansion outside clearer state feedback.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: polish shared ui states and responsiveness`
