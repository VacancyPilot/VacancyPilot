# Prompt: ITER-045 Reply Draft And Follow-Up Workspace

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-23-hr-communication-hub.md`
4. `docs/development/iterations/ITER-045-reply-draft-and-follow-up-workspace.md`

Task: build the local HR workspace so the user can review HR timeline context, plan follow-up, and prepare manual replies without the extension acting on HH.

Allowed scope:

- dashboard or application-level HR timeline UI;
- follow-up planning controls wired to local state;
- reply draft workspace with copy-only flow;
- local notes / next-step capture;
- focused tests for workspace state and no-auto-send boundaries.

Hard constraints:

- no DOM writes into HH chat or message fields;
- no background notification delivery;
- no hidden communication capture;
- no `n8n` reopening in this iteration;
- no broad permissions.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add hr follow up workspace`
