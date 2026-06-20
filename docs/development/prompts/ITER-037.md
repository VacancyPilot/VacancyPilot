# Prompt: ITER-037 Queue Task List And Duplicate Detection

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-21-queue-and-dashboard-followup.md`
4. `docs/development/iterations/ITER-037-queue-task-list-and-duplicate-detection.md`

Task: implement the first local queue/task-list workflow and duplicate detection after the search-triage core is stable.

Allowed scope:

- queue/task-list model and UI;
- duplicate detection heuristics;
- tests for the new local workflow.

Hard constraints:

- no guided apply;
- no hidden background tabs;
- no HR hub work;
- no public-release packaging work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add queue task list`
