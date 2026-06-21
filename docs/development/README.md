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
ITER-059 complete
phase 1 code, hardening, and closeout gate complete on 2026-06-20
phase 2 pack complete on 2026-06-20
phase 3 workflow-assist pack complete on 2026-06-20
dependency/toolchain maintenance pack complete on 2026-06-20
security-alert closure pack complete on 2026-06-21
phase 4 hr communication hub complete on 2026-06-21
post-audit reliability and scoring pack complete on 2026-06-21
final security tail closure complete on 2026-06-21
next active sequence: AI/release-trust
```

Recommended next action:

```text
1. Review docs/development/00-product-development-plan.md
2. Start ITER-060
3. Continue through ITER-061, ITER-062, ITER-063, and ITER-064 one row at a time
4. Keep ITER-043 deferred until the n8n permission model is explicitly reopened
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

The first post-signoff hardening pack is complete. The second audit follow-up fix pack (`ITER-028`..`ITER-031`) is also complete. `ITER-032` closed the manual/infrastructure gate, Phase 2 implementation ran through `ITER-038`, the workflow-assist/Labs pack ran through `ITER-042`, the dependency/toolchain maintenance pack ran through `ITER-050`, the security-alert closure pack ran through `ITER-054`, the HR communication pack ran through `ITER-045`, the post-audit reliability/scoring pack ran through `ITER-058`, and the final security tail closure landed through `ITER-059`. The next active sequence is the AI/release-trust pack (`ITER-060`..`ITER-064`). The master specification remains frozen unless a change affects product boundaries, permissions, data model, or external data flows.
