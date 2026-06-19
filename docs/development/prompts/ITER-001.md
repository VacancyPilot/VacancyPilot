# Prompt: ITER-001 WXT Scaffold

You are working in the VacancyPilot repository.

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-00-foundation-and-tooling.md`
4. `docs/development/iterations/ITER-001-wxt-scaffold.md`

Task: scaffold the initial WXT + React + TypeScript extension foundation.

Allowed scope:

- package files;
- WXT config;
- TypeScript config;
- minimal source folders and entrypoints;
- placeholder popup/sidepanel/options UI;
- README command update if needed.

Hard constraints:

- no HH parser implementation;
- no AI;
- no n8n;
- no broad permissions;
- no `<all_urls>`, `cookies`, `webRequest`, `nativeMessaging`;
- content scripts must be read-only placeholders.

Validation:

```text
pnpm install
pnpm build
```

Expected commit message: `chore: scaffold extension foundation`

