# Prompt: ITER-075 Runtime Forms, Empty States, And Final Report

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/vacancypilot_runtime_visual_consistency_audit_2026-06-21.md`
4. `docs/development/epics/EPIC-36-runtime-visual-consistency-consolidation.md`
5. `docs/development/iterations/ITER-075-runtime-forms-empty-states-and-final-report.md`

Task: finish forms, disabled-state readability, and empty-state polish, then capture the final runtime visual consistency report and remaining UX debt.

Allowed scope:

- empty-state width/readability cleanup;
- focused responsive form layout cleanup in Profiles, Resumes, Settings, Labs, or Export;
- disabled-state readability improvements for AI/provider/settings surfaces;
- final runtime visual consistency report and manual QA checklist;
- focused tests where extracted helpers or repeated style logic are touched.

Hard constraints:

- no new product features;
- no public-release/store work;
- no permissions/backend/telemetry changes;
- no design-system rewrite for its own sake.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `docs: finalize runtime visual consistency pass`
