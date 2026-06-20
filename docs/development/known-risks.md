# Known Risks — VacancyPilot Phase 1

Status: ITER-016  
Source: EPIC-10, release-checklist.md, spec sections 22, 26

This document lists all known risks, open decisions, and unresolved gaps at Phase 1 release-candidate. Risks are classified and must be addressed or explicitly accepted before public release.

---

## Risk Classification

| Severity | Meaning |
|----------|---------|
| **P0** | Release blocker — must resolve before any release |
| **P1** | High risk — should resolve before public release |
| **P2** | Moderate risk — document and monitor |
| **P3** | Low risk / accepted — document for transparency |

---

## Technical Risks

### R1 — HH.ru DOM Fragility (P1)

**Risk**: The vacancy parser relies on specific CSS selectors and JSON-LD extraction from HH.ru pages. If HH changes its DOM structure, the parser may break silently or return null.

**Mitigation**:
- Parser uses JSON-LD as primary source, DOM as fallback.
- Fixture regression tests catch regressions for known page shapes (currently 3 fixtures).
- Fixture maintenance process is documented (spec 16.5).

**Residual**: Only 3 fixtures. Spec requires 50+. Fixture coverage is insufficient for release confidence.

**Action**: Expand fixture library to 50+ before public release. Accept 3 fixtures for private/development use.

---

### R2 — Parser Fixture Coverage Gap (P1)

**Risk**: The fixture library contains 3 vacancies (`vacancy-normal`, `vacancy-no-salary`, `vacancy-archived`). The spec requires 50+ fixtures for Phase 1 readiness (spec 22.5, 23.5). Real-world HH vacancy diversity (salary formats, skill lists, description lengths, remote/office variations) is not covered.

**Mitigation**: Fixture harness is built and regression tests run automatically. Adding fixtures is low-effort.

**Residual**: Parser may fail on vacancy types not covered by existing fixtures.

**Action**: Collect and sanitize additional fixtures from real HH.ru pages. Target 50+ before public release.

---

### R3 — Browser-Specific Rendering (P2)

**Risk**: The content badge uses Shadow DOM for style isolation, but positioning and z-index behavior may differ across Chromium browsers (Chrome, Edge, Brave, Яндекс Браузер).

**Mitigation**: Content badge is small and intentionally positioned to avoid overlapping HH UI. Manual QA checklist covers 4 browsers.

**Residual**: Badge may overlap HH elements on some browser/zoom combinations.

**Action**: Manual QA across target browsers. Adjust positioning if needed.

---

### R4 — Performance With Large Datasets (P2)

**Risk**: Local Dexie database performance is not tested with large datasets (500+ vacancies). IndexedDB operations may degrade with many records.

**Mitigation**: Dexie is designed for client-side databases of this scale. Dashboard uses pagination/filtering.

**Residual**: Untested at scale. Export/delete operations may be slow with many records.

**Action**: Manual test with 500+ synthetic jobs. Document any performance thresholds found.

---

### R5 — Network Error Resilience (P2)

**Risk**: AI and n8n features require network access. Behavior during network interruptions, timeouts, or provider errors is tested at unit level but not in integration scenarios with real providers.

**Mitigation**: Error boundaries exist in UI. AI cache provides offline access to previous results.

**Residual**: Edge cases like partial responses, rate limiting, or prolonged outages not fully tested.

**Action**: Manual test with network throttling. Document error recovery paths.

---

## Product Risks

### R6 — n8n Integration Deferred (P2)

**Risk**: n8n webhook client (ITER-014) is planned but not implemented. The spec references n8n as Phase 1 scope, but the decision to defer was made pending a go/no-go decision (spec 26.5).

**Mitigation**: n8n toggle exists in Labs settings, off by default. UI fields for webhook URL and HMAC secret are placeholders.

**Residual**: n8n feature is unavailable. Event logging (EventLog table) exists but no external delivery.

