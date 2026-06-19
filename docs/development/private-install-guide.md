# Private Install & Validation Guide — VacancyPilot Phase 1

Status: ITER-016  
Target audience: developer or early tester installing from source

This guide covers building and loading the extension for private/personal use. It does NOT cover Chrome Web Store submission.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | >= 18 | `node --version` |
| pnpm | >= 8 | `pnpm --version` |
| Chromium browser | Chrome, Edge, Brave, or Яндекс Браузер (latest stable) | — |
| Git | any recent | `git --version` |

---

## 1. Clone and Install

```bash
git clone <repository-url> vacancy-pilot
cd vacancy-pilot
pnpm install
```

---

## 2. Verify the Build

Run the automated checks before loading the extension:

```bash
# TypeScript type checking
pnpm typecheck

# Lint
pnpm lint

# Unit and safety tests (451 tests expected)
pnpm test

# Production build
pnpm build
```

All four commands must pass. The build output is in `.output/chrome-mv3/`.

Expected test output: **21 test files, 451 tests passed**.

---

## 3. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3/` directory from this project.
5. The extension "VacancyPilot" should appear in your extensions list.

---

## 3a. Load in Edge

1. Open Edge and navigate to `edge://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3/` directory.

---

## 3b. Load in Brave

1. Open Brave and navigate to `brave://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3/` directory.

---

## 3c. Load in Яндекс Браузер

1. Open Яндекс Браузер and navigate to `browser://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3/` directory.

---

## 4. Permissions Granted

At install time, the extension requests only these permissions:

| Permission | Reason |
|------------|--------|
| `storage` | Save vacancy data, settings, and profiles locally |
| `sidePanel` | Open a side panel on HH.ru vacancy pages |
| `activeTab` | Read the current vacancy page to extract job data |

**No broad host permissions** (`<all_urls>`, `*://*`) are requested at install.

Optional permissions (requested at runtime, only when needed):
- AI provider host (e.g., `https://api.openai.com/*`) — only if user configures AI
- n8n webhook host — only if user enables n8n in Labs

---

## 5. Smoke Test After Install

1. Open any HH.ru vacancy page (e.g., `https://hh.ru/vacancy/12345678`).
2. Confirm the **VacancyPilot badge** appears on the page (small floating badge, top-right area).
3. Click the badge — the **side panel** should open with vacancy details.
4. Click the extension icon in the toolbar — the **popup** should open.
5. Click "Dashboard" from the popup — the dashboard page should open.
6. Check that no errors appear in the browser console (F12 → Console).

If the badge does not appear:
- Check that the extension is enabled in `chrome://extensions/`.
- Ensure you are on a `https://*.hh.ru/vacancy/*` URL.
- Check `chrome.storage.local` settings: `showPageBadge` must not be `false`.

---

## 6. Onboarding

On first install, the extension shows an onboarding flow that explains:
- Permissions and what data is accessed
- Storage (local-only, no cloud sync)
- AI features (opt-in, BYOK)
- n8n integration (opt-in, Labs)
- Non-goals (no auto-apply, no auto-click)

---

## 7. Quick Feature Tour

### Parse a vacancy
Navigate to any HH.ru vacancy. The extension automatically extracts title, company, salary, description, and skills.

### Score a vacancy
Open the side panel. A rule-based score (0–100) is displayed with a breakdown of factors.

### Track application status
From the side panel, change the status: Saved → Applied → Interview → Offer → Rejected → Archived. Status history is recorded.

### AI analysis (requires API key)
1. Go to extension **Settings** → **AI**.
2. Enter your API key (OpenAI-compatible provider).
3. Configure privacy mode (Standard or Strict).
4. On a vacancy page, click **Analyze** in the side panel.
5. Review the **payload preview** before confirming.
6. AI analysis results appear in the side panel.

### Generate a cover letter
1. From the vacancy side panel, click **Cover Letter**.
2. Select mode (short / full / concise).
3. Click **Generate**.
4. Edit the generated text if needed.
5. **Save** or **Copy** the letter.

### Export data
1. Go to extension **Settings** → **Data**.
2. Click **Export CSV** or **Export JSON**.
3. File downloads to your default download location.

### Delete all data
1. Go to extension **Settings** → **Data**.
2. Click **Delete All Data**.
3. Confirm the action.

---

## 8. Uninstalling

1. Go to `chrome://extensions/`.
2. Find "VacancyPilot".
3. Click **Remove**.
4. All local data is deleted with the extension.

To keep data before uninstalling, export first (CSV or JSON).

---

## 9. Troubleshooting

| Problem | Check |
|---------|-------|
| Badge not appearing | Only on `https://*.hh.ru/vacancy/*` pages. Check `showPageBadge` setting. |
| Side panel not opening | Click the badge or extension icon → "Open side panel". Ensure `sidePanel` permission is granted. |
| AI request fails | Check API key in Settings. Check network connectivity. Review payload preview for errors. |
| Parser returns no data | HH page may have changed DOM. Check browser console for parser errors. Report with vacancy URL. |
| Extension crashes | Reload extension in `chrome://extensions/`. Check console for error stack traces. |

---

## 10. Updating

To update to a newer build:

```bash
git pull
pnpm install
pnpm build
```

Then:
1. Go to `chrome://extensions/`.
2. Find "VacancyPilot".
3. Click the **reload** icon (circular arrow).
4. Your data persists across reloads (stored in IndexedDB and `chrome.storage.local`).

---

## 11. Development

For development with hot reload:

```bash
pnpm dev
```

This starts WXT in development mode. Load the `.output/chrome-mv3-dev/` directory as an unpacked extension. Changes to source files trigger automatic rebuild.
