# Prompt: ITER-070 Popup And Badge UX Polish

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-35-runtime-stabilization-and-surface-hardening.md`
4. `docs/development/iterations/ITER-070-popup-and-badge-ux-polish.md`

Task: polish popup density and HH page-badge placement after the side-panel runtime fix, without changing product behavior.

Allowed scope:

- popup action layout and compact summary polish;
- clearer low-score semantics and collapsed detail defaults;
- page-badge positioning and visual cleanup on HH vacancy pages;
- badge-trigger verification after the side-panel runtime fix;
- focused tests and manual QA notes for popup/badge regressions.

Hard constraints:

- no dashboard/options changes in this iteration;
- no product-logic changes outside local UI state and presentation;
- no browser-permission or host-permission changes;
- no hidden HH fetch/XHR;
- no HH auto-click or form-write behavior.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `polish: improve popup and page badge UX`
