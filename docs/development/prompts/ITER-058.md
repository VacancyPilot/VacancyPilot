# Prompt: ITER-058 Experience-Aware Scoring Calibration

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/audit-2026-06-21-decision-report.md`
4. `docs/development/epics/EPIC-29-post-audit-reliability-and-scoring.md`
5. `docs/development/iterations/ITER-058-experience-aware-scoring-calibration.md`

Task: upgrade the rule-based scoring engine to use the new profile experience/seniority fields and produce clearer fit reasons and risk flags.

Allowed scope:

- scoring logic for experience/seniority;
- conservative risk-flag additions tied to those signals;
- focused tests for score determinism and mismatch behavior;
- small explainability updates where necessary.

Hard constraints:

- no opaque AI ranking logic;
- no parser/domain expansion for industries;
- no large UI redesign;
- no permission changes.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: improve scoring fit signals`
