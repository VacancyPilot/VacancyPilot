# Prompt: ITER-026 Parser, Dashboard, And Release Safety Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-13-confirmed-audit-fixes.md`
4. `docs/development/iterations/ITER-026-parser-dashboard-and-release-safety-hardening.md`
5. `docs/development/ITER-022-triage-report.md`

Task: harden HH parsing, reduce dashboard staleness, and validate generated extension artifacts more directly.

Allowed scope:

- HH adapter host/work-mode/status/text hardening;
- first fixture expansion batch;
- dashboard vacancy refresh behavior;
- generated manifest/build-output safety checks;
- focused tests/scripts required for those changes.

Hard constraints:

- no scoring synonym expansion;
- no localization pass;
- no n8n work;
- no broad product redesign.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: harden parser and release safety`
