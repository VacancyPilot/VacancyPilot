# EPIC-35: Runtime Stabilization And Surface Hardening

## Goal

Close the narrow set of runtime and layout defects discovered after the UI/UX polish pass, without reopening architecture, permissions, or product-scope decisions.

## Inputs

- `docs/Техническое заданиеV.1.md`
- current repository state after `EPIC-34`
- manual QA screenshots and defect notes for popup, side panel, page badge, and dashboard/options narrow layouts

## In Scope

- popup-to-side-panel runtime reliability;
- background boot/runtime warning cleanup;
- popup density and page-badge placement polish;
- dashboard/options responsive cleanup and nested-scroll reduction;
- focused tests and manual QA notes for these surfaces.

## Explicitly Deferred

- new product features or workflow expansion;
- permission changes or host-permission expansion;
- hidden HH fetches, HH form writes, or HH auto-click behavior;
- branch/PR choreography inside autopilot prompts;
- broad design-system or architectural rewrites.

## Success Criteria

- popup side-panel opening is reliable and does not depend on a background user-gesture hop;
- background startup no longer emits the known async warning;
- popup and page badge are clearer under real extension-size constraints;
- dashboard/options narrow layouts are usable without stacked scroll traps;
- all fixes stay inside the current safety envelope.
