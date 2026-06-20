# Manual QA Checklist — VacancyPilot Phase 1

Status: ITER-032 complete (Phase 2 gate GO)  
Source: spec section 22.4, EPIC-10, EPIC-15

> **Gate status (2026-06-20)**: Automated checks are green (903 tests, typecheck, lint, build, release safety), GitHub Actions `Quality` on `main` is green, and the follow-up Chrome + Edge rerun for the current Phase 1 core scope was reported as successful. Phase 2 implementation is now **GO**. See `docs/development/manual-qa-run-2026-06-20.md` § Phase 1 Closeout Rerun.

Run this checklist manually in at least **two Chromium browsers** (Chrome + one of Edge, Brave, Яндекс Браузер) before declaring Phase 1 release-candidate ready.

Record results in the checkboxes below. Re-run after each breaking change to the parser or content script.

The detailed matrix below remains the wider manual regression checklist. The Phase 2 start gate is already closed separately by the documented closeout rerun above.

---

## 1. Browser Compatibility

| # | Browser | Version | Extension loads | Badge appears | Side panel opens | Notes |
|---|---------|---------|-----------------|---------------|------------------|-------|
| 1 | Chrome | latest stable | ☐ | ☐ | ☐ | |
| 2 | Edge | latest stable | ☐ | ☐ | ☐ | |
| 3 | Brave | latest stable | ☐ | ☐ | ☐ | |
| 4 | Яндекс Браузер | latest stable | ☐ | ☐ | ☐ | |

---

## 2. HH.ru Vacancy Page States

Test each state on a real HH.ru vacancy page.

| # | State | Expected behavior | Pass | Notes |
|---|-------|-------------------|------|-------|
| 1 | Logged-in HH user | Badge appears, side panel loads, parser extracts fields | ☐ | |
| 2 | Logged-out HH user | Badge appears, side panel loads, parser extracts fields | ☐ | |
| 3 | Vacancy with salary | Salary field populated in parsed output | ☐ | |
| 4 | Vacancy without salary | Salary field empty/null, no crash | ☐ | |
| 5 | Remote vacancy | Work mode detected as remote | ☐ | |
| 6 | Office vacancy | Work mode detected as office/onsite | ☐ | |
| 7 | Archived/removed vacancy | Parser returns null, badge shows "unavailable" state | ☐ | |
| 8 | Already-applied vacancy | Passive status detected, no duplicate creation | ☐ | |

---

## 3. Permissions UX

| # | Check | Pass | Notes |
|---|-------|------|-------|
| 1 | Extension installs without requesting unexpected permissions | ☐ | |
| 2 | Only `storage`, `sidePanel`, `activeTab` listed at install time | ☐ | |
| 3 | Optional host permissions (AI provider, n8n) can be granted individually | ☐ | |
| 4 | Optional host permissions can be denied without breaking Core features | ☐ | |
| 5 | Permission status is visible in extension settings | ☐ | |
| 6 | Revoke instructions are accessible from settings | ☐ | |

---

## 4. Core Features — Functional

| # | Feature | Expected behavior | Pass | Notes |
|---|---------|-------------------|------|-------|
| 1 | Vacancy parsing | Title, company, salary, description, skills extracted | ☐ | |
| 2 | Save vacancy | Vacancy saved to local Dexie DB, visible in dashboard | ☐ | |
| 3 | Status management | User can change status (Saved, Applied, Interview, etc.) | ☐ | |
| 4 | Status history | Status changes are recorded with timestamps | ☐ | |
| 5 | Rule-based scoring | Score 0–100 shown without AI, breakdown visible | ☐ | |
| 6 | Score breakdown | Title match, skills, experience, etc. components visible | ☐ | |
| 7 | Profile management | User can create/select a profile for scoring | ☐ | |
| 8 | Dashboard table | List of tracked vacancies with columns: title, company, score, status, date | ☐ | |
| 9 | Dashboard filtering | Filter by status, sort by score/date | ☐ | |
| 10 | Popup | Popup opens, shows quick stats, links to dashboard/side panel | ☐ | |
| 11 | Side panel | Side panel opens, shows vacancy details, score, actions | ☐ | |
| 12 | Content badge | Small badge on vacancy page, click opens side panel | ☐ | |
| 13 | Badge position | Badge does not cover HH buttons, does not break HH layout | ☐ | |

---

## 5. AI Features (opt-in)

