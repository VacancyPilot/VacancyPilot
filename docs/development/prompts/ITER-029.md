# Prompt: ITER-029 Badge State, Experience, And Passive Status Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-14-second-audit-closure.md`
4. `docs/development/iterations/ITER-029-badge-state-experience-and-passive-status-hardening.md`
5. `docs/development/ITER-027-triage-report.md`
6. relevant current implementations and tests

Task: implement the confirmed `ITER-029` hardening fixes only.

Allowed scope:

- centralize badge-state helpers into a shared module;
- refactor existing callers to use the shared module;
- parse `experienceRaw` into `experienceMinYears`;
- tighten passive-status regexes;
- add targeted tests/fixtures for confirmed false-positive and positive cases.

Hard constraints:

- do not integrate passive status into popup/side panel UI yet;
- do not redesign tracker architecture beyond the confirmed parser fix;
- do not mix in side panel context work.

Required outcomes:

1. duplicated badge helper logic removed from runtime call sites;
2. supported RU/EN experience strings map to numeric minimum years;
3. CTA-only `Откликнуться` does not set `detectedApplied`;
4. true applied labels still parse correctly.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: dedup badge helpers, add experience parser, tighten passive status regex`
