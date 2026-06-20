# Prompt: ITER-022 Audit Confirmation And Triage

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-12-post-signoff-audit-hardening.md`
4. `docs/development/iterations/ITER-022-audit-confirmation-and-triage.md`
5. `docs/vacancypilot_deep_repo_audit_2026-06-20.md`
6. current implementations referenced by the audit

Task: review the external deep audit against the current repository, confirm or refute each meaningful finding, and produce a final triaged report plus a proposed fix-iteration breakdown for confirmed issues only.

Allowed scope:

- docs-only audit confirmation and triage work;
- code reading, documentation review, and validation against current repo state;
- creation of a final triage report under `docs/development/`;
- proposed future iteration breakdown for confirmed problems.

Hard constraints:

- do not implement production fixes in this iteration;
- do not accept every audit claim at face value;
- do not dismiss findings without explicit reasoning;
- do not introduce new product scope;
- no n8n work;
- no public-release marketing/store work.

Required output structure:

For each meaningful audit finding, classify it as:

- `confirmed`
- `partially confirmed`
- `not confirmed in current repo state`
- `deferred / out of current scope`

Then provide:

1. a short executive summary;
2. a table of triaged findings;
3. a recommended fix order;
4. a proposed next iteration list with commit-message suggestions.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected commit message: `docs: triage external audit findings`
