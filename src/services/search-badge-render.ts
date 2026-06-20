/**
 * Search badge rendering helpers — ITER-034.
 *
 * Pure DOM rendering functions for compact search-result badges.
 * No chrome.* API calls, no network — pure data → DOM transformation.
 * Content script injects and orchestrates; this module renders.
 */

import type { RawSearchItemDTO } from "@/adapters/types";

// ── Badge state shape (mirrors BadgeState from badge-state.ts) ──────────────

export interface SearchBadgeState {
  score?: number;
  status?: string;
}

// ── Work mode labels ───────────────────────────────────────────────────────

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "УД",
  hybrid: "Гиб",
  office: "Оф",
};

const WORK_MODE_CSS: Record<string, string> = {
  remote: "vp-sb-wm--remote",
  hybrid: "vp-sb-wm--hybrid",
  office: "vp-sb-wm--office",
};

// ── Status icons ───────────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, string> = {
  saved: "✓",
  viewed: "👁",
  letter_ready: "✉",
  applied: "📨",
  rejected_by_me: "✕",
  rejected_by_company: "✗",
  interview: "📅",
  offer: "🏆",
  hr_replied: "💬",
  test_task: "📋",
  new: "●",
  blacklist: "🚫",
};

const STATUS_LABELS: Record<string, string> = {
  saved: "сохр",
  viewed: "смтр",
  letter_ready: "письмо",
  applied: "отклк",
  rejected_by_me: "отклз",
  rejected_by_company: "отказ",
  interview: "собес",
  offer: "офер",
  hr_replied: "ответ",
  test_task: "тест",
  new: "нов",
  blacklist: "блк",
};

