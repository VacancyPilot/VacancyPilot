# Prompt: ITER-021 Runtime QA Fixes

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 22.4 and 27
3. `docs/development/epics/EPIC-11-runtime-workflow-completion.md`
4. `docs/development/iterations/ITER-021-runtime-qa-fixes.md`
5. `docs/development/manual-qa-run-2026-06-20.md`
6. latest rerun notes, if they exist

Task: fix the concrete runtime defects found in installed-extension manual QA and prepare a rerun-ready build.

Allowed scope:

- targeted bug fixes tied to QA findings;
- focused runtime/browser fixes;
- QA artifact updates;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- no new feature expansion;
- no n8n implementation;
- no broad refactor unrelated to QA findings.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: address runtime qa findings`
