# EPIC-22: Guided Apply Labs

## Goal

Add the first safe Labs layer for guided apply without turning the extension into an auto-apply tool.

## Inputs

- `docs/Техническое заданиеV.1.md` sections `3.7`, `5.6`, `Phase 4`, `19.7`, `24.3`
- current repository state after `EPIC-21`

## In Scope

- Labs master toggle and kill switch;
- guided-apply toggle and daily action budget;
- local Labs action log;
- clipboard-only guided-apply workspace;
- resume recommendation using existing local data and `hhResumeId`;
- field guidance / highlighting hints without DOM value mutation;
- focused tests for Labs gating and workflow safety.

## Explicitly Deferred

- auto-submit;
- programmatic writes to HH form fields;
- synthetic DOM input events;
- hidden background tabs or vacancy opening;
- HR chat workflows;
- external webhook delivery.

## Success Criteria

- Labs features stay off by default and can be disabled centrally;
- guided apply remains user-assisted, visible, and reversible;
- no unsafe HH automation is introduced.
