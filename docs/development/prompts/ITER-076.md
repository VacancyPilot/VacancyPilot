# Prompt: ITER-076 Sonar Coverage Baseline

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/audit-2026-06-22-decision-report.md`
4. `docs/development/epics/EPIC-37-audit-closure-and-trust-surface-alignment.md`
5. `docs/development/iterations/ITER-076-sonar-coverage-baseline.md`
6. `docs/development/sonarqube-cloud-setup.md`

Task: add a repo-local Vitest coverage baseline for advisory Sonar and align Sonar docs/workflow wording, without guessing the external SonarCloud org/project identity after repo transfer.

Allowed scope:

- `@vitest/coverage-v8` or equivalent Vitest-native coverage support;
- `pnpm test:coverage`;
- LCOV generation and `sonar.javascript.lcov.reportPaths`;
- Sonar workflow updates needed to consume the coverage run in advisory mode;
- Sonar setup/docs wording that clearly separates repo-local coverage work from manual external identity confirmation.

Hard constraints:

- do not invent or blindly replace `sonar.projectKey` / `sonar.organization`;
- do not switch Sonar to blocking quality-gate mode;
- no branch protection or repository-policy changes;
- no product/runtime/UI changes.

Validation:

```text
pnpm test:coverage
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `ci: add sonar coverage baseline`
