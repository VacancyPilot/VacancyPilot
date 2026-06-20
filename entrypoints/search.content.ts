/**
 * Search page content script — ITER-034.
 *
 * Runs on HH.ru search result pages and injects lightweight triage badges
 * onto visible search cards. Badges show score, status, and work mode hints
 * from local data (chrome.storage.local badge state) and visible-card parsing.
 *
 * Rules:
 * - No hidden fetches, no auto-click, no form fill.
 * - Read-first, local-only data presentation.
 * - Lightweight DOM — no React, minimal per-card footprint.
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
} from "@/services/search-badge-render";

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

  // ── Attach badges ──────────────────────────────────────────────────
  for (const card of cards) {
    try {
      const cardEl = cardMap.get(card.sourceId);
      if (!cardEl) continue;

      const state = badgeStates[card.sourceId];
      const badge = createBadgeHost(card, state);
      if (!badge) continue;

      attachBadgeToCard(cardEl, badge);
    } catch {
      // One malformed card must not break badges for the rest.
      continue;
    }
  }
}
