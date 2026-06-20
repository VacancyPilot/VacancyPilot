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
ITER-030 complete
passive status integration and explicit side panel context completed on 2026-06-20
```

Recommended next action:

```text
ITER-031: Profile Lifecycle And Company Identity Hardening
Prompt: docs/development/prompts/ITER-031.md
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
```

## Status

The first post-signoff hardening pack is complete. The second audit has been triaged into a narrow follow-up fix pack (`ITER-028`..`ITER-031`) before any Phase 2 start decision. The master specification remains frozen unless a change affects product boundaries, permissions, data model, or external data flows.
