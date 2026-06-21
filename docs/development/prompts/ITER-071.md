# Prompt: ITER-071 Dashboard Responsive Ergonomics

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-35-runtime-stabilization-and-surface-hardening.md`
4. `docs/development/iterations/ITER-071-dashboard-responsive-ergonomics.md`

Task: reduce nested-scroll friction and improve dashboard/options usability at narrow widths without reopening product logic.

Allowed scope:

- dashboard/options shell scroll cleanup;
- responsive sidebar/navigation treatment for medium and narrow widths;
- empty-state and form layout improvements for constrained widths;
- kanban responsive usability polish without workflow expansion;
- focused validation and manual QA reporting for the touched surfaces.

Hard constraints:

- no new dashboard features;
- no browser-permission or host-permission changes;
- no hidden HH fetch/XHR;
- no broad design-system rewrite;
- no PR/branch management inside this run.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: polish dashboard responsive ergonomics`
