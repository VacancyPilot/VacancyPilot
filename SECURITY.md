# Security Policy

VacancyPilot is a **local-first browser extension**. It reads HH.ru pages visually and stores all data locally. No data is sent to external servers by default.

## Reporting a Security Issue

If you discover a security vulnerability, **report it privately** to the repository owner. Do not open a public issue.

GitHub → [Report a vulnerability](https://github.com/VacancyPilot/VacancyPilot/security/advisories/new)

## Forbidden Patterns in this Repository

The following patterns are **never allowed** in Core:

- **No auto-submit** — the extension never submits forms or applications on behalf of the user.
- **No auto-click** — the extension never programmatically clicks HH.ru UI controls.
- **No form writes** — the extension never writes values into HH.ru form fields.
- **No hidden HH fetch** — no fetch/XHR requests to HH.ru endpoints from content or background scripts.
- **No CAPTCHA bypass** — no attempts to detect, solve, or circumvent CAPTCHA.
- **No cookie/session handling** — the extension does not access HH.ru cookies, tokens, or session state.
- **No telemetry by default** — no analytics, crash reporting, or usage tracking is included or enabled by default.

## Dependency Security

Dependencies are kept up-to-date via Dependabot (`.github/dependabot.yml`). All updates are reviewed before merge.

## Build and Release

- All changes pass `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:release` before merge.
- Build output is never committed to the repository.
- Release artifacts are generated from a clean CI build.
