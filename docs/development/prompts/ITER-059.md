# Prompt: ITER-059 Final Moderate Dependency Alert

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-30-final-security-tail-closure.md`
4. `docs/development/iterations/ITER-059-final-moderate-dependency-alert.md`

Task: close the remaining moderate transitive dependency alert with the smallest safe package/lockfile change.

Allowed scope:

- inspect the current advisory path;
- minimal dependency bump, override, or lockfile refresh needed to close it;
- focused audit and verification rerun;
- narrow documentation update only if needed to explain the closure.

Hard constraints:

- no product feature changes;
- no broad toolchain churn;
- no permission changes;
- no public-release work.

Validation:

```text
pnpm audit --prod
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: close final moderate dependency alert`
