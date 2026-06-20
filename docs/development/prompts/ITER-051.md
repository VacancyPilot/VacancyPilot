# Prompt: ITER-051 Security Alert Inventory And Fix Map

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md`
3. `docs/development/epics/EPIC-28-security-alert-closure.md`
4. `docs/development/iterations/ITER-051-security-alert-inventory-and-fix-map.md`

Task: inventory the remaining GitHub security alerts on `main`, deduplicate them into concrete alert families, and produce the exact fix map for the next iterations.

Allowed scope:

- dependency graph inspection;
- audit/security triage documentation;
- issue or docs updates that record the inventory and next-step mapping.

Hard constraints:

- no broad dependency changes yet;
- no product feature work;
- no permission or manifest expansion;
- no speculative upgrades without a mapped alert.

Validation:

```text
pnpm audit
pnpm typecheck
pnpm lint
pnpm test
```

Expected commit message: `docs: inventory remaining security alerts`
