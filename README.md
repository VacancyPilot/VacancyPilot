# VacancyPilot

Local-first browser extension concept for HH.ru job search: vacancy analysis, explainable scoring, cover letter preparation, and personal application tracking.

Current status: specification-first repository. Implementation has not started yet.

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

## Repository Layout

```text
docs/
  Техническое заданиеV.1.md
  search/
    *.md
AGENTS.md
README.md
```

Implementation folders will be added when Phase 0 starts.

