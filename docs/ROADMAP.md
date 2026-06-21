# Roadmap

## Current Status

**Private alpha / dogfooding.** The extension is functional end-to-end: vacancy parser, local tracker, rule-based scoring, cover letter studio, export, and release-safety tests all pass. The project is not yet publicly released.

Key milestones reached:

- Phase 0 (Silent Observer) — complete
- Phase 1 (Read & Assist MVP) — complete
- Phase 2 (Search Triage) — complete
- Workflow Queue / Kanban — complete
- HR Communication Hub — complete
- Post-audit reliability and scoring hardening — complete
- Dependency and security alert remediation — complete
- GitHub infrastructure and CI baseline — 90+ % complete

---

## Near-Term Priorities

### P0 — Data Integrity Hardening

- Ensure all current schema tables are included in export/delete/count flows
- Verify `hrTimeline` is included in JSON export and delete-all flows
- Add tests for delete-all, delete-job, export, hasData and getDataCounts
- Validate save/load/export cycles with larger local datasets

### P0 — Runtime QA

- Manual QA pass in Chrome latest stable
- Manual QA pass in Edge latest stable
- Verify popup → side panel context
- Verify search page quick save/reject
- Verify HR timeline extraction on user-opened HH pages
- Verify delete/export flows

### P1 — Parser Fixture Coverage

- Expand parser fixture coverage beyond current baseline
- Add edge-case parsing for non-standard HH.ru vacancy layouts
- Target ≥ 50 sanitized vacancy fixtures before public beta

### P1 — AI/release-trust (ITER-060 → ITER-063)

- AI assist quality improvements
- Onboarding and permission disclosure surfaces
- Privacy explainer and user-facing trust documentation
- Real AI provider integration

---

## Before Public Beta

- [ ] Resolve license selection
- [ ] Complete data integrity hardening
- [ ] Pass manual QA in 2+ browsers
- [ ] Parser fixture coverage ≥ 50 vacancies
- [ ] Document public release prerequisites
- [ ] Privacy policy and user-facing disclosures finalized
- [ ] Real AI provider implemented and tested
- [ ] API key storage hardened (see spec §26.6)
- [ ] Performance tested with 500+ tracked vacancies
- [ ] Chrome Web Store listing assets prepared

---

## Later Ideas

These are directional, not committed:

- **Scoring v2** — improved title/skill matching, company reputation signals, market-salary benchmarks
- **UI Design System** — consistent component library, dark mode, accessibility audit
- **AI Provider Gateway** — OpenRouter, DeepSeek, OpenAI with transparent provider selection
- **n8n / Telegram integration** — opt-in webhook delivery for status changes (deferred pending permission model decision)
- **Multi-site support** — expand beyond HH.ru to other job boards (Phase 6)
- **Guided Apply (Labs)** — clipboard-based field guidance for application forms

---

## Non-Goals

These are **explicitly out of scope** and will not be implemented:

- **Auto-apply bot** — the extension will never auto-submit applications
- **Scraping hidden HH APIs** — no programmatic access to HH.ru internal endpoints
- **Bypassing rate limits or CAPTCHA** — no antibot or CAPTCHA circumvention
- **Collecting telemetry by default** — no analytics, crash reporting, or usage tracking unless explicitly opt-in
- **Cloud backend or sync service** — all data stays local; no server-side component
- **Chrome Web Store automation** — publishing is a manual, human-reviewed process
