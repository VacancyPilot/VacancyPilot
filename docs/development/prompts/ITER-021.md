# Prompt: ITER-021 Runtime QA Fixes

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 22.4 and 27
3. `docs/development/epics/EPIC-11-runtime-workflow-completion.md`
4. `docs/development/iterations/ITER-021-runtime-qa-fixes.md`
5. `docs/development/manual-qa-run-2026-06-20.md`
6. latest rerun notes, if they exist
7. current implementations of:
   - `entrypoints/popup/App.tsx`
   - `entrypoints/sidepanel/App.tsx`
   - `entrypoints/vacancy.content.ts`
   - `entrypoints/options/App.tsx`

Task: verify which manual-QA defects are still real after ITER-017..ITER-020, fix only the remaining concrete runtime defects, and prepare a rerun-ready build plus updated QA evidence.

Allowed scope:

- targeted bug fixes tied to QA findings or rerun evidence;
- focused popup / side panel / content-badge / dashboard runtime fixes;
- small test additions for any new runtime logic or bugfix path where practical;
- QA artifact updates and rerun prep notes;
- status doc updates only if the iteration is fully complete.

Hard constraints:

- do not re-implement work already delivered in ITER-017, ITER-018, ITER-019, or ITER-020;
- first compare the old QA failures against the current code and current runtime behavior;
- if a previously reported issue is already fixed by existing code, do not rewrite that area just because it was once in the QA log;
- no new feature expansion;
- no n8n implementation;
- no broad refactor unrelated to QA findings.

Execution expectations:

- treat `docs/development/manual-qa-run-2026-06-20.md` as the baseline defect source, not as proof that those bugs still exist now;
- prioritize true remaining blockers in the real installed-extension flow:
  - popup `Save` / `Reject` runtime behavior;
  - score and status visibility in popup and side panel;
  - content badge state, persistence, and click/open behavior;
  - consistency between popup, side panel, and dashboard after state changes;
  - vacancy context refresh after profile / resume / status changes;
- if manual QA evidence shows that earlier blockers are resolved, shift effort to:
  - narrow follow-up fixes discovered during rerun;
  - updating QA notes/checklists with pass/fail deltas;
  - documenting any residual blockers precisely enough for a next single iteration.

Expected outputs:

- code changes only where a current defect still exists;
- updated QA notes with what was retested and what passed/failed now;
- explicit residual blockers, if any, with concrete reproduction notes;
- no vague "runtime still needs work" summary without evidence.

Validation:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Manual verification target after implementation:

```text
1. Open HH vacancy page in Chrome.
2. Confirm badge renders meaningful state and click opens side panel.
3. Save vacancy from popup and confirm score/status update.
4. Change profile/resume context and confirm side panel reflects it.
5. Confirm dashboard shows the same saved vacancy state.
6. Repeat critical flow in Edge if rerun scope includes second browser.
```

Expected commit message: `fix: address runtime qa findings`
