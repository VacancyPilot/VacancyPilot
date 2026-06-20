# Prompt: ITER-053 Toolchain-Linked Security Fixes

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-28-security-alert-closure.md`
4. `docs/development/iterations/ITER-053-toolchain-linked-security-fixes.md`

Task: resolve only the remaining toolchain-linked security alerts identified in `ITER-051`, using coordinated dependency updates where required.

Allowed scope:

- toolchain-linked dependency updates mapped from `ITER-051`;
- narrowly required config/test changes caused by those updates;
- release-safety and manifest verification adjustments only when the underlying toolchain change requires them.

Hard constraints:

- no unrelated dependency churn;
- no product feature work;
- no direct HH automation changes;
- no permission or manifest expansion beyond current intent.

Validation:

```text
pnpm audit
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: resolve toolchain linked security alerts`
