# Prompt: ITER-074 Dashboard Shell Consolidation

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/vacancypilot_runtime_visual_consistency_audit_2026-06-21.md`
4. `docs/development/epics/EPIC-36-runtime-visual-consistency-consolidation.md`
5. `docs/development/iterations/ITER-074-dashboard-shell-consolidation.md`

Task: consolidate dashboard/options shell behavior so navigation width, scroll ownership, and section density feel deliberate across extension-sized widths.

Allowed scope:

- sidebar breakpoint and label/icon behavior cleanup;
- shell scroll-ownership consolidation;
- light visual grouping in dashboard navigation if it materially improves scanability;
- responsive shell polish that preserves current features and data flow.

Hard constraints:

- no new dashboard features;
- no drag-and-drop kanban rewrite;
- no permissions or external-flow changes;
- no broad design-system rewrite.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: consolidate dashboard shell responsiveness`
