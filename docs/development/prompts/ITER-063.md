# Prompt: ITER-063 Onboarding And Permission Disclosure

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-32-private-release-readiness.md`
4. `docs/development/iterations/ITER-063-onboarding-permission-disclosure.md`

Task: complete the onboarding, permission explanation, and privacy disclosure surfaces needed for disciplined private installs.

Allowed scope:

- onboarding/settings/privacy disclosure gaps;
- permission explanation aligned to the real manifest;
- focused UX/tests/docs needed for those surfaces;
- narrow release-safety updates if directly affected.

Hard constraints:

- no new permissions;
- no public-store copy pack;
- no legal-policy finalization project;
- no multi-site work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: complete onboarding and permission disclosure`
