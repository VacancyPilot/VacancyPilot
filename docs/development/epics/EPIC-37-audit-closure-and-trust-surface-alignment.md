# EPIC-37: Audit Closure And Trust Surface Alignment

## Goal

Close the non-duplicated repo-local findings from the 2026-06-22 full audit without reopening the runtime/UI work that is already prepared elsewhere.

## Inputs

- `docs/Техническое заданиеV.1.md`
- `docs/development/audit-2026-06-22-decision-report.md`
- current repository state after `EPIC-35` and `EPIC-36` planning
- existing Sonar workflow/docs and HR timeline data model

## In Scope

- advisory Sonar coverage baseline inside the repository;
- explicit documentation of what remains external/manual in Sonar and repo-policy setup;
- safer HR timeline storage/export trust boundaries;
- final closure reporting for the 2026-06-22 audit.

## Explicitly Deferred

- no duplicate runtime/UI implementation already mapped to `EPIC-35` or `EPIC-36`;
- no guessing of SonarCloud org/project keys;
- no branch protection or repository policy flips that require an explicit maintainer decision;
- no n8n permission reopening;
- no product-scope expansion, telemetry, backend, hidden HH fetches, HH form writes, or auto-click behavior.

## Success Criteria

- the audit no longer exists only as a broad chat artifact and instead has a disciplined implementation path;
- Sonar gains better local signal quality without pretending external identity decisions are solved;
- HR timeline carries a tighter trust surface for local storage and export;
- the repo keeps one coherent iteration map instead of parallel duplicate fix packs.
