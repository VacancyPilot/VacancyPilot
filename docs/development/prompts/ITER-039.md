# Prompt: ITER-039 Labs Control Plane And Action Log

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-22-guided-apply-labs.md`
4. `docs/development/iterations/ITER-039-labs-control-plane-and-action-log.md`

Task: implement the Labs safety control plane before guided-apply workflow code is added.

Allowed scope:

- Labs master toggle and guided-apply toggle;
- kill switch and daily action budget;
- local Labs action log model / UI entry point;
- focused tests for default-off and gating behavior.

Hard constraints:

- no guided-apply field workflow yet;
- no DOM writes to HH forms;
- no webhook delivery;
- no new broad permissions.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add labs safety controls`
