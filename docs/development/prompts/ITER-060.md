# Prompt: ITER-060 AI Settings Lifecycle Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-31-ai-assist-quality-and-trust.md`
4. `docs/development/iterations/ITER-060-ai-settings-lifecycle-hardening.md`

Task: harden AI settings and local API-key lifecycle behavior without adding sync or backend storage.

Allowed scope:

- AI settings persistence/reset flows;
- local API-key handling UX and warnings;
- focused empty/error/saved states;
- focused tests for settings lifecycle behavior.

Hard constraints:

- no backend vault;
- no sync storage;
- no new provider architecture;
- no `n8n` or public-release work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: harden ai settings lifecycle`
