// ── HH HR communication page selectors ──
// Selectors for parsing visible HR communication signals
// from user-opened HH application / negotiation pages.
//
// These are read-only DOM queries. No form interaction, no network.
//
// Versioned alongside vacancy selectors; bump when fixtures show breakage.

export const HR_SELECTOR_VERSION = "v1.0.0";

/**
 * Primary CSS selectors for HH.ru application/negotiation pages.
 * Prefer stable data-qa attributes; fall back to semantic selectors.
 */
export const HR_SELECTORS = {
  /** Individual message / communication blocks in a negotiation thread */
  messageBlocks: [
    '[data-qa="negotiation-message"]',
    '[data-qa="vacancy-response-letter"]',
    ".negotiations-message",
    ".chat-message",
    ".negotiation-item",
    ".response-letter",
  ],

  /** Visible status badge on a response card (e.g. "Приглашение", "Отказ") */
  statusBadge: [
    '[data-qa="negotiation-status"]',
    '[data-qa="vacancy-response-status"]',
    ".vacancy-response-status",
    ".negotiations-status",
    ".response-status-tag",
    ".bloko-tag",
  ],

  /** Text content of a message block */
  messageText: [
    '[data-qa="negotiation-message-text"]',
    '[data-qa="vacancy-response-letter-text"]',
    ".negotiations-message-text",
    ".chat-message-text",
    ".response-letter-text",
    ".message-body",
  ],

  /** Visible timestamp on a message or response */
  timestamp: [
    '[data-qa="negotiation-date"]',
    '[data-qa="vacancy-response-date"]',
    ".negotiations-date",
    ".bloko-text-secondary",
    "time",
    ".vacancy-response-date",
  ],

  /** Response cards in the applications list */
  responseCards: [
    '[data-qa="vacancy-response"]',
    ".vacancy-response",
    ".response-item",
    ".negotiation-card",
    ".application-item",
  ],

  /** Header / title of a response card (usually vacancy title) */
  responseTitle: [
    '[data-qa="vacancy-response-title"]',
    ".vacancy-response-title",
    ".response-vacancy-title",
    ".negotiation-vacancy-title",
  ],

  /** Vacancy/response link (contains vacancy ID) */
  responseLink: [
    'a[data-qa="vacancy-response-link"]',
    "a.vacancy-response-link",
    "a.bloko-link",
  ],
} as const;

export type HrSelectorMap = typeof HR_SELECTORS;
export type HrSelectorField = keyof HrSelectorMap;
