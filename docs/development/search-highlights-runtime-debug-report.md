# Search Highlights Runtime Debug Report

Date: 2026-06-22
Branch: `fix/search-highlights-card-discovery`

## Confirmed Before State

Observed manually on a real HH search page before this fix:

```text
URL matches search.content.ts: true
HH card containers found by old selectors: 0
Vacancy links found: 50
Unique vacancy IDs found: 50
VP styles injected: false
VP badge hosts: 0
VP badge containers: 0
visitMarks count: 8
jobs count: 5
```

Known local vacancy states present in the current search result:

```text
134377651 - viewed + saved, score 47
134439278 - viewed
134450043 - viewed
134451961 - viewed + saved, score 37
134452248 - viewed + saved, score 52
```

## Root Cause

`entrypoints/search.content.ts` previously depended on
`HHAdapter.extractSearchList(document)`. On the current HH search DOM the legacy
card container selectors can return `0`, even when the page still contains
`50` vacancy links. The content script returned before injecting
`#vp-search-badge-styles` or attaching `.vp-sb-host` markers.

The previous flow also gated search highlights on `showPageBadge`. Search
highlights now depend on `searchHighlightsEnabled`; the page badge remains a
separate setting.

## Before / After Matrix

| Check | Before | After |
|---|---:|---:|
| URL matches | true | requires live HH QA |
| Old card containers | 0 | 0 in synthetic regression |
| Vacancy links | 50 | 50 in synthetic regression |
| Unique vacancy IDs | 50 | 50 in synthetic regression |
| Discovered cards | 0 | 50 in synthetic regression |
| VP styles injected | false | covered by render tests |
| VP badge hosts | 0 | covered by render tests |
| Attached markers | 0 | expected > 0; requires live HH QA |

## Implemented Diagnostics

Opt-in debug is enabled only when either condition is true:

```ts
new URLSearchParams(location.search).has("vpDebug") ||
localStorage.getItem("vpDebugSearchHighlights") === "1";
```

When enabled, the content script logs only technical counts:

```text
[VacancyPilot][SearchHighlights] started
url
adapterCardsCount
discoveredCardsCount
vacancyIdsCount
statesCount
legacyStatesCount
attachedCount
hiddenCount
controls
errorsCount
```

The overlay text is intentionally small:

```text
VP Search: adapter 0 · discovered 50 · states 8 · attached 50
```

It does not log API keys, cookies, HTML, vacancy descriptions, resume content,
or notes.

## Manual QA Command

Run this in the page console on a real HH search page after loading the
unpacked extension:

```js
(() => {
  return {
    styles: Boolean(document.querySelector("#vp-search-badge-styles")),
    hosts: document.querySelectorAll(".vp-sb-host").length,
    containers: document.querySelectorAll(".vp-sb-container").length,
    text: Array.from(document.querySelectorAll(".vp-sb-host"))
      .slice(0, 10)
      .map((el) => el.textContent?.trim()),
  };
})();
```

Expected after the fix:

```text
styles: true
hosts: > 0
containers: > 0
text includes VP markers
```

## Manual QA Cases

1. Open a real HH search page with no visit marks.
2. Confirm visible `VP new` markers.
3. Open a vacancy from the search page.
4. Return to the search page.
5. Confirm a `VP viewed` marker.
6. Save a vacancy locally.
7. Confirm `VP saved` and score marker when score exists.
8. Reject a vacancy locally.
9. Confirm rejected behavior follows `dim`, `hide`, or `none`.
10. Disable Search Highlights.
11. Confirm markers disappear.
12. Set `showPageBadge=false`.
13. Confirm Search Highlights remain visible.
14. Enable `vpDebug=1`.
15. Confirm the overlay shows adapter/discovered/states/attached counts.

## Local Validation Evidence

Full validation passed:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:release
```

Focused tests passed:

```text
src/services/search-card-discovery.test.ts
src/services/search-badge-render.test.ts
src/services/search-highlights.test.ts
src/release-safety/search-highlights-flow-safety.test.ts
```

These tests cover:

```text
old containers 0
vacancy links 50
discovered cards 50
body/html never returned as card
neutral marker visible for unknown cards
viewed/saved/rejected/score rendering helpers
search.content.ts is not gated on showPageBadge
searchHighlightsEnabled=false clears extension markers
```

Manual HH browser QA not available in this environment.
