# Prompt: ITER-031 Profile Lifecycle And Company Identity Hardening

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-14-second-audit-closure.md`
4. `docs/development/iterations/ITER-031-profile-lifecycle-and-company-identity-hardening.md`
5. `docs/development/ITER-027-triage-report.md`
6. relevant current implementations and tests

Task: implement the confirmed `ITER-031` hardening fixes only.

Allowed scope:

- make `CoverLetter.profileId` nullable/optional coherently;
- stop writing empty-string orphan profile IDs;
- parse/store employer identity from HH vacancy pages when available;
- add explicit automated coverage for profile-selection recompute refresh flow.

Hard constraints:

- do not redesign destructive-delete UX beyond the confirmed model/lifecycle cleanup;
- do not attempt a full global identity system redesign;
- do not mix in unrelated Phase 2 work.

Required outcomes:

1. cover letters no longer use `\"\"` as a missing profile marker;
2. employer/source company identity is stronger than pure company-name slug when HH provides it;
3. automated coverage exists for the recompute-refresh path highlighted in triage.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `fix: make coverLetter profileId nullable, parse employer ID, verify recompute UX`
