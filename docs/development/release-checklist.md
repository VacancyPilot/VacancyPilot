# Release Checklist — VacancyPilot Phase 1

Status: ITER-015 (automated safety tests in place)  
Source: spec sections 19.6, 22.4, 26.5, 26.6

## Automated Checks (CI Gate)

These checks run automatically via `pnpm test` and must all pass before release:

- [ ] **Manifest permission audit** — `src/release-safety/manifest-safety.test.ts`
  - Only `storage`, `sidePanel`, `activeTab` in permissions
  - No broad host permissions (`<all_urls>`, `*://*`)
  - No forbidden permissions (`downloads`, `cookies`, `webRequest`, etc.)
  - MV3, valid version, icons present

- [ ] **Privacy payload safety** — `src/release-safety/privacy-safety.test.ts`
  - AI payloads are free of emails, phones, URLs, tokens
  - Strict Privacy mode excludes description and resume highlights
  - Redaction functions strip all sensitive patterns
  - Payload preview reports excluded fields correctly

- [ ] **Content script safety** — `src/release-safety/content-script-safety.test.ts`
  - No `fetch()` to HH domains
  - No `XMLHttpRequest`
  - No `.click()` on HH UI controls
  - No `.value` mutation on HH form elements
  - Shadow DOM isolation used for UI

- [ ] **Export secret exclusion** — `src/release-safety/export-safety.test.ts`
  - `webhookUrl` is redacted in exports
  - `hmacSecretSet` is always `false` in exports
  - CSV columns do not include secrets or settings
  - Export envelope structure is valid

- [ ] **Fixture regression** — `src/release-safety/fixture-regression.test.ts`
  - All parser fixtures pass (currently 3: `vacancy-normal`, `vacancy-no-salary`, `vacancy-archived`)
  - Aggregate check: zero fixture failures

## Manual QA Checklist

These checks require a human tester and a running extension instance.
Execute in at least Chrome and one additional Chromium browser (Edge, Brave, or Яндекс Браузер).

### Browser Compatibility (spec 22.4)

- [ ] Chrome (latest stable)
- [ ] Edge (latest stable)
- [ ] Brave (latest stable)
- [ ] Яндекс Браузер (latest stable)

### HH.ru States (spec 22.4)

- [ ] Logged-in HH user — vacancy page loads, badge appears
- [ ] Logged-out HH user — vacancy page loads, badge appears
- [ ] Vacancy with salary — badge shows without errors
- [ ] Vacancy without salary — badge shows without errors
- [ ] Remote vacancy — parsed correctly
- [ ] Office vacancy — parsed correctly
- [ ] Archived/removed vacancy — parser returns null (no crash)
- [ ] Already-applied vacancy (passive status) — no crash

### Permissions UI (spec 19.6)

- [ ] Extension installs without requesting unexpected permissions
- [ ] Optional permissions (AI provider host, n8n host) can be granted/denied individually
- [ ] Permission status is visible in settings
- [ ] Instructions for revoking access via browser settings are accessible

### AI Privacy (spec 26.6)

- [ ] API key is stored in `chrome.storage.local` with clear warning
- [ ] Payload preview is shown before every AI request
- [ ] Strict Privacy mode can be enabled and excludes description/resume
- [ ] Redaction visibly strips emails, phones, URLs from preview
- [ ] No raw HTML is sent to AI

### n8n Readiness (spec 26.5, deferred)

- [ ] n8n toggle is off by default (Labs)
- [ ] n8n webhook URL field is visible but optional
- [ ] HMAC secret field exists and is masked
- [ ] Payload preview shown before sending webhook events
- [ ] Retry policy is documented

Known open: runtime `optional_host_permissions` behavior for user webhook host — needs testing before Sprint 6.

### Data Safety

- [ ] Export JSON does not contain `webhookUrl` in plain text
- [ ] Export JSON does not contain `hmacSecretSet: true`
- [ ] Export CSV contains only job data, no settings or secrets
- [ ] "Delete all data" clears Dexie tables and `chrome.storage.local` keys
- [ ] No crashes on empty data

### Labs & Kill Switch (spec 19.7)

- [ ] Labs toggle is off by default
- [ ] Guided apply is off by default (Labs)
- [ ] Kill switch disables all Labs features when enabled
- [ ] Daily action limit is enforced when Labs are enabled

## Known Automation Gaps

The following checks are NOT automated and require manual verification:

1. **Real HH DOM changes** — Fixtures are snapshots. If HH changes its DOM, fixtures must be updated and re-validated manually.
2. **Browser-specific rendering** — Content badge positioning may differ across browsers.
3. **Performance with large datasets** — Not automated; test with 500+ jobs manually.
4. **Network error resilience** — AI/n8n retry behavior when offline.
5. **CSP compliance** — Verify no inline scripts violate extension CSP.

## Release Candidate Sign-off

- [ ] All automated CI checks pass
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Manual QA completed in at least 2 browsers
- [ ] No secrets committed
- [ ] Manifest permissions are minimal
- [ ] Release notes drafted
