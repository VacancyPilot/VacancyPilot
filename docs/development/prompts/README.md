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

Prompts for `ITER-013` to `ITER-016` should be generated after the actual implementation shape exists, because export, n8n, and release safety checks depend on concrete service/module paths.
