# Prompt: ITER-019 Profile And Resume Management

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 8, 10, 11, 22.4
3. `docs/development/epics/EPIC-11-runtime-workflow-completion.md`
4. `docs/development/iterations/ITER-019-profile-resume-management.md`

Task: implement practical local profile/resume management needed for scoring and cover-letter workflows.

Allowed scope:

- profile/resume UI and persistence;
- minimal validation and selection flow;
- focused tests;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- no remote resume import;
- no AI provider implementation;
- no hidden external requests.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: add profile resume management`
