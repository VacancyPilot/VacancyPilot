# AI Runtime Smoke Test Report

**Date:** 2026-06-22
**Branch:** `fix/ai-and-sidepanel-runtime-ux`

## Original issues

1. **Preview appeared to request OpenAI permission / external access.**
   - Investigation showed `prepareCoverLetterAiRequest` already uses only local calls (DB reads, `chrome.permissions.contains` — passive check, `generateCoverLetterPreview` — pure function).
   - No `chrome.permissions.request`, `fetch`, or OpenAI provider instantiation occurs during preview.
   - Added explicit tests confirming Preview isolation.

2. **`gpt-5.5` failed with unsupported `max_tokens`.**
   - Root cause: `callOpenAI()` in `ai-provider-openai.ts` hardcoded `max_tokens: 1500` in the request body.
   - GPT-5, o1, o3, o4 family models require `max_completion_tokens` instead.

## AI flow diagnosis

| Action | Should request permission? | Should call OpenAI? | Current behavior |
|---|---:|---:|---|
| Preview AI Payload | No | No | Uses `previewCoverLetterPayload` (local DB/settings reads + passive `chrome.permissions.contains` only) |
| Generate Draft | Yes, if not granted | Yes | Uses `generateCoverLetterDraft` → `ensureProviderOriginAccess` → provider call |

## Fix

### 1. OpenAI token parameter compatibility

- Added `getOpenAITokenLimitParam(model, value)` — returns `{ max_completion_tokens }` for GPT-5 / o-series models, `{ max_tokens }` for all others.
- Updated `callOpenAI()` to use the helper via spread: `...getOpenAITokenLimitParam(model, 1500)`.
- For `gpt-5.5`, the request body now sends `max_completion_tokens: 1500` instead of `max_tokens: 1500`.

**Decision:** Model-aware helper (not universal `max_completion_tokens` for all models) to avoid breaking legacy models that may not support the new parameter.

### 2. AI error handling improvement

- Added `OPENAI_ERROR_MAP` with user-friendly messages for:
  - `unsupported_parameter` — includes guidance about `max_completion_tokens` for newer models.
  - `model_not_found`
  - `insufficient_quota`
  - `invalid_api_key`
  - `rate_limit_exceeded`
- Added `mapOpenAIError(status, errorBody)` — maps error codes first, then falls back to HTTP status codes (401, 403, 429, 402), then to server message.
- Added 403 handling (previously unhandled).

### 3. Preview isolation (already correct, now verified with tests)

- Added explicit API-level split:
  - `previewCoverLetterPayload(...)` — preview path (strictly local)
  - `generateCoverLetterDraft(...)` — generation path (permission + provider call)
- `previewCoverLetterPayload` uses only:
  - `chrome.storage.local` (settings read)
  - Dexie/IndexedDB (job, profile, resume reads)
  - Pure functions (input builder, payload preview, permission check via `chrome.permissions.contains`)
- Added 3 new tests confirming:
  - Preview does not call `ensureProviderOriginAccess` (which can trigger permission request)
  - Preview does not call `getLLMProvider` (which would instantiate a provider for API calls)
  - Preview does not call `recordAiRequest` (which would increment usage)

### 4. Usage counter and cache correctness

- **Already correct in codebase:**
  - `prepareCoverLetterAiRequest` (Preview) never calls `recordAiRequest`
  - `generateCoverLetterAiDraft` only calls `recordAiRequest` after successful generation (line 166)
  - Failed OpenAI requests throw before `recordAiRequest` is reached
  - Cache is only written after successful response (`storeCoverLetterCache` on line 156)
  - Cache key includes: `inputHash`, `provider`, `model`, `promptVersion` (all checked in `checkCacheEntry`)

## Files changed

| File | Change |
|---|---|
| `src/services/ai-provider-openai.ts` | Added `getOpenAITokenLimitParam`, `OPENAI_ERROR_MAP`, `mapOpenAIError`; updated `callOpenAI` |
| `src/services/ai-provider-openai.test.ts` | Added `getOpenAITokenLimitParam` suite (8 tests) + error mapping suite (6 tests) |
| `src/services/cover-letter-ai.ts` | Added explicit split functions `previewCoverLetterPayload` / `generateCoverLetterDraft` |
| `src/services/index.ts` | Exported new split functions |
| `src/components/CoverLetterStudio.tsx` | Switched handlers to `previewCoverLetterPayload` and `generateCoverLetterDraft` |
| `src/services/cover-letter-ai.test.ts` | Added Preview isolation tests (3 tests) + imported `getLLMProvider` |

## Manual QA

| Case | Result | Notes |
|---|---|---|
| Preview payload before API permission | Not run manually | Covered by automated tests: no permission request, no provider call |
| Preview payload after API permission | Not run manually | Covered by automated tests; preview remains local and only reads passive permission state |
| Generate Draft with gpt-5.5 | Not run manually | Covered by automated tests verifying `max_completion_tokens` request body |
| Generate Draft with cache enabled | Not run manually | Covered by existing automated cache-hit test |
| Usage counter after preview | Not run manually | Covered by automated test: `recordAiRequest` not called during preview |
| Usage counter after generation | Not run manually | Covered by existing automated success-path test |
| OpenAI permission status | Not run manually | Covered by unit tests: preview uses passive check, generate uses active request |
| GPT-4o continues to use legacy max_tokens | Not run manually | Covered by automated compatibility tests |
| Unsupported parameter error mapped | Not run manually | Covered by automated error-mapping test |
| model_not_found error mapped | Not run manually | Covered by automated error-mapping test |
| 403 error mapped | Not run manually | Covered by automated error-mapping test |

## Remaining issues

- Manual Chrome QA (real browser with real API key) not performed — requires runtime environment.
- `gpt-5.5` token limit fix tested only at unit level with mocked fetch.
- DeepSeek provider error handling not yet implemented (not in scope for this iteration).
