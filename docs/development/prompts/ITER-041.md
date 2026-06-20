# Prompt: ITER-041 Kanban Queue And Manual Stage Actions

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-25-workflow-automation-and-reminders.md`
4. `docs/development/iterations/ITER-041-kanban-queue-and-manual-stage-actions.md`

Task: turn the current queue into a kanban-style manual workflow surface.

Allowed scope:

- kanban queue layout;
- manual stage actions and queue ergonomics;
- dashboard review/filter improvements tied to queue workflow;
- tests for queue transitions and stage rendering.

Hard constraints:

- no auto-processing queue;
- no hidden browser tabs;
- no webhook sending;
- no HR communication features.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add kanban queue workflow`
