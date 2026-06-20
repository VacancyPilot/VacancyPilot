# Documentation

## Final Specification

- [Техническое заданиеV.1.md](Техническое%20заданиеV.1.md) - final baseline for Phase 0 / Phase 1 development.

## Audit Inputs

The `search/` folder contains recommendations and audits from other models. They are retained as source material, but the final specification is the current source of truth.

When recommendations conflict, use the priority order from the final specification:

1. read-only Core;
2. manual user actions on HH;
3. minimal permissions;
4. local-first storage;
5. explicit consent before external requests.

## Development Pack

- [development/](development/) - implementation epics, iteration map, and autopilot prompts.

Recommended next action:

- Phase 1 closeout gate is complete; start the prepared Phase 2 pack from `development/prompts/ITER-033.md`
- keep [development/prompts/ITER-014.md](development/prompts/ITER-014.md) deferred until webhook automation returns to active scope
