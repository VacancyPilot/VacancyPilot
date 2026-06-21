# Side Panel Runtime Debug Report

## Original failure

```text
sidePanel.open() may only be called in response to a user gesture
The background's main() function return a promise, but it must be synchronous
```

## Root cause

- Popup delegated side-panel opening to the background service worker through `runtime.sendMessage`.
- The Chrome user gesture was lost on the background hop, so `chrome.sidePanel.open()` could be rejected even though the user had clicked the popup button.
- The background entrypoint also booted migrations through `defineBackground(async () => ...)`, which caused the service-worker startup warning because listener registration was no longer fully synchronous.

## Fix

- Background startup now keeps listener registration synchronous and moves schema boot into `bootBackground()` invoked via `void`.
- Popup now sends side-panel context separately with `SET_SIDE_PANEL_CONTEXT`.
- Popup opens the side panel directly from the click path and shows explicit loading/error feedback.
- Side panel retries `GET_SIDE_PANEL_CONTEXT` briefly to survive the popup-to-panel timing race.

## Manual QA

| Case | Result | Notes |
| --- | --- | --- |
| Popup -> Side Panel on saved vacancy | pending | Verify panel opens and current vacancy context loads |
| Popup -> Side Panel before Save | pending | Verify panel opens with graceful empty/saved-later state |
| Content badge -> Side Panel | pending | Verify badge path still works or degrades safely |
| Side panel refresh keeps context | pending | Verify current vacancy remains resolvable after refresh |
| Non-HH page | pending | Verify clear fallback state |
| Chrome version | pending | Confirm tested browser version |
| Edge latest | pending | Optional secondary-browser smoke check |
