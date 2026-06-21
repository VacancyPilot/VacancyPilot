# Prompt: ITER-057 Profile Experience And Seniority Model

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/audit-2026-06-21-decision-report.md`
4. `docs/development/epics/EPIC-29-post-audit-reliability-and-scoring.md`
5. `docs/development/iterations/ITER-057-profile-experience-and-seniority-model.md`

Task: extend the local profile model and profile-management UI with candidate experience and seniority fields so the next scoring iteration has real inputs.

Allowed scope:

- profile domain model changes for `experienceYears` and `seniority`;
- profile create/edit/load/save flows;
- focused tests for model and profile UI behavior.

Hard constraints:

- no scoring-calibration logic yet;
- no industry/domain model expansion;
- no AI or n8n changes;
- no permission changes.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: add profile experience model`
