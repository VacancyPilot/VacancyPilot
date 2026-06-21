# Prompt: ITER-072 Popup Shell And Badge Finalization

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/vacancypilot_runtime_visual_consistency_audit_2026-06-21.md`
4. `docs/development/epics/EPIC-36-runtime-visual-consistency-consolidation.md`
5. `docs/development/iterations/ITER-072-popup-shell-and-badge-finalization.md`

Task: stabilize popup shell dimensions and finish the remaining ambient badge placement/behavior polish without changing product logic.

Allowed scope:

- popup shell width/height stabilization across loading and runtime states;
- stable popup loading/no-vacancy shell treatment if needed;
- popup action visibility/density cleanup tied to shell stability;
- badge placement and presentation refinement on real HH pages;
- focused tests for the real popup shell contract or badge helpers touched here.

Hard constraints:

- no About/Onboarding refactor in this run;
- no dashboard information-architecture changes;
- no browser-permission or host-permission changes;
- no hidden HH fetch/XHR, no HH form writes, no auto-click behavior.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: stabilize popup shell and badge placement`