function escapeHTML(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ── Score color classes ───────────────────────────────────────────────────

function scoreClass(score: number): string {
  if (score >= 80) return "vp-sb-score--high";
  if (score >= 50) return "vp-sb-score--mid";
  return "vp-sb-score--low";
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Build the HTML content string for a single search badge.
 * Returns empty string when there is nothing to show.
 */
export function buildSearchBadgeHTML(
  card: RawSearchItemDTO,
  state: SearchBadgeState | undefined,
): string {
  const parts: string[] = [];

  // Score (from local badge state)
  if (state?.score !== undefined && state.score !== null) {
    const cls = `vp-sb-score ${scoreClass(state.score)}`;
    parts.push(`<span class="${cls}">${escapeHTML(String(state.score))}</span>`);
  }

  // Status icon + short label (from local badge state)
  if (state?.status) {
    const icon = STATUS_ICONS[state.status] ?? "";
    const label = escapeHTML(STATUS_LABELS[state.status] ?? state.status);
    const title = escapeHTML(state.status);
    parts.push(
      `<span class="vp-sb-status" title="${title}">${icon}${label}</span>`,
    );
  }

  // Work mode (from visible card data)
  if (card.workMode && card.workMode !== "unknown" && card.workMode !== null) {
    const label = escapeHTML(WORK_MODE_LABELS[card.workMode] ?? card.workMode);
    const cls = WORK_MODE_CSS[card.workMode] ?? "";
    parts.push(`<span class="vp-sb-wm ${cls}">${label}</span>`);
  }

  if (parts.length === 0) return "";

  return `<span class="vp-sb-container">${parts.join("")}</span>`;
}

/**
 * Inject scoped search badge styles into the document <head>.
 * Idempotent — does nothing if styles already exist.
 */
export function injectSearchBadgeStyles(doc: Document): void {
  if (doc.getElementById("vp-search-badge-styles")) return;

  const style = doc.createElement("style");
  style.id = "vp-search-badge-styles";
  style.textContent = `
    /* VacancyPilot search badge host — inline wrapper on each card */
    .vp-sb-host {
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      vertical-align: middle;
    }

    /* Container for badge pieces */
    .vp-sb-container {
      display: inline-flex;
      gap: 3px;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 10px;
      line-height: 1;
      white-space: nowrap;
    }

    /* Score pill */
    .vp-sb-score {
      background: #4a90d9;
      color: #fff;
      border-radius: 8px;
      padding: 1px 5px;
      font-size: 10px;
      font-weight: 600;
      line-height: 16px;
      min-width: 18px;
      text-align: center;
    }
    .vp-sb-score--high { background: #2a8; }
    .vp-sb-score--mid  { background: #e6a817; color: #333; }
    .vp-sb-score--low  { background: #c44; }

    /* Status text */
    .vp-sb-status {
      font-size: 10px;
      color: #666;
      max-width: 70px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Work mode pill */
    .vp-sb-wm {
      font-size: 9px;
      color: #999;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 0 3px;
      line-height: 14px;
    }
    .vp-sb-wm--remote { color: #2a8; border-color: #2a8; }
    .vp-sb-wm--hybrid { color: #e6a817; border-color: #e6a817; }
    .vp-sb-wm--office { color: #888; border-color: #ccc; }

    /* Quick action buttons */
    .vp-sb-actions {
      display: inline-flex;
      gap: 2px;
      margin-left: 2px;
    }
    .vp-sb-action {
      all: initial;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1px solid transparent;
      border-radius: 3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 11px;
      line-height: 1;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease;
      color: #666;
      background: transparent;
    }
    .vp-sb-host:hover .vp-sb-action {
      opacity: 1;
    }
    .vp-sb-action:hover {
      background: #f0f0f0;
      border-color: #ccc;
    }
    .vp-sb-action--save:hover {
      color: #2a8;
      border-color: #2a8;
    }
    .vp-sb-action--reject:hover {
      color: #c44;
      border-color: #c44;
    }
  `;
  doc.head.appendChild(style);
}

/**
 * Create a badge host element for a single search card.
 * Does NOT attach it to the DOM — caller positions it.
 */
export function createBadgeHost(
  card: RawSearchItemDTO,
  state: SearchBadgeState | undefined,
  doc: Document = document,
): HTMLElement | null {
  const html = buildSearchBadgeHTML(card, state);
  if (!html) return null;

  const host = doc.createElement("span");
  host.className = "vp-sb-host";
  host.innerHTML = html;
  return host;
}

/**
 * Attach a badge to a search card element by inserting it into the
 * best available header slot. Idempotent — skips if a badge already exists.
 */
export function attachBadgeToCard(
  cardEl: Element | null,
  badge: HTMLElement,
): void {
  if (!cardEl) return;
  if (cardEl.querySelector(".vp-sb-host")) return;

  // Find the card's header area — prefer dedicated header class, fall back to first h3.
  const header =
    cardEl.querySelector(".serp-item__header") ??
    cardEl.querySelector("h3") ??
    cardEl.querySelector(".vacancy-serp-item__header") ??
    cardEl.firstElementChild;

  if (!header) return;

  header.appendChild(badge);
}

/**
 * Build a map from vacancy ID → card Element using title link href parsing.
 */
export function buildCardElementMap(elements: Element[]): Map<string, Element> {
  const map = new Map<string, Element>();

  const titleSelectors = [
    '[data-qa="serp-item__title"]',
    "a.serp-item__title",
    ".serp-item__title a",
    '[data-qa="vacancy-serp__title"]',
    ".vacancy-serp-item__title a",
  ];

  for (const el of elements) {
    for (const sel of titleSelectors) {
      try {
        const link = el.querySelector(sel);
        if (link) {
          const href = link.getAttribute("href");
          const match = href?.match(/\/vacancy\/(\d+)/i);
          if (match) {
            map.set(match[1], el);
            break;
          }
        }
      } catch {
        continue;
      }
    }
  }

  return map;
}

/**
 * Find search card container elements in the document.
 * Uses the same selector groups as HHAdapter.findSearchCards.
 */
export function findSearchCardElements(doc: Document): Element[] {
  const selectors = [
    '[data-qa="vacancy-serp-item"]',
    ".serp-item",
    '[data-qa="vacancy-serp"]',
    "div.vacancy-serp-item",
  ];

  for (const selector of selectors) {
    try {
      const elements = Array.from(doc.querySelectorAll(selector));
      if (elements.length > 0) return elements;
    } catch {
      continue;
    }
  }

  return [];
}

// ── Quick action buttons (ITER-035) ────────────────────────────────────────

/**
 * Create a quick-save button element.
 * Does NOT attach event listeners — callers wire the click handler.
 */
export function createSaveButton(doc: Document = document): HTMLButtonElement {
  const btn = doc.createElement("button");
  btn.className = "vp-sb-action vp-sb-action--save";
  btn.textContent = "⊕";
  btn.title = "Save vacancy";
  btn.setAttribute("type", "button");
  return btn;
}

/**
 * Create a quick-reject button element.
 * Does NOT attach event listeners — callers wire the click handler.
 */
export function createRejectButton(
  doc: Document = document,
): HTMLButtonElement {
  const btn = doc.createElement("button");
  btn.className = "vp-sb-action vp-sb-action--reject";
  btn.textContent = "⊗";
  btn.title = "Reject vacancy";
  btn.setAttribute("type", "button");
  return btn;
}

/**
 * Append save and reject action buttons to a badge host element.
 * Returns the wrapper span so callers can add event listeners
 * to individual buttons.
 */
export function appendActionButtons(
  badgeHost: HTMLElement,
  doc: Document = document,
): {
  wrapper: HTMLElement;
  saveBtn: HTMLButtonElement;
  rejectBtn: HTMLButtonElement;
} {
  const wrapper = doc.createElement("span");
  wrapper.className = "vp-sb-actions";

  const saveBtn = createSaveButton(doc);
  const rejectBtn = createRejectButton(doc);

  wrapper.appendChild(saveBtn);
  wrapper.appendChild(rejectBtn);
  badgeHost.appendChild(wrapper);

  return { wrapper, saveBtn, rejectBtn };
}
