# Prompt: ITER-052 Safe Transitive Security Fixes

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-28-security-alert-closure.md`
4. `docs/development/iterations/ITER-052-safe-transitive-security-fixes.md`

Task: implement only the safe transitive alert fixes identified in `ITER-051`, using targeted overrides or minimal dependency moves.

Allowed scope:

- narrow `pnpm` overrides;
- minimal version updates tied directly to safe alert families;
- lockfile/config/test adjustments required by those exact fixes.

Hard constraints:

- no major framework jumps;
- no broad toolchain rewrite;
- no product feature work;
- no permission or manifest expansion.

Validation:

```text
pnpm audit
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: close safe transitive security alerts`
