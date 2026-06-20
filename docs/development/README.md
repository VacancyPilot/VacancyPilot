# Development Pack

This folder turns the final specification into implementable work units for Codex/Cursor.

Read in order:

1. `00-product-development-plan.md`
2. `01-epics.md`
3. `02-iteration-map.md`
4. `03-autopilot-workflow.md`
5. `04-zed-deepseek-workflow.md`, if using Zed
6. target file in `epics/`
7. target file in `iterations/`
8. matching prompt in `prompts/`

## Start Here

Current implementation status:

```text
ITER-031 complete
phase 1 code and hardening complete on 2026-06-20
phase 2 pack prepared on 2026-06-20
```

Recommended next action:

```text
Phase 1 closeout gate:
1. Run docs/development/phase-2-start-gate.md
2. Then run ITER-032
3. Then start ITER-033
```

For Zed, paste `docs/development/prompts/ZED-SESSION-START.md` once before the first iteration prompt.

If Zed reports residual risks after an iteration, use:

```text
docs/development/prompts/RISK-CLOSURE.md
```

Run it in the same Zed chat before asking Codex to review.

Remaining implementation prompt, if webhook automation returns to scope later:

```text
ITER-014: n8n Events
Prompt: docs/development/prompts/ITER-014.md
```

Manual QA and audit inputs driving the next pack:

```text
docs/development/manual-qa-run-2026-06-20.md
docs/development/ITER-022-triage-report.md
docs/development/ITER-027-triage-report.md
docs/development/phase-2-start-gate.md
```

## Status

The first post-signoff hardening pack is complete. The second audit follow-up fix pack (`ITER-028`..`ITER-031`) is also complete. A full Phase 2 pack is now prepared, but the start gate remains explicit: manual Chrome/Edge verification plus GitHub checks review before implementation opens with `ITER-033`. The master specification remains frozen unless a change affects product boundaries, permissions, data model, or external data flows.
