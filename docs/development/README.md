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
private release readiness pack complete on 2026-06-21
next active iteration: ITER-060
```

Recommended next action:

```text
1. Review docs/development/00-product-development-plan.md
2. Start ITER-060 (AI settings lifecycle + first real BYOK provider)
3. Continue through ITER-061 and ITER-062 one row at a time for AI assist quality
4. Keep the queued UI/UX pack (`ITER-065`..`ITER-068`) ready but do not start it before the current AI row is reviewed
5. After the UI/UX pack, run the runtime stabilization follow-up pack (`ITER-069`..`ITER-071`) only if the manual screenshots/runtime defects still reproduce
6. After that, use the runtime visual consistency pack (`ITER-072`..`ITER-075`) for the remaining screenshot-driven UX cleanup
7. After the 2026-06-22 full audit, use `ITER-076`..`ITER-078` only for the non-duplicated repo-local closure items; keep the duplicated runtime/UI findings on `ITER-069`..`ITER-075`
8. Keep ITER-043 deferred until the n8n permission model is explicitly reopened
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

The first post-signoff hardening pack is complete. The second audit follow-up fix pack (`ITER-028`..`ITER-031`) is also complete. `ITER-032` closed the manual/infrastructure gate, Phase 2 implementation ran through `ITER-038`, the workflow-assist/Labs pack ran through `ITER-042`, the dependency/toolchain maintenance pack ran through `ITER-050`, the security-alert closure pack ran through `ITER-054`, the HR communication pack ran through `ITER-045`, the post-audit reliability/scoring pack ran through `ITER-058`, the final security tail closure landed through `ITER-059`, and the private release readiness pack landed through `ITER-063` and `ITER-064`. The next active iterations are `ITER-060`..`ITER-062` under `EPIC-31`. The next queued GUI/UI/UX follow-up pack is `ITER-065`..`ITER-068`. A post-polish stabilization pack is prepared as `ITER-069`..`ITER-071` under `EPIC-35` for side-panel runtime defects and responsive cleanup. A further screenshot-driven runtime visual consistency pack is prepared as `ITER-072`..`ITER-075` under `EPIC-36` for popup shell, About/Onboarding role separation, dashboard shell consolidation, and final consistency reporting. The 2026-06-22 full audit was reviewed without creating duplicate work; its non-overlapping repo-local closure items are now prepared as `ITER-076`..`ITER-078` under `EPIC-37`, while Sonar org/project identity and other external policy decisions remain explicit manual follow-ups. The master specification remains frozen unless a change affects product boundaries, permissions, data model, or external data flows.
