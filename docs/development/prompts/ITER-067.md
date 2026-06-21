# Prompt: ITER-067 Workflow Ergonomics Refinement

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-34-workflow-ux-refinement.md`
4. `docs/development/iterations/ITER-067-workflow-ergonomics-refinement.md`

Task: improve the ergonomics of kanban, HR workspace, and guided-apply workflow surfaces for repeated daily use.

Allowed scope:

- action grouping and density improvements;
- clearer selected-item context, warnings, and transition feedback;
- workflow-heavy surface polish in kanban, HR workspace, and guided apply;
- focused tests updated where structure or labels change.

Hard constraints:

- no new automation behavior;
- no major data-model additions;
- no broad workflow feature expansion.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: refine workflow ergonomics`
