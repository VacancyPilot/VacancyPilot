# Prompt: ITER-073 Onboarding And About Role Separation

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/vacancypilot_runtime_visual_consistency_audit_2026-06-21.md`
4. `docs/development/epics/EPIC-36-runtime-visual-consistency-consolidation.md`
5. `docs/development/iterations/ITER-073-onboarding-about-role-separation.md`

Task: separate the roles of About and Onboarding so the product explains itself once, clearly, and in the right place.

Allowed scope:

- About surface reduction into concise product identity/version/status;
- Onboarding rework into a step-oriented first-run guidance flow;
- shared trust/safety summary extraction only if it removes real duplication;
- text-structure and readability cleanup while preserving safety accuracy.

Hard constraints:

- no new permissions or product-scope changes;
- no public-release/store copy work;
- no AI/provider feature expansion;
- no telemetry or backend work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `refactor: separate onboarding and about surfaces`
