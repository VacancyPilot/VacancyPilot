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
import { defineContentScript } from "wxt/sandbox";
import { HHAdapter } from "@/adapters/hh/hh-adapter";
import { BADGE_KEY_PREFIX, badgeStorageKey } from "@/services/badge-state";
import type { SearchBadgeState } from "@/services/search-badge-render";
import {
  injectSearchBadgeStyles,
  createBadgeHost,
  attachBadgeToCard,
  findSearchCardElements,
  buildCardElementMap,
  buildSearchBadgeHTML,
  appendActionButtons,
} from "@/services/search-badge-render";
import type { RawSearchItemDTO } from "@/adapters/types";

export default defineContentScript({
  matches: ["https://hh.ru/search/vacancy*", "https://*.hh.ru/search/vacancy*"],
  main() {
    void injectSearchBadges();
  },
});

/**
 * Main orchestration: parse cards, load badge state, render badges.
 */
async function injectSearchBadges(): Promise<void> {
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

  // ── Batch-load badge state from chrome.storage.local ────────────────
  const keys = cards.map((c) => badgeStorageKey(c.sourceId));
  const badgeStates: Record<string, SearchBadgeState> = {};

  try {
    const raw = await chrome.storage.local.get(keys);
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith(BADGE_KEY_PREFIX) && value) {
        const state = value as SearchBadgeState;
        const vacancyId = key.slice(BADGE_KEY_PREFIX.length);
        badgeStates[vacancyId] = state;
      }
    }
  } catch {
    // Non-critical — badges will show work-mode only.
  }

  // ── Map DOM elements to vacancy IDs ─────────────────────────────────
  const cardElements = findSearchCardElements(document);
  const cardMap = buildCardElementMap(cardElements);

  // ── Inject styles once ─────────────────────────────────────────────
  injectSearchBadgeStyles(document);

  // ── Attach badges with quick action buttons ─────────────────────────
  for (const card of cards) {
    try {
      const cardEl = cardMap.get(card.sourceId);
      if (!cardEl) continue;

      const state = badgeStates[card.sourceId];
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
        void handleQuickSave(card, host);
      });

      rejectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        void handleQuickReject(card, host);
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
  host: HTMLElement,
): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({
      type: "QUICK_SAVE_SEARCH_CARD",
      card,
    })) as QuickActionResponse;

    if (response.success) {
      refreshBadgeHost(host, card, {
        status: response.status ?? "saved",
        score: response.score,
      });
    }
  } catch {
    // Silently ignore — quick actions are non-critical.
  }
}

async function handleQuickReject(
  card: RawSearchItemDTO,
  host: HTMLElement,
): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({
      type: "QUICK_REJECT_SEARCH_CARD",
      card,
    })) as QuickActionResponse;

    if (response.success) {
      refreshBadgeHost(host, card, {
        status: "rejected_by_me",
        score: response.score,
      });
    }
  } catch {
    // Silently ignore.
  }
}

/**
 * Refresh a badge host in-place after a quick action.
 * Rebuilds the inner HTML and preserves action buttons.
 */
function refreshBadgeHost(
  host: HTMLElement,
  card: RawSearchItemDTO,
  newState: SearchBadgeState,
): void {
  // Preserve action buttons wrapper (last child).
  const actionsWrapper = host.querySelector(".vp-sb-actions");

  // Rebuild badge content.
  const html = buildSearchBadgeHTML(card, newState);

  // Clear and rebuild inner content.
  host.innerHTML = html || "";

  // Re-attach action buttons if they were present.
  if (actionsWrapper) {
    host.appendChild(actionsWrapper);
  }
}
