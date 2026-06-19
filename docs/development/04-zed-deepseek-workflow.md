# Zed + DeepSeek Workflow

Use this workflow when running implementation prompts in Zed with DeepSeek v4 PRO or another coding model.

## Short Answer

Do not just paste every prompt one after another without review.

Use this loop:

1. Start from a clean working tree.
2. Paste `docs/development/prompts/ZED-SESSION-START.md` once at the beginning of the Zed AI chat.
3. Paste one committed iteration prompt file from `docs/development/prompts/`.
4. Let Zed implement only that iteration.
5. If Zed reports residual risks, paste `docs/development/prompts/RISK-CLOSURE.md` in the same Zed chat.
6. Run the validation commands from the prompt.
7. Review the diff.
8. Commit only after review.
9. Move to the next iteration.

## Recommended Human/Codex Handoff

After Zed finishes an iteration, come back to Codex with:

```text
Review ITER-0XX result, run checks, commit and push if good.
```

This keeps Zed focused on implementation and lets Codex act as reviewer/release operator.

## Rules For Zed

Zed should:

- make code changes for one iteration only;
- run the validation commands if the environment allows;
- summarize files changed;
- list commands run;
- report blockers precisely;
- avoid broad refactors;
- avoid committing or pushing unless explicitly asked.

Zed should not:

- continue into the next iteration;
- update the master specification without explicit instruction;
- add broad permissions;
- add auto-fill, auto-click, or hidden HH network behavior;
- add AI/n8n before their iterations;
- silently switch package manager;
- hide failed validation.

## Residual Risks

Residual risks are useful, but they should not automatically become more work.

Use `docs/development/prompts/RISK-CLOSURE.md` only when the risks are concrete enough to classify. It should either:

- fix a small in-scope issue;
- defer the risk to a future iteration;
- mark it as a manual check;
- explicitly accept it for now.

Do not use residual-risk closure to expand the current iteration into the next epic.

## Branching

For private early development, committing directly to `main` after review is acceptable.

If you want cleaner history, use one branch per iteration:

```text
codex/iter-001-wxt-scaffold
codex/iter-002-quality-scripts
```

Do not run multiple uncommitted iterations in the same working tree.

## What To Do If Zed Gets Stuck

Stop the run and ask Codex to inspect if:

- dependency installation fails;
- WXT scaffold conflicts with existing files;
- TypeScript/build setup is unclear;
- generated manifest contains unexpected permissions;
- Zed starts implementing features outside the iteration.
