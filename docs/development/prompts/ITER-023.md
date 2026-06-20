# Prompt: ITER-023 Storage And Data Integrity Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-13-confirmed-audit-fixes.md`
4. `docs/development/iterations/ITER-023-storage-and-data-integrity-hardening.md`
5. `docs/development/ITER-022-triage-report.md`

Task: harden vacancy storage, remove stale badge state after deletions, and eliminate unsafe fallback vacancy IDs.

Allowed scope:

- Dexie schema/migration work needed for the compound index;
- repository/query updates for stable vacancy upsert;
- badge key cleanup in local storage;
- explicit rejection of missing vacancy IDs;
- focused tests for all changed behaviors.

Hard constraints:

- no save/status UX changes in this iteration;
- no score recompute work;
- no parser heuristics work;
- no n8n work;
- no broad refactor beyond storage/data-integrity paths.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: harden vacancy storage and badge cleanup`
