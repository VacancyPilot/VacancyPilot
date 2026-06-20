# EPIC-11: Runtime Workflow Completion

## Goal

Turn the current installed extension shell into a working local MVP flow in real browsers by wiring the existing parser, tracker, scoring, popup, side panel, and dashboard together.

## Why This Epic Exists

Manual QA on 2026-06-20 in Chrome and Edge showed that the extension installs and opens, but the core runtime flow is incomplete:

- vacancy badge is visible but empty/non-interactive;
- popup detects vacancy pages but `Save` / `Reject` do not work;
- score and status stay as placeholders;
- dashboard opens, but remains mostly shell/empty-state driven;
- Phase 1 value is not yet delivered end-to-end in real browser usage.

This epic closes the gap between "implemented modules exist" and "the user can actually use the extension productively".

## Scope

- Wire popup actions to real local tracker operations.
- Show real saved state / score / status in popup and side panel.
- Replace key dashboard empty states with real data views.
- Add profile/resume management needed for actual scoring and cover-letter use.
- Ensure side panel, popup, and dashboard read the same local state.
- Run targeted manual QA follow-up and fix runtime defects found there.

## Non-Goals

- No n8n/webhook implementation in this epic.
- No new browser permissions.
- No HH auto-fill, no synthetic events, no auto-clicks.
- No broad UI redesign or aesthetic rewrite.
- No public-release packaging work.

## Acceptance Criteria

- A user can save a vacancy from popup or side panel and see it in the dashboard.
- A user can reject/update status and see the result reflected consistently across surfaces.
- Popup no longer shows placeholder-only score/status for saved vacancies.
- Dashboard shows real tracked vacancies instead of only empty states.
- Profile/resume selection needed for scoring/letters is usable.
- Manual QA rerun in Chrome shows the previously failed core checks passing.

## Safety Notes

This epic must preserve all existing safety boundaries:

- no hidden HH network calls;
- no programmatic writes to HH forms;
- no auto-submit or auto-click on HH controls;
- no new broad permissions;
- AI and n8n remain opt-in only.
