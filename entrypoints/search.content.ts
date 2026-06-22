/**
 * Search page content script — ITER-034 / ITER-035.
 *
 * Runs on HH.ru search result pages and injects lightweight triage badges
 * onto visible search cards. Badges show score, status, and work mode hints
 * from local data (chrome.storage.local badge state) and visible-card parsing.
 *
 * ITER-035 addition: quick save/reject action buttons on each badge.
 *
 * Rules:
 * - No hidden fetches, no auto-click, no form fill.
 * - Read-first, local-only data presentation.
 * - Lightweight DOM — no React, minimal per-card footprint.
 * - Quick actions affect only local data via background messages.
 */
import { defineContentScript } from "wxt/utils/define-content-script";
import { HHAdapter } from "@/adapters/hh/hh-adapter";
import { BADGE_KEY_PREFIX, badgeStorageKey } from "@/services/badge-state";
import type { SearchBadgeState } from "@/services/search-badge-render";
import {
  applySearchCardState,
  injectSearchBadgeStyles,
  createBadgeHost,
  attachBadgeToCard,
  findSearchCardElements,
  buildCardElementMap,
  appendActionButtons,
} from "@/services/search-badge-render";
import type { RawSearchItemDTO } from "@/adapters/types";
import {
  createRenderScheduler,
  observeDynamicSearchList,
} from "@/services/search-page-sync";

export default defineContentScript({
  matches: ["https://hh.ru/search/vacancy*", "https://*.hh.ru/search/vacancy*"],
  main() {
    void startSearchBadgeSync();
  },
});

let searchListObserver: MutationObserver | null = null;
let searchBadgeRenderGeneration = 0;

async function startSearchBadgeSync(): Promise<void> {
  await injectSearchBadges();

  if (searchListObserver) return;

  const scheduleRefresh = createRenderScheduler(() => injectSearchBadges());
  searchListObserver = observeDynamicSearchList(document, scheduleRefresh);

  window.addEventListener(
    "pagehide",
    () => {
      searchListObserver?.disconnect();
      searchListObserver = null;
    },
    { once: true },
  );
}

/**
 * Main orchestration: parse cards, load badge state, render badges.
 */
async function injectSearchBadges(): Promise<void> {
  const generation = ++searchBadgeRenderGeneration;

  // ── Respect user settings ───────────────────────────────────────────
  try {
    const result = await chrome.storage.local.get("app_settings_v1");
    const settings = result["app_settings_v1"] as
      | { general?: { showPageBadge?: boolean } }
      | undefined;
    if (settings?.general?.showPageBadge === false) return;
  } catch {
    // On read failure, show badges by default.
  }

  // ── Parse visible search cards ─────────────────────────────────────
  const adapter = new HHAdapter();
  const cards = adapter.extractSearchList(document);
  if (cards.length === 0) return;

  const vacancyIds = Array.from(
    new Set(
      cards
        .map((card) => card.sourceId)
        .filter((vacancyId): vacancyId is string => vacancyId.length > 0),
    ),
  );

  // ── Batch-load highlight state from background and legacy storage ──────
  const [highlightStates, badgeStates] = await Promise.all([
    loadSearchHighlightStates(vacancyIds),
    loadLegacyBadgeStates(vacancyIds),
  ]);
  if (generation !== searchBadgeRenderGeneration) return;

  // ── Map DOM elements to vacancy IDs ─────────────────────────────────
  const cardElements = findSearchCardElements(document);
  const cardMap = buildCardElementMap(cardElements);

  // ── Inject styles once ─────────────────────────────────────────────
  injectSearchBadgeStyles(document);

  // ── Attach badges with quick action buttons ─────────────────────────
  for (const card of cards) {
    if (generation !== searchBadgeRenderGeneration) return;

    try {
      const cardEl = cardMap.get(card.sourceId);
      if (!cardEl) continue;

      const state: SearchBadgeState = {
        ...badgeStates[card.sourceId],
        ...highlightStates[card.sourceId],
      };
      applySearchCardState(cardEl, state);

      if (state.hidden) {
        continue;
      }

      const badge = createBadgeHost(card, state);

      // Always create a host for action buttons, even if badge is null.
      const host = badge ?? document.createElement("span");
      if (!badge) {
        host.className = "vp-sb-host";
        host.style.display = "inline-flex";
      }

      // Append quick action buttons.
      const { saveBtn, rejectBtn } = appendActionButtons(host);

      // Wire click handlers — each sends a message to the background.
      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        void handleQuickSave(card);
      });

      rejectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        void handleQuickReject(card);
      });

      attachBadgeToCard(cardEl, host);
    } catch {
      // One malformed card must not break badges for the rest.
      continue;
    }
  }
}

// ── Quick action handlers ──────────────────────────────────────────────

interface QuickActionResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  score?: number;
  error?: string;
}

async function handleQuickSave(
  card: RawSearchItemDTO,
): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({
      type: "QUICK_SAVE_SEARCH_CARD",
      card,
    })) as QuickActionResponse;

    if (response.success) {
      void injectSearchBadges();
    }
  } catch {
    // Silently ignore — quick actions are non-critical.
  }
}

async function handleQuickReject(
  card: RawSearchItemDTO,
): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({
      type: "QUICK_REJECT_SEARCH_CARD",
      card,
    })) as QuickActionResponse;

    if (response.success) {
      void injectSearchBadges();
    }
  } catch {
    // Silently ignore.
  }
}

async function loadLegacyBadgeStates(
  vacancyIds: string[],
): Promise<Record<string, SearchBadgeState>> {
  const states: Record<string, SearchBadgeState> = {};

  try {
    const keys = vacancyIds.map((vacancyId) => badgeStorageKey(vacancyId));
    const raw = await chrome.storage.local.get(keys);
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith(BADGE_KEY_PREFIX) && value) {
        const state = value as SearchBadgeState;
        const vacancyId = key.slice(BADGE_KEY_PREFIX.length);
        states[vacancyId] = state;
      }
    }
  } catch {
    // Non-critical — badges will fall back to background-derived state.
  }

  return states;
}

interface SearchHighlightMessageResponse {
  success?: boolean;
  states?: Record<string, SearchBadgeState>;
  error?: string;
}

async function loadSearchHighlightStates(
  vacancyIds: string[],
): Promise<Record<string, SearchBadgeState>> {
  if (vacancyIds.length === 0) {
    return {};
  }

  try {
    const response = (await chrome.runtime.sendMessage({
      type: "GET_SEARCH_HIGHLIGHT_STATES",
      vacancyIds,
    })) as SearchHighlightMessageResponse;

    if (response?.success && response.states) {
      return response.states;
    }
  } catch {
    // Non-critical — badges fall back to legacy state and work mode.
  }

  return {};
}
