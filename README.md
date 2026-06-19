# VacancyPilot

Local-first browser extension concept for HH.ru job search: vacancy analysis, explainable scoring, cover letter preparation, and personal application tracking.

Current status: Phase 0 — local storage schema in progress (ITER-004).

## Source Of Truth

- Final technical specification: [docs/Техническое заданиеV.1.md](docs/Техническое%20заданиеV.1.md)
- External model audits and recommendations: [docs/search/](docs/search/)

The product is intentionally not an auto-apply bot. Core scope is read-first and user-controlled:

```text
open vacancy -> extract -> score -> save -> AI if needed -> letter -> copy -> track -> export
```

## Planned Stack

- WXT
- Manifest V3
- TypeScript
- React
- Dexie / IndexedDB
- `chrome.storage.local`

## Development Notes

Before coding, read `AGENTS.md` and the final specification. The main safety constraints are:

- no auto-submit;
- no auto-clicks on HH;
- no programmatic form fill in Core;
- no hidden HH fetches;
- no broad permissions such as `<all_urls>`, `cookies`, or `webRequest`;
- AI and n8n are opt-in only.

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev mode with hot reload (Chrome)
pnpm build            # Production build
pnpm typecheck        # TypeScript check
pnpm lint             # Lint code
pnpm test             # Run tests
```

## Repository Layout

```text
docs/
  Техническое заданиеV.1.md
  search/
    *.md
entrypoints/          # Extension entrypoints (popup, sidepanel, options, background, content)
public/               # Static assets (icons)
src/                  # Shared source code
AGENTS.md
README.md
```
