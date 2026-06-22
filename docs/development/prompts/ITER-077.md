# Prompt: ITER-077 HR Timeline Trust Surface

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/audit-2026-06-22-decision-report.md`
4. `docs/development/epics/EPIC-37-audit-closure-and-trust-surface-alignment.md`
5. `docs/development/iterations/ITER-077-hr-timeline-trust-surface.md`

Task: reduce unnecessary privacy/export risk in the HR timeline flow by tightening what is stored and surfaced from HH negotiation parsing.

Allowed scope:

- HR timeline raw DTO/data-shape review;
- HH adapter HR timeline extraction cleanup;
- plain-text-first storage or tightly justified remaining markup;
- focused export/privacy documentation updates;
- focused test updates for the changed trust boundary.

Hard constraints:

- no new HR features or workflow expansion;
- no hidden HH fetch/XHR;
- no HH form writes or auto-click behavior;
- no permissions changes;
- no broad UI redesign.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: harden hr timeline trust surface`
