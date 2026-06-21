# Prompt: ITER-061 AI Budget Preview Controls

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-31-ai-assist-quality-and-trust.md`
4. `docs/development/iterations/ITER-061-ai-budget-preview-controls.md`

Task: add practical token/cost preview and local request-budget controls to the AI flows.

Allowed scope:

- request-size/token preview logic;
- approximate cost preview or explicit unavailable state;
- local daily request-budget settings and enforcement;
- focused tests for preview/budget behavior.

Hard constraints:

- no server metering;
- no billing integration;
- no speculative pricing service;
- no new provider architecture.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: add ai budget preview controls`
