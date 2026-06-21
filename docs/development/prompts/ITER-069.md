# Prompt: ITER-069 Side Panel Runtime Stabilization

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-35-runtime-stabilization-and-surface-hardening.md`
4. `docs/development/iterations/ITER-069-side-panel-runtime-stabilization.md`

Task: fix the popup-to-side-panel runtime opening bug and the background startup synchronization warning without expanding permissions or changing product scope.

Allowed scope:

- synchronous background listener registration and async boot extraction;
- split side-panel context persistence from side-panel opening;
- popup-direct side-panel open flow from a valid user gesture path;
- short retry/fallback logic for side-panel context loading;
- focused side-panel runtime tests and release-safety checks;
- manual QA notes for the runtime fix.

Hard constraints:

- no dashboard/options redesign;
- no `tabs` permission;
- no new host permissions;
- no hidden HH fetch/XHR;
- no HH auto-click or form-write behavior;
- no PR/branch management inside this run.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: stabilize side panel open flow`