**Action**: Make explicit go/no-go decision on n8n for Phase 1. If deferred, update roadmap and acceptance criteria.

---

### R7 — AI Provider Not Implemented (P2)

**Risk**: The AI provider interface is defined and a mock provider exists for testing, but no real provider implementation (OpenAI, DeepSeek, OpenRouter) is present.

**Mitigation**: Provider interface is clean and mock covers testing needs. BYOK architecture means no backend proxy required.

**Residual**: AI analysis and cover letter generation cannot be tested end-to-end without a real API key.

**Action**: Implement at least one provider (OpenRouter or OpenAI as recommended in spec 26.2) before public release.

---

### R8 — API Key Storage Security (P1)

**Risk**: API keys are stored in `chrome.storage.local` with a clear user warning. This is acceptable for personal MVP but below public-release standard (spec 26.6).

**Mitigation**:
- Warning displayed in settings UI.
- Keys excluded from export.
- Keys not synced via Chrome Sync.

**Residual**: Keys stored in plaintext in browser profile. Accessible to other extensions with `storage` permission.

**Action**: Accept for private release. For public release, evaluate WebCrypto + master password or session-only key (spec 26.6).

---

### R9 — Public Release Name/Trademark (P3)

**Risk**: Product name "VacancyPilot" has not been checked against Chrome Web Store, domain availability, trademarks, or existing job-tech products (spec 26.1).

**Mitigation**: Internal use only. Public release is not imminent.

**Residual**: Name conflict may require rename before public launch.

**Action**: Perform name/trademark check before public release submission.

---

## Process Risks

### R10 — Manual QA Not Yet Performed (P1)

**Risk**: No manual QA has been executed. All test coverage is automated (unit, fixture, safety). The QA checklist exists but is unchecked (ITER-016 deliverable).

**Mitigation**: QA checklist is comprehensive and maps to spec acceptance criteria.

**Residual**: Real-world bugs in browser integration, HH page interaction, or user workflow may exist.

**Action**: Execute manual QA in Chrome + one additional browser before release sign-off.

---

### R11 — Contributor Documentation Gaps (P2)

**Risk**: A root README and private install guide exist, but contributor-facing onboarding remains thin. External contributors still lack a concise implementation walkthrough, architecture map, and troubleshooting guide.

**Mitigation**: Root README, private install guide, release notes, and development pack are in place. Onboarding UI exists in the extension.

**Residual**: New contributors may still need repo walkthrough support for implementation details and local debugging.

**Action**: Add contributor onboarding/troubleshooting docs before broader sharing.

---

## Summary

| Risk | Severity | Status | Target |
|------|----------|--------|--------|
| R1 — HH DOM fragility | P1 | Accepted with mitigation | Monitor, expand fixtures |
| R2 — Fixture coverage gap | P1 | Accepted for private use | 50+ fixtures before public |
| R3 — Browser rendering | P2 | Accepted for private use | Manual QA in 4 browsers |
| R4 — Large dataset perf | P2 | Untested | Manual test 500+ jobs |
| R5 — Network resilience | P2 | Partially tested | Manual test with throttling |
| R6 — n8n deferred | P2 | Accepted, pending decision | Go/no-go decision |
| R7 — AI provider missing | P2 | Mock only | Implement 1 provider |
| R8 — API key storage | P1 | Accepted for personal MVP | Evaluate for public release |
| R9 — Name/trademark | P3 | Not checked | Before public submission |
| R10 — Manual QA pending | P1 | QA checklist ready | Execute before release |
| R11 — Contributor docs gap | P2 | Accepted for private use | Before broader sharing |

---

## Risk Acceptance

For **private/personal use Phase 1 release**, the following risks are explicitly accepted:

- R2 (3 fixtures instead of 50+)
- R6 (n8n deferred)
- R7 (mock provider only)
- R8 (plaintext key storage)
- R11 (contributor onboarding still thin)

For **public release**, all P1 risks must be resolved. P2 risks must be at minimum documented with mitigation plans.
