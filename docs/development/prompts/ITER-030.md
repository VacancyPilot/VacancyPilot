# Prompt: ITER-030 Passive Status And Side Panel Context

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-14-second-audit-closure.md`
4. `docs/development/iterations/ITER-030-passive-status-and-sidepanel-context.md`
5. `docs/development/ITER-027-triage-report.md`
6. relevant current implementations and tests

Task: implement the confirmed `ITER-030` hardening fixes only.

Allowed scope:

- wire passive HH status extraction into the runtime vacancy extraction path;
- surface passive status as informational hints only;
- replace side-panel active-tab guessing with explicit background-managed context;
- add focused tests for the new runtime/context behavior.

Hard constraints:

- do not auto-change saved job status based on passive HH labels;
- do not expand into search-page work;
- do not perform broader UI redesign.

Required outcomes:

1. extraction runtime can return passive HH status metadata;
2. side panel resolves vacancy context from explicit background state/message flow;
3. UI copy stays informational and read-only;
4. tests cover passive-status delivery and explicit context handling.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: integrate passive HH status parser and fix side panel context`
