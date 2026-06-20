# Manual QA Run — 2026-06-20

Source: user-reported Chrome + Edge run on build `a602b81`

## Meta

- Tester: `Izman`
- Browsers: `Chrome`, `Edge`
- Build: `a602b81`
- Result: partial pass, core runtime blockers found

## Summary

What passed:

- extension install in Chrome;
- second-browser install in Edge;
- vacancy page detection in popup;
- dashboard opens from popup.

What failed:

- vacancy badge is present but empty/non-interactive;
- popup buttons `Save`, `Reject`, `Side Panel` do not work as expected;
- `Score` and `Status` remain placeholders;
- core save/status flow is not usable in real browser runtime.

## Structured Findings

### Passed

- `setup-install`
- `setup-second-browser`
- `hh-login-states`

### Failed

- `setup-badge-sidepanel`
  - badge shows no useful state;
  - badge does not react to clicks.

- `hh-fields`
  - popup buttons `Save`, `Reject`, `Side Panel` do not work;
  - `Dashboard` button works and opens the extension dashboard/options page.

- `core-save`
  - save flow not working.

- `core-status`
  - status flow not working.

### Not Yet Covered / Deferred In This Run

- scoring verification;
- archived/applied page states;
- AI payload/preview checks;
- AI cache behavior;
- letter studio flow;
- export/delete flow;
- labs checks;
- safety boundary spot-checks beyond observed runtime behavior.

## Implications

This run confirms that Phase 1 has reached the "runtime completion" stage:

- core modules exist in the codebase;
- automated safety checks pass;
- installed-extension workflow is not yet fully wired end-to-end.

These findings are the basis for `EPIC-11: Runtime Workflow Completion`.