| # | Feature | Expected behavior | Pass | Notes |
|---|---------|-------------------|------|-------|
| 1 | AI fully disabled by default | No AI requests without user action | ☐ | |
| 2 | API key entry | User can enter API key in settings | ☐ | |
| 3 | Payload preview | Payload preview shown before every AI request | ☐ | |
| 4 | Redaction | Emails, phones, URLs visibly redacted in preview | ☐ | |
| 5 | Strict Privacy mode | Description and resume excluded from payload | ☐ | |
| 6 | AI analysis by button | AI analysis runs on user click, results shown in side panel | ☐ | |
| 7 | AI cache | Cached results reused for same vacancy+profile, cache controls work | ☐ | |
| 8 | Token/cost preview | Estimated cost shown if provider supports it | ☐ | |

---

## 6. Cover Letter Studio

| # | Feature | Expected behavior | Pass | Notes |
|---|---------|-------------------|------|-------|
| 1 | Cover letter generation | AI generates cover letter on user request | ☐ | |
| 2 | Edit mode | User can edit generated letter text | ☐ | |
| 3 | Save | Letter saved to local DB | ☐ | |
| 4 | Copy to clipboard | "Copy" button copies letter text | ☐ | |
| 5 | Letter library | Saved letters visible in library view | ☐ | |
| 6 | Modes (short/full/concise) | Different letter modes produce different outputs | ☐ | |

---

## 7. Export & Delete

| # | Feature | Expected behavior | Pass | Notes |
|---|---------|-------------------|------|-------|
| 1 | Export CSV | CSV downloads with job data columns | ☐ | |
| 2 | Export JSON | JSON downloads with full data envelope | ☐ | |
| 3 | Export excludes secrets | No `webhookUrl`, `hmacSecret`, or API keys in export | ☐ | |
| 4 | Delete all data | Dexie tables and `chrome.storage.local` keys cleared | ☐ | |
| 5 | No crash on empty data | Export/delete work when no data exists | ☐ | |

---

## 8. Labs & Kill Switch

| # | Feature | Expected behavior | Pass | Notes |
|---|---------|-------------------|------|-------|
| 1 | Labs toggle off by default | All Labs features disabled on fresh install | ☐ | |
| 2 | n8n toggle off by default | n8n webhook not active unless explicitly enabled | ☐ | |
| 3 | Guided apply off by default | Guided apply UI not visible unless Labs enabled | ☐ | |
| 4 | Kill switch disables Labs | All Labs features hidden/disabled when kill switch on | ☐ | |

---

## 9. n8n Readiness (deferred — ITER-014, Labs)

| # | Feature | Expected behavior | Pass | Notes |
|---|---------|-------------------|------|-------|
| 1 | n8n toggle in Labs | Toggle present, off by default | ☐ | |
| 2 | Webhook URL field | Field visible but optional | ☐ | |
| 3 | HMAC secret field | Field exists, value masked | ☐ | |
| 4 | Payload preview | Shown before sending webhook events | ☐ | |
| 5 | Retry policy documented | Backoff/retry behavior described in UI or docs | ☐ | |

Known open: runtime `optional_host_permissions` behavior for user webhook host — needs testing before Sprint 6 (spec 26.5).

---

## 10. Error & Edge Cases

| # | Scenario | Expected behavior | Pass | Notes |
|---|----------|-------------------|------|-------|
| 1 | HH page with unusual DOM | Parser falls back gracefully, no error badge | ☐ | |
| 2 | Network offline during AI request | User sees error state, no crash | ☐ | |
| 3 | Extension disabled and re-enabled | Data persists, extension resumes normally | ☐ | |
| 4 | Multiple vacancy tabs open | Each tab shows correct badge, no cross-contamination | ☐ | |
| 5 | Rapid status changes | Status history records correctly, no race conditions | ☐ | |
| 6 | HH page with Cyrillic-only content | Parsed correctly, scoring works | ☐ | |

---

## 11. Safety Boundaries (MUST PASS)

These are non-negotiable for Phase 1 release. Any failure is a release blocker.

| # | Safety boundary | Verification method | Pass | Notes |
|---|-----------------|---------------------|------|-------|
| 1 | No auto-submit | Verify no form submission code exists | ☐ | |
| 2 | No auto-click on HH controls | Verify content script does not trigger clicks | ☐ | |
| 3 | No auto-fill of HH form fields | Verify no `.value` mutation on HH elements | ☐ | |
| 4 | No hidden `fetch` to HH | Verify no background/CS fetch to hh.ru | ☐ | |
| 5 | No synthetic DOM events for HH | Verify no `dispatchEvent` on HH elements | ☐ | |
| 6 | No CAPTCHA bypass | Verify no antibot logic | ☐ | |
| 7 | No telemetry | Verify no analytics/tracking calls | ☐ | |
| 8 | No cookies/session handling | Verify extension does not access HH cookies | ☐ | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Reviewer | | | |
