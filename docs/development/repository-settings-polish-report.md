# Repository Settings Polish Report

**Date**: 2026-06-21
**Repository**: `VacancyPilot/VacancyPilot`
**Performed by**: Zed AI agent via `gh` CLI (authenticated as `iurii-izman`)

---

## Summary

Applied and verified all public-facing repository metadata: description, homepage, topics, feature toggles, and social preview asset. No product code, permissions, secrets, or CI configuration was changed.

---

## About Fields

| Field | Before | After |
|-------|--------|-------|
| Description | `Local-first HH.ru job search copilot specification and implementation workspace` | `Local-first HH.ru job-search copilot: safe vacancy parsing, explainable scoring, cover letters, application tracking, Kanban and export.` |
| Homepage | _(empty)_ | `https://github.com/VacancyPilot/VacancyPilot#readme` |

---

## Topics

**Before** (7): `browser-extension`, `codex`, `job-search`, `manifest-v3`, `react`, `typescript`, `wxt`

**After** (19):

| # | Topic | Category |
|---|-------|----------|
| 1 | `browser-extension` | Platform |
| 2 | `chrome-extension` | Platform |
| 3 | `manifest-v3` | Platform |
| 4 | `wxt` | Framework |
| 5 | `react` | UI |
| 6 | `typescript` | Language |
| 7 | `dexie` | Storage |
| 8 | `indexeddb` | Storage |
| 9 | `job-search` | Domain |
| 10 | `hh-ru` | Domain |
| 11 | `career-tools` | Domain |
| 12 | `local-first` | Architecture |
| 13 | `privacy-first` | Architecture |
| 14 | `ai-copilot` | Feature |
| 15 | `scoring` | Feature |
| 16 | `cover-letter` | Feature |
| 17 | `kanban` | Feature |
| 18 | `job-tracker` | Feature |
| 19 | `developer-tools` | Audience |

**Removed**: `codex` (internal tooling reference, not relevant to public visitors)

All topics conform to GitHub rules: lowercase, hyphen-separated, ≤ 50 chars, ≤ 20 total.

---

## Feature Toggles

| Setting | Before | After | Rationale |
|---------|--------|-------|-----------|
| Issues | ✅ enabled | ✅ enabled | Required for bug reports and feature tracking |
| Pull Requests | ✅ enabled | ✅ enabled | Required for contribution workflow |
| Projects | ✅ enabled | ❌ disabled | Not needed until community collaboration grows |
| Wiki | ❌ disabled | ❌ disabled | Documentation lives in-repo under `docs/` |
| Discussions | ❌ disabled | ❌ disabled | Enable later if external community forms |
| Sponsorship | ❌ disabled | ❌ disabled | No sponsorship program |
| Releases | available | available | No releases published yet — correct for private alpha |

**Additional verified**:

- Auto-merge: disabled ✅
- Allow forking: enabled ✅
- Default branch: `main` ✅
- Secret scanning: enabled ✅
- Secret scanning push protection: enabled ✅
- Dependabot security updates: enabled ✅

---

## Social Preview

### Asset Created

- **File**: `assets/social-preview/vacancypilot-social-preview.svg`
- **Dimensions**: 1280×640 px
- **Background**: dark gradient (#0d1117 → #161b22)
- **Content**:
  - Title: **VacancyPilot** (56px, white, bold)
  - Subtitle: *Local-first HH.ru job-search copilot* (22px, grey)
  - Safety line: *Read-first • No auto-apply • Privacy-first* (16px)
  - Left motif: browser window with vacancy card and score badge
  - Right motif: Kanban board (Saved / Applied / Offer columns)
- **No copyrighted logos**: no HH, GitHub, OpenAI, or third-party marks
- **No fake screenshots**: all shapes are simplified geometric motifs

### PNG Export

PNG export was not possible in the current environment (no `inkscape`, `rsvg-convert`, or `magick` available).

### Manual Upload Instructions

1. Convert SVG to PNG:
   ```bash
   # Option A: Inkscape (Windows/Linux/Mac)
   inkscape assets/social-preview/vacancypilot-social-preview.svg \
     --export-type=png --export-filename=assets/social-preview/vacancypilot-social-preview.png \
     --export-width=1280 --export-height=640

   # Option B: rsvg-convert (Linux/Mac)
   rsvg-convert -w 1280 -h 640 \
     assets/social-preview/vacancypilot-social-preview.svg \
     -o assets/social-preview/vacancypilot-social-preview.png

   # Option C: Online converter
   # Upload SVG to any SVG→PNG converter, download at 1280×640
   ```

2. Upload to GitHub:
   - Go to `https://github.com/VacancyPilot/VacancyPilot/settings`
   - Scroll to **Social preview**
   - Click **Edit** → **Upload image**
   - Select `assets/social-preview/vacancypilot-social-preview.png`
   - Ensure file is under 1 MB

---

## Manual Steps (Remaining)

| # | Step | Status |
|---|------|--------|
| 1 | Convert social preview SVG → PNG | ⬜ manual (see instructions above) |
| 2 | Upload social preview PNG to GitHub Settings | ⬜ manual |
| 3 | Verify topics render correctly on repo page | ⬜ check after push |
| 4 | Verify social preview displays on link unfurl (Discord/Slack/Twitter) | ⬜ manual test |

---

## Remaining Polish

| Area | Note |
|------|------|
| License | Not selected yet — all rights reserved by default |
| CODEOWNERS | Not created — single-maintainer project |
| CONTRIBUTING.md | Not created — add when community contributions are expected |
| Issue templates | Not created — add when issues are opened externally |
| GitHub Pages | Not needed — docs live in README and `docs/` |
| Sponsorship | Not applicable at this stage |
