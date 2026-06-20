# Prompt: ITER-024 Save Semantics And Score Recompute

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-13-confirmed-audit-fixes.md`
4. `docs/development/iterations/ITER-024-save-semantics-and-score-recompute.md`
5. `docs/development/ITER-022-triage-report.md`

Task: make Save mean `saved`, preserve stronger statuses, and recompute score when profile selection changes the scoring context.

Allowed scope:

- popup save/status behavior;
- shared score recompute path;
- profile-selection runtime updates for popup/side panel/badge;
- focused tests for status transitions and recompute.

Hard constraints:

- no orphan cleanup in this iteration;
- no cover-letter privacy work;
- no parser hardening;
- no n8n work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: align save semantics and score recompute`
