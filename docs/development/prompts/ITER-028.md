# Prompt: ITER-028 Dashboard Storage And Release Audit Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-14-second-audit-closure.md`
4. `docs/development/iterations/ITER-028-dashboard-storage-and-release-audit-hardening.md`
5. `docs/development/ITER-027-triage-report.md`
6. relevant current implementations and tests

Task: implement the confirmed `ITER-028` hardening fixes only.

Allowed scope:

- fix dashboard storage listener API usage;
- add/adjust tests needed for that fix;
- add `verify` and `test:release` scripts;
- make generated release-audit tests hard-fail in release mode when build output is missing.

Hard constraints:

- do not implement passive HH status integration;
- do not redesign dashboard architecture beyond the confirmed fix;
- do not mix in side panel context work;
- keep changes narrow and test-backed.

Required outcomes:

1. `chrome.storage.local.onChanged` replaced with `chrome.storage.onChanged`;
2. listener filtered by `areaName === "local"`;
3. static/safety coverage prevents regression;
4. `package.json` contains `verify` and `test:release`;
5. generated manifest/bundle safety tests hard-fail in release mode when `.output` is absent.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: correct dashboard storage listener and add release audit scripts`
