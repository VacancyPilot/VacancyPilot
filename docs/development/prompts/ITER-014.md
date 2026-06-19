# Prompt: ITER-014 n8n Events

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 14, 19.4, 26.5
3. `docs/development/epics/EPIC-09-n8n-and-telegram-events.md`
4. `docs/development/iterations/ITER-014-n8n-events.md`

Task: implement opt-in n8n webhook events with safe payloads, local configuration, HMAC support, and retry/event logging.

Allowed scope:

- n8n settings model and UI;
- webhook URL validation;
- payload builder and payload preview;
- background/service-layer webhook delivery;
- HMAC signing;
- retry queue and retry controls;
- event log integration;
- tests for safe payload shape, disabled-by-default behavior, and retry/error flows;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- n8n must remain off by default;
- no content script `fetch` to n8n or any external host;
- no full resume text or full cover letter payload by default;
- no API keys or secrets in logs, export, or IndexedDB business tables;
- no broad host permissions unless strictly required and explicitly justified;
- no developer telemetry.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `feat: add opt in n8n events`
