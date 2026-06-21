# EPIC-29: Post-Audit Reliability And Scoring

## Goal

Close the confirmed post-audit reliability gaps that affect local data trust and score quality, without broadening permissions or reopening deferred infrastructure/product areas.

## Inputs

- `docs/Техническое заданиеV.1.md`
- `docs/development/audit-2026-06-21-decision-report.md`
- current repository state after `EPIC-23`

## In Scope

- current-schema source-of-truth for table lifecycle helpers;
- export/delete/count correctness for all live local stores, including HR timeline data;
- safe migration boot wiring and migration regression proof;
- focused runtime QA matrix/docs for vacancy, search, HR, export/delete, and Edge behavior;
- profile-model enrichment for experience and seniority;
- scoring calibration that uses the new profile fields with explainable reasons and risk flags.

## Explicitly Deferred

- `n8n` reopening;
- SonarCloud org/project alignment;
- Dependency Review policy changes;
- design-system/i18n rewrite;
- JSON import/restore;
- AI provider gateway hardening;
- broad permission expansion such as `tabs`;
- public release/store packaging.

## Success Criteria

- local export/delete/count behavior reflects the actual live schema;
- no HR timeline data is orphaned by normal local data lifecycle actions;
- migration/version logic is explicitly executed and tested;
- runtime context reliability is documented without adding broad permissions;
- scoring becomes more candidate-specific through experience/seniority inputs;
- the resulting pack stays within current product boundaries and safety constraints.
