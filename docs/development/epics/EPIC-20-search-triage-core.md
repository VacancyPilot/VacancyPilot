# EPIC-20: Search Triage Core

## Goal

Implement the Phase 2 search-surface MVP for HH search results: lightweight card parsing, compact badges, and local quick actions without background vacancy opening or hidden fetches.

## Inputs

- `docs/Техническое заданиеV.1.md` sections `5.5`, `Phase 2`, `17.6`, `24.2`
- current repository state after Phase 1 closeout gate

## In Scope

- search-page content script for `hh.ru/search/vacancy*`;
- search-card extraction from already visible DOM only;
- compact search badges with score/status/work-mode hints;
- local quick save/reject actions;
- synchronization with existing local DB and badge state;
- dynamic-list resilience and search-surface safety tests.

## Explicitly Deferred

- local queue task list;
- stronger dashboard workflows;
- company greylist;
- duplicate detection;
- background opening of vacancy pages;
- hidden full-vacancy fetches;
- heavy per-card React mounts.

## Success Criteria

- search cards can show lightweight, safe triage hints;
- quick actions affect only local data;
- the feature works on dynamic HH result pages;
- the search surface remains read-first and policy-safe.
