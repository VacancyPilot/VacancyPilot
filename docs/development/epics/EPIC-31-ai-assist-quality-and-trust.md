# EPIC-31: AI Assist Quality And Trust

## Goal

Turn the existing opt-in AI layer into a more trustworthy daily workflow surface by tightening settings lifecycle, budget visibility, and output quality signals.

## Inputs

- `docs/Техническое заданиеV.1.md`
- sections 12, 13, 18, 19, and 20 of the specification
- current repository state after `EPIC-29`

## In Scope

- clearer AI settings lifecycle and local API-key handling UX;
- land one real BYOK AI provider on the existing provider boundary without adding backend mediation;
- request preview, token/cost visibility, and local request-budget controls;
- cover-letter quality checks, provenance markers, and safer draft-review workflow;
- focused tests and docs that prove these flows work without broadening permissions or adding backend dependencies.

## Explicitly Deferred

- backend sync;
- server-side key vaults;
- new AI providers that require architectural expansion;
- `n8n` reopening;
- multi-site support;
- public store submission.

## Success Criteria

- AI settings become easier to trust and harder to misuse accidentally;
- at least one real AI provider works through the existing local-first flow with explicit user configuration;
- users can see what an AI action will cost or that cost is unavailable;
- letter drafts surface quality warnings instead of pretending certainty;
- the pack stays local-first and explicitly opt-in.
