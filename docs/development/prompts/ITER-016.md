# Prompt: ITER-016 Release Candidate Docs

Read first:

1. `AGENTS.md`
2. `docs/Техническое заданиеV.1.md` sections 22.4 and 27
3. `docs/development/epics/EPIC-10-release-hardening-and-qa.md`
4. `docs/development/iterations/ITER-016-release-candidate-docs.md`

Task: prepare Phase 1 release candidate documentation after implementation and automated checks are complete.

Allowed scope:

- manual QA checklist;
- private install and validation guide;
- known-risks and release-notes docs;
- public-release prerequisites and privacy-policy checklist;
- status doc updates required to reflect release-candidate readiness.

Hard constraints:

- no new runtime features in this iteration;
- no store submission work;
- do not claim manual QA results that were not actually performed;
- keep blockers and known risks explicit;
- do not hide unresolved safety gaps.

Validation:

```text
pnpm build
```

Expected commit message: `docs: prepare phase 1 release candidate`
