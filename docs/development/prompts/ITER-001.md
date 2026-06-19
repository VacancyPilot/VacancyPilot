# Prompt: ITER-001 WXT Scaffold

You are working in the VacancyPilot repository.

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-00-foundation-and-tooling.md`
4. `docs/development/iterations/ITER-001-wxt-scaffold.md`

Task: scaffold the initial WXT + React + TypeScript extension foundation.

Execution mode:

- Make the code changes directly in the repository.
- Run validation commands if the environment allows.
- Do not commit or push.
- Do not continue to ITER-002.
- If WXT generator prompts are interactive, choose React + TypeScript + Manifest V3-compatible defaults, or scaffold equivalent files manually.
- If `pnpm` is unavailable, try enabling it through Corepack if available; otherwise report the exact blocker.

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

Final response must include:

- files changed;
- commands run;
- validation result;
- generated manifest permissions;
- any blockers;
- suggested commit message.
