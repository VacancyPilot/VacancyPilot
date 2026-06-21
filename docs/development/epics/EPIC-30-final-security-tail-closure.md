# EPIC-30: Final Security Tail Closure

## Goal

Close the remaining moderate GitHub dependency alert with the smallest safe change, without reopening broad dependency churn or unrelated product work.

## Inputs

- `docs/Техническое заданиеV.1.md`
- current repository state after `EPIC-29`
- current GitHub Dependabot alert for transitive `uuid`

## In Scope

- identify the exact transitive path that keeps the alert open;
- prefer a minimal package bump, override, or lockfile refresh that clears the advisory safely;
- rerun local audit and project verification;
- document the final security-tail posture if any non-actionable residue remains.

## Explicitly Deferred

- product-feature work;
- large WXT/toolchain refresh beyond what the alert strictly needs;
- store/public release work;
- `n8n` reopening;
- multi-site expansion.

## Success Criteria

- the `uuid` advisory path is either closed or reduced to a well-documented external blocker;
- local validation remains green;
- the change does not widen permissions or alter product boundaries.
