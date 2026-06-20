# VacancyPilot — Phase 1 Release Notes

**Version**: 0.1.0  
**Date**: 2026-06-19  
**Status**: Release Candidate (private/personal use)  
**Target**: Phase 1 — Read & Assist MVP

---

## Overview

VacancyPilot is a **local-first, read-first HH.ru job search copilot**. It helps candidates analyze vacancies, score opportunities, generate cover letters, and track their job search — all without risking their HH.ru account.

**Core principle**: decision quality over automation. The extension reads, scores, and assists. It never auto-applies, auto-clicks, or fills HH forms.

---

## What's Included

### Vacancy Parser
- Extracts title, company, salary, description, skills from HH.ru vacancy pages.
- Uses JSON-LD as primary source with DOM fallback.
- Handles archived/removed vacancies gracefully.

### Local Tracker
- Save vacancies to local database (IndexedDB via Dexie).
- Track application status: Saved → Applied → Interview → Offer → Rejected → Archived.
- Full status history with timestamps.
- Dashboard shell and local data views.

### Rule-Based Scoring
- Explainable 0–100 score without AI.
- Factor breakdown: title match, skills, experience, work mode, salary, company preference.
- Configurable scoring weights and thresholds.
- User profiles with skills and preferences.

### AI Analysis (opt-in)
- BYOK (Bring Your Own Key) architecture.
- Payload preview before every request — see exactly what is sent.
- Redaction of emails, phones, URLs before external requests.
- Strict Privacy mode excludes description and resume text.
- AI cache with configurable controls.
- Mock-provider workflow and validation path are implemented; a real provider is still pending.

### Cover Letter Studio
- Generate cover letters using AI with multiple modes (short, full, concise).
- Edit, save, and copy letters.
- Saved letters persist locally and can be reused from the vacancy workflow.

### Export & Data Ownership
- Export all data as CSV or JSON.
- Delete all data with one action.
- No data lock-in — all data is local.

### Privacy & Safety
- No telemetry, no analytics, no developer backend.
- All data stored locally (IndexedDB, chrome.storage.local).
- AI and n8n features are opt-in and off by default.
- Labs kill switch disables experimental features.
- Onboarding explains permissions, storage, and non-goals.

### Extension UI
- Content badge on HH.ru vacancy pages (Shadow DOM isolated).
- Side panel with vacancy details, score, and actions.
- Popup shell with vacancy detection and navigation.
- Dashboard/options shell with export and privacy controls.
- Settings and Labs remain partially placeholder-driven outside the implemented privacy/export flows.

---

## What's NOT Included

### Deferred from Phase 1
- **n8n / Telegram integration** (ITER-014): UI placeholders exist, implementation deferred pending go/no-go decision.
- **Search badges**: Triage mode for HH.ru search result pages (Phase 2).
- **Workflow queue**: Kanban-style application tracking (Phase 3).
- **Guided apply**: Clipboard-based field guidance (Phase 3, Labs).
- **HR communication hub** (Phase 5).
- **Multi-site support** (Phase 6).

### Forbidden by Design (never in Core)
- Auto-submit or auto-apply.
- Auto-click on HH controls.
- Programmatic form fill on HH pages.
- Synthetic DOM events for HH fields.
- Hidden fetches to HH endpoints.
- CAPTCHA or antibot bypass.
- Cookie/session handling.
- Developer telemetry.

---

## Technical Details

| Item | Detail |
|------|--------|
| Platform | Chrome Extension Manifest V3 |
| Framework | WXT 0.19 |
| UI | React 18 |
| Storage | Dexie 4 (IndexedDB) + chrome.storage.local |
| Language | TypeScript 5.6 |
| Tests | 451 tests across 21 test files |
| Permissions | `storage`, `sidePanel`, `activeTab` |
| Build size | ~306 KB |

---

## Known Limitations

### Parser Coverage
Only 3 fixture tests cover the vacancy parser. The spec calls for 50+. Real-world vacancy diversity may expose parsing gaps. Report broken parses with the vacancy URL.

### AI Provider
A mock AI provider is used for testing. No real provider (OpenAI, DeepSeek, OpenRouter) is implemented. AI analysis requires implementing at least one provider and configuring an API key.

### API Key Storage
API keys are stored in `chrome.storage.local` as plaintext. This is acceptable for personal use but should be hardened before public release (see spec 26.6).

### Browser Testing
Manual QA has not been executed. Testing has been limited to automated unit and safety tests in a Node.js environment. Browser-specific issues (badge positioning, side panel behavior) may exist.

### Large Datasets
Performance with 500+ tracked vacancies is untested. Export and dashboard operations may be slow with large datasets.

### n8n Integration
Not implemented (deferred). Event logging infrastructure exists but no external delivery.

---

## Installation

For private/personal use, build from source:

```bash
git clone <repo-url>
cd vacancy-pilot
pnpm install
pnpm build
```

Load `.output/chrome-mv3/` as unpacked extension in Chrome (Developer mode).

See `docs/development/private-install-guide.md` for detailed instructions.

---

## Documentation

| Document | Location |
|----------|----------|
| Specification | `docs/Техническое заданиеV.1.md` |
| Development plan | `docs/development/00-product-development-plan.md` |
| Iteration map | `docs/development/02-iteration-map.md` |
| QA checklist | `docs/development/qa-checklist.md` |
| Known risks | `docs/development/known-risks.md` |
| Install guide | `docs/development/private-install-guide.md` |
| Public release prereqs | `docs/development/public-release-prerequisites.md` |
| Privacy policy checklist | `docs/development/privacy-policy-checklist.md` |

---

## What's Next

| Priority | Item | Iteration |
|----------|------|-----------|
| P0 | Implement at least one real AI provider | Future |
| P0 | Expand parser fixtures to 50+ | Future |
| P1 | Execute manual QA in 2+ browsers | ITER-016 follow-up |
| P1 | Resolve API key storage approach | Spec 26.6 |
| P2 | Implement n8n or make explicit deferral decision | ITER-014 |
| P2 | Expand contributor onboarding docs | Future |
| P2 | Test performance with 500+ jobs | Manual QA |

---

## Acknowledgments

Built with WXT, React, TypeScript, Dexie, and Vitest. AI-assisted development using Cursor/Codex and Zed autopilot workflow.
