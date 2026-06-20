# Autopilot Prompts

Use one prompt per autopilot run. Do not combine multiple iterations in one Cursor/Codex/Zed session unless the previous iteration is already committed and the next prompt explicitly depends on it.

## Zed

For Zed with DeepSeek, paste `ZED-SESSION-START.md` once at the beginning of the AI chat, then paste the target iteration prompt.

Zed should not commit or push by default. Review, commit, and push after validation.

If Zed reports residual risks, paste `RISK-CLOSURE.md` in the same chat before returning to Codex for review.

Available prompts:

- `ZED-SESSION-START.md`
- `RISK-CLOSURE.md`
- `ITER-001.md`
- `ITER-002.md`
- `ITER-003.md`
- `ITER-004.md`
- `ITER-005.md`
- `ITER-006.md`
- `ITER-007.md`
- `ITER-008.md`
- `ITER-009.md`
- `ITER-010.md`
- `ITER-011.md`
- `ITER-012.md`
- `ITER-013.md`
- `ITER-014.md`
- `ITER-015.md`
- `ITER-016.md`
- `ITER-017.md`
- `ITER-018.md`
- `ITER-019.md`
- `ITER-020.md`
- `ITER-021.md`
- `ITER-022.md`
- `ITER-023.md`
- `ITER-024.md`
- `ITER-025.md`
- `ITER-026.md`
- `ITER-027.md`
- `ITER-028.md`
- `ITER-029.md`
- `ITER-030.md`
- `ITER-031.md`
- `ITER-032.md`
- `ITER-033.md`
- `ITER-034.md`
- `ITER-035.md`
- `ITER-036.md`
- `ITER-037.md`
- `ITER-038.md`
- `ITER-039.md`
- `ITER-040.md`
- `ITER-041.md`
- `ITER-042.md`
- `PHASE-1-SIGNOFF.md`

Recommended use after `ITER-016`:

1. Capture manual QA findings
2. Run `ITER-017.md`
3. Continue through `ITER-021.md`
4. Run `PHASE-1-SIGNOFF.md` after the runtime rerun passes
5. Run `ITER-022.md` before starting any post-signoff hardening fixes
6. Run `ITER-023.md` through `ITER-026.md` one row at a time for confirmed hardening fixes
7. Run `ITER-027.md` if a new external audit is produced after `ITER-026`
8. Run `ITER-028.md` through `ITER-031.md` one row at a time for the second-audit fix pack
9. `ITER-032.md` is complete; the Phase 2 gate was opened and completed through `ITER-038`
10. Start the enlarged Phase 3 pack with `ITER-039.md`
11. Continue `ITER-040.md` through `ITER-042.md` one row at a time
12. Keep `ITER-014.md` deferred until the n8n permission model is explicitly reopened
