# Prompt: ITER-056 Migration Boot And Runtime QA Evidence

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/audit-2026-06-21-decision-report.md`
4. `docs/development/epics/EPIC-29-post-audit-reliability-and-scoring.md`
5. `docs/development/iterations/ITER-056-migration-boot-and-runtime-qa-evidence.md`

Task: wire the existing migration bookkeeping into safe extension boot flow, add regression proof for version handling, and refresh the runtime QA docs for the current vacancy/search/HR surfaces without expanding permissions.

Allowed scope:

- migration boot wiring;
- migration tests;
- QA checklist/manual QA doc refresh for current product surfaces;
- explicit documentation that minimal permissions remain the default.

Hard constraints:

- no broad permission expansion;
- no product-scope feature work;
- no SonarCloud/GitHub policy work;
- do not claim manual QA results that were not actually performed.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: wire migrations and refresh runtime qa gate`
