# EPIC-33: UI Foundation And Surface Consistency

## Goal

Raise the visual and structural quality floor of VacancyPilot by introducing a consistent UI foundation across popup, side panel, dashboard, and trust surfaces without changing product boundaries.

## Inputs

- `docs/Техническое заданиеV.1.md`
- current repository state after `EPIC-31`
- existing runtime surfaces in `entrypoints/` and `src/components/`

## In Scope

- shared UI tokens, primitive styles, and recurring layout patterns;
- shell consistency across popup, side panel, dashboard, onboarding, and disclosure surfaces;
- consistent empty/loading/error states and density rules;
- responsive polish for narrow extension widths and side panel layouts;
- focused tests or screenshots where practical for risky UI regressions.

## Explicitly Deferred

- product-feature expansion;
- dark mode redesign as a separate theme system;
- full design-system extraction into a large framework;
- multi-site UI work;
- public-marketing landing pages.

## Success Criteria

- the extension reads as one coherent product instead of several isolated surfaces;
- narrow-width extension surfaces become more readable and less fragile;
- repeated UI states behave consistently across runtime areas;
- the pack stays implementation-focused and avoids broad UI rewrites.
