# Prompt: ITER-025 Privacy And Profile Lifecycle Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-13-confirmed-audit-fixes.md`
4. `docs/development/iterations/ITER-025-privacy-and-profile-lifecycle-hardening.md`
5. `docs/development/ITER-022-triage-report.md`

Task: close the confirmed cover-letter privacy gap and clean broken profile/resume references left by delete flows.

Allowed scope:

- cover-letter input privacy rules;
- profile/resume delete cleanup across local entities;
- salary input validation guard;
- focused tests for privacy and lifecycle cleanup.

Hard constraints:

- no parser hardening;
- no dashboard refresh work;
- no public-release asset work;
- no n8n work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `fix: close privacy gap and clean profile lifecycle refs`
