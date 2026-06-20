# Prompt: ITER-042 Local Reminders And Daily Summary

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-25-workflow-automation-and-reminders.md`
4. `docs/development/iterations/ITER-042-local-reminders-and-daily-summary.md`

Task: add local reminders and daily summary surfaces that help the user work the queue repeatedly without external automation.

Allowed scope:

- reminder eligibility logic;
- daily summary UI surfaces;
- local workflow event summaries;
- focused tests for reminder and summary logic.

Hard constraints:

- no webhook sending;
- no background polling of HH;
- no HR chat ingestion;
- no multi-site work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add workflow reminders and summary`
