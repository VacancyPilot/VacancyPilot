# Cursor / Codex / Zed Autopilot Workflow

Use one prompt per iteration. The prompt files in `docs/development/prompts/` are designed to be pasted into Cursor, Codex, or Zed with the repository open.

## Standard Autopilot Run

1. Start from a clean working tree.
2. Read `AGENTS.md`.
3. Read `docs/Техническое заданиеV.1.md`.
4. Read the target epic file.
5. Read the target iteration file.
6. Paste the matching prompt.
7. Let autopilot implement only that iteration.
8. Review diff.
9. Run validation commands.
10. Commit with the suggested commit message.
11. Update `docs/development/02-iteration-map.md` status if appropriate.

## Zed Session Setup

When using Zed, paste this once at the beginning of the AI chat:

```text
docs/development/prompts/ZED-SESSION-START.md
```

Then paste only the target iteration prompt.

Zed should implement and validate, but should not commit or push unless explicitly instructed. Prefer returning to Codex for review, commit, and push after each iteration.

## Prompt Contract

Every prompt must include:

- target iteration;
- source docs;
- exact task;
- allowed files/folders;
- non-goals;
- safety constraints;
- validation commands;
- expected final response.

## Review Checklist

Before accepting an autopilot diff:

- no permissions added beyond the iteration;
- no hidden HH network calls;
- no DOM writes to HH forms;
- no secrets;
- no broad refactor;
- tests or fixtures match the scope;
- generated files are ignored;
- implementation follows the master spec.

## When To Stop Autopilot

Stop and split the task if it:

- starts implementing AI before local scoring exists;
- adds backend services;
- adds auto-fill or synthetic input;
- broadens host permissions;
- rewrites the whole architecture;
- removes safety checks to make tests pass.
