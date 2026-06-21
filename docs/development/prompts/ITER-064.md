# Prompt: ITER-064 Private Release Readiness Pack

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-32-private-release-readiness.md`
4. `docs/development/iterations/ITER-064-private-release-readiness-pack.md`

Task: finalize the private release readiness layer so the repo has coherent install, QA, and release-trust documentation and evidence.

Allowed scope:

- private install guide, release checklist, and closely related readiness docs;
- packaging/release evidence updates supported by existing scripts;
- narrow documentation of remaining public-release blockers.

Hard constraints:

- no Chrome Web Store submission work;
- no unrelated feature work;
- no new permissions;
- no multi-site work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `docs: finalize private release readiness pack`
