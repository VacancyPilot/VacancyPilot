# EPIC-36: Runtime Visual Consistency Consolidation

## Goal

Turn the current working runtime UI from a coherent private alpha into a more deliberate, visually consistent product surface, using the 2026-06-21 screenshot-driven audit as input without reopening product boundaries or permissions.

## Inputs

- `docs/Техническое заданиеV.1.md`
- `docs/vacancypilot_runtime_visual_consistency_audit_2026-06-21.md`
- current repository state after `EPIC-35`
- existing runtime screenshots and manual observations already captured by the user

## In Scope

- popup shell stability and first-impression layout;
- page-badge placement/behavior refinement inside the current safe model;
- About vs Onboarding role separation and shared trust/safety messaging;
- dashboard/options shell consolidation, responsive navigation, and scroll ownership;
- empty-state, forms, disabled-state readability, and final visual consistency reporting.

## Explicitly Deferred

- no product-logic expansion;
- no new browser permissions or host permissions;
- no drag-and-drop kanban rewrite;
- no public-release/store copy work;
- no telemetry, backend, or deployment work;
- no hidden HH fetch/XHR, no HH form writes, and no auto-click behavior.

## Success Criteria

- popup, badge, dashboard, About, and Onboarding read as parts of the same product rather than separate technical screens;
- narrow and extension-sized layouts feel deliberate rather than squeezed;
- trust/safety messaging stays strong but is no longer duplicated or overly verbose;
- final UX debt is explicitly documented rather than left implicit in screenshots or comments.
