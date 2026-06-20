# EPIC-28: Security Alert Closure

## Goal

Reduce or close the remaining non-critical GitHub security alerts using narrow, auditable follow-up iterations instead of broad unsupervised dependency churn.

## Inputs

- `docs/Техническое заданиеV.1.md` sections `3.8`, `20`, `22.7`, `23.4`
- `AGENTS.md`
- current repository state after `EPIC-27`
- GitHub issue `#10`
- current GitHub Security / Dependabot alert inventory on `main`

## In Scope

- exact inventory of remaining alerts and dependency chains;
- transitive alert fixes that can be closed with safe overrides or minimal updates;
- toolchain-linked alert fixes that need coordinated dependency movement;
- explicit documentation for any alerts that remain blocked by upstream constraints;
- validation through the existing quality and release-safety commands.

## Explicitly Deferred

- Labs or Phase 3 product features;
- public-release hardening;
- n8n reopening;
- unrelated framework churn outside the alert closure path;
- speculative refactors not required to fix a concrete alert.

## Success Criteria

- remaining alerts are no longer treated as an undifferentiated backlog number;
- each alert is either fixed, intentionally deferred with rationale, or mapped to a blocked upstream path;
- the repository preserves current safety boundaries while reducing security backlog.
