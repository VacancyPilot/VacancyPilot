# Prompt: ITER-055 Schema Source Of Truth And HR Data Lifecycle

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/audit-2026-06-21-decision-report.md`
4. `docs/development/epics/EPIC-29-post-audit-reliability-and-scoring.md`
5. `docs/development/iterations/ITER-055-schema-source-of-truth-and-hr-data-lifecycle.md`

Task: align local data lifecycle helpers with the actual live Dexie schema so export/delete/count behavior is correct for all current stores, including HR timeline data.

Allowed scope:

- current-schema table-name source of truth;
- export/delete/hasData/getDataCounts lifecycle fixes;
- linked HR timeline cleanup during single-job deletion;
- focused tests for schema/lifecycle coverage.

Hard constraints:

- no scoring/model/UI redesign work;
- no new permissions;
- no Sonar/Dependency Review changes;
- no n8n reopening.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: align schema lifecycle utilities`
