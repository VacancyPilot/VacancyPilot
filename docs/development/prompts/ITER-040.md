# Prompt: ITER-040 Clipboard Guided Apply Workspace

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-22-guided-apply-labs.md`
4. `docs/development/iterations/ITER-040-clipboard-guided-apply-workspace.md`

Task: implement the first clipboard-only guided-apply Labs workflow on top of the new Labs control plane.

Allowed scope:

- guided-apply workspace UI;
- resume recommendation and apply checklist;
- clipboard/copy assist;
- field guidance/highlighting without DOM value mutation;
- manual mark-as-applied support;
- focused tests for Labs gating and no-automation boundaries.

Hard constraints:

- no programmatic field fill;
- no synthetic DOM events on HH forms;
- no submit clicks;
- no hidden tabs or vacancy opening;
- no webhook delivery.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add guided apply workspace`
