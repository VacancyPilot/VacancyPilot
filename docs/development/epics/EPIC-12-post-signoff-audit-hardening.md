# EPIC-12: Post-Signoff Audit Hardening

## Goal

Use the external deep repository audit as an input to improve VacancyPilot after Phase 1 core completion, without blindly accepting every reported problem or mixing audit hardening with new product features.

## Why This Exists

After ITER-021, the core runtime loop is usable:

```text
HH vacancy -> extract -> save -> score -> badge/popup/sidepanel/dashboard sync
```

An additional external audit was produced in:

`docs/vacancypilot_deep_repo_audit_2026-06-20.md`

That report contains potentially valuable findings, but it mixes:

- real code-level bugs;
- arguable severity calls;
- product/design opinions;
- runtime concerns that require manual confirmation;
- forward-looking hardening recommendations.

The next correct move is to confirm or refute those findings first, then implement only the confirmed issues in narrow iterations.

## In Scope

- audit confirmation and triage;
- reproducing findings from code and current docs;
- separating confirmed defects from disputed or already-fixed claims;
- producing a prioritized hardening backlog;
- implementing confirmed hardening work in later narrowly scoped iterations.

## Out Of Scope

- n8n implementation;
- new AI provider implementation;
- search badges, guided apply, HR workflows;
- broad refactors not justified by confirmed issues;
- public-release marketing/store work unless a later iteration explicitly targets it.

## Success Criteria

- Each audit finding is classified as one of:
  - confirmed;
  - partially confirmed;
  - not reproducible/currently unconfirmed;
  - out of current scope;
- confirmed issues are grouped into fixable batches with clear acceptance criteria;
- the team has a documented post-signoff hardening path before Phase 2 feature work starts.
