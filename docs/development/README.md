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
ITER-013 complete
```

Recommended next implementation task is:

```text
ITER-015: Release Safety Tests
Prompt: docs/development/prompts/ITER-015.md
```

For Zed, paste `docs/development/prompts/ZED-SESSION-START.md` once before the first iteration prompt.

If Zed reports residual risks after an iteration, use:

```text
docs/development/prompts/RISK-CLOSURE.md
```

Run it in the same Zed chat before asking Codex to review.

## Status

The decomposition pack is active for late Phase 1 development. The master specification remains frozen unless a change affects product boundaries, permissions, data model, or external data flows.
