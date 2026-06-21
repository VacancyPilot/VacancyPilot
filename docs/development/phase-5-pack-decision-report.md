# Phase 5 Pack Decision Report

Date: `2026-06-21`

Purpose: define the next implementation sequence after the post-audit reliability/scoring pack without mixing narrow security cleanup, product AI work, and later public-release/multi-site backlog.

## Decision Summary

Proceed in two layers:

1. a one-iteration pre-pack to close the last moderate dependency alert;
2. a larger product/trust pack centered on AI workflow quality and private release readiness.

This keeps the repo clean before new feature work, while still moving the product toward real private usage rather than prematurely branching into public-store or multi-site work.

## Do Now

### 1. Final security tail closure

Status: `do now`

Iteration:

- `ITER-059`

Reason:

- one moderate Dependabot alert remains open for transitive `uuid`;
- the path is narrow and should be handled separately from product work;
- this gives the next pack a cleaner baseline.

### 2. AI assist quality and trust

Status: `do now`

Iterations:

- `ITER-060`
- `ITER-061`
- `ITER-062`

Reason:

- the product already has opt-in AI and letter workflows;
- the next highest-value improvement is trustworthiness, not breadth;
- settings lifecycle, budget visibility, and letter-review quality align directly with the specification and local-first posture.

### 3. Private release readiness

Status: `do now`

Iterations:

- `ITER-063`
- `ITER-064`

Reason:

- the extension is already useful enough for disciplined private installs;
- onboarding, permission disclosure, and release-trust docs should match the implemented runtime before any public launch work.

## Keep Deferred

### n8n reopening

Status: `deferred`

Reason:

- still gated by permission/model decisions;
- not necessary for the next private-value milestone.

### Multi-site expansion

Status: `backlog`

Reason:

- adds surface area faster than it adds trust;
- better started after private-release posture is stronger.

### Public store submission

Status: `backlog`

Reason:

- store packaging, legal text, and public review preparation should follow a tighter private-release pass;
- doing it now would create process work before the trust surfaces are complete.

## Final Scope Decision

Next Zed sequence:

1. `ITER-059`
2. `ITER-060`
3. `ITER-061`
4. `ITER-062`
5. `ITER-063`
6. `ITER-064`

Run one row at a time. Keep `ITER-014` and `ITER-043` deferred unless the `n8n` permission decision is explicitly reopened.
