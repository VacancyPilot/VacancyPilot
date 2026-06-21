# Prompt: ITER-062 Letter Quality Guardrails

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-31-ai-assist-quality-and-trust.md`
4. `docs/development/iterations/ITER-062-letter-quality-guardrails.md`

Task: add cover-letter quality guardrails, draft provenance, and safer review states.

Allowed scope:

- letter quality warnings and constraint checks;
- draft provenance markers such as generated/edited/final;
- focused review-flow UX improvements around copy/save final;
- compatibility updates required by `ITER-060` and `ITER-061`;
- focused tests for the new states.

Hard constraints:

- no remote moderation service;
- no semantic scoring rewrite;
- no broad editor redesign;
- no public-release work.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Expected commit message: `feat: add letter quality guardrails`
