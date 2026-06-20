# Prompt: ITER-035 Search Quick Actions And DB Sync

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-20-search-triage-core.md`
4. `docs/development/iterations/ITER-035-search-quick-actions-and-db-sync.md`

Task: add local quick save/reject actions to search cards and synchronize them with the existing tracker state.

Allowed scope:

- search-card quick save/reject controls;
- local DB synchronization and badge refresh;
- tests needed for the new local-action path.

Hard constraints:

- quick actions must affect only local data;
- no background vacancy opening;
- no HH form interaction;
- no queue/dashboard work yet.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add search quick actions`
