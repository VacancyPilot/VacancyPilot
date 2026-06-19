# Prompt: ITER-015 Release Safety Tests

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 19.6, 22.4, 26.5, 26.6
3. `docs/development/epics/EPIC-10-release-hardening-and-qa.md`
4. `docs/development/iterations/ITER-015-release-safety-tests.md`

Task: add automated release-safety checks that fail on unsafe permission, privacy, or HH-boundary regressions.

Allowed scope:

- manifest permission assertions;
- tests for HH safety boundaries;
- tests for privacy/export secret exclusion;
- fixture or smoke checks that guard against unsafe regressions;
- release checklist docs only where needed to document automation gaps;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- do not add new product features in this iteration;
- do not widen permissions to satisfy tests;
- do not weaken safety checks to make CI green;
- keep checks deterministic and repo-local;
- do not introduce hidden network dependencies into the test suite.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `test: add release safety checks`
