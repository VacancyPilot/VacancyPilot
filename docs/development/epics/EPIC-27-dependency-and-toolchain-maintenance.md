# EPIC-27: Dependency And Toolchain Maintenance

## Goal

Resolve the remaining post-triage dependency/toolchain backlog in a controlled way, without mixing it into product-scope Phase 3 work.

## Inputs

- `docs/Техническое заданиеV.1.md` sections `3.8`, `20`, `22.7`, `23.4`
- `AGENTS.md`
- current repository state after merged PRs `#1`, `#2`, `#3`, and `#12`
- GitHub issue `#10` and the remaining Dependabot PR triage state

## In Scope

- deliberate replacement of stale or partial Dependabot updates;
- WXT stack refresh on the currently pinned extension baseline;
- TypeScript 6 migration with explicit config cleanup;
- coherent React stack alignment only as a full-stack decision;
- validation through existing CI/release-safety commands.

## Explicitly Deferred

- Labs and guided-apply implementation;
- n8n reopening;
- public-release work;
- HR workspace features;
- broad dependency churn outside the named maintenance targets.

## Success Criteria

- no open ambiguous dependency PRs remain as the active plan of record;
- the repository has a documented manual path for WXT, TypeScript, and React alignment;
- maintenance work does not weaken extension safety boundaries or expand permissions.
