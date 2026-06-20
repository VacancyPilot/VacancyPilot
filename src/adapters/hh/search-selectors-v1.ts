// --- HH search card selectors — version 1 ---
// Selectors are versioned so the parser can fall back to older versions
// when HH changes its search result DOM.
// Maintenance: bump the version when selectors need updating.

export const SEARCH_SELECTOR_VERSION = "v1.0.0";

/**
 * Primary CSS selectors for HH.ru search result cards.
 * Prefer stable data-qa attributes; fall back to semantic class selectors.
 * All selectors are scoped within a card container element.
 */
export const SEARCH_SELECTORS_V1 = {
  /** Container for each search result card */
  card: [
    '[data-qa="vacancy-serp-item"]',
    ".serp-item",
    '[data-qa="vacancy-serp"]',
    "div.vacancy-serp-item",
  ],

  /** Title link (anchor inside the card) */
  title: [
    '[data-qa="serp-item__title"]',
    "a.serp-item__title",
    ".serp-item__title a",
    '[data-qa="vacancy-serp__title"]',
  ],

  /** Company name */
  companyName: [
    '[data-qa="vacancy-serp__company"]',
    "a.serp-item__company",
    '[data-qa="vacancy-serp-company"]',
    ".vacancy-serp__company",
  ],

  /** Salary text */
  salary: [
    '[data-qa="vacancy-serp__salary"]',
    ".serp-item__salary",
    ".vacancy-serp__salary",
    '[data-qa="vacancy-compensation"]',
  ],

  /** City / location */
  city: [
    '[data-qa="vacancy-serp__city"]',
    ".serp-item__city",
    ".vacancy-serp__city",
    '[data-qa="vacancy-serp__vacancy-address"]',
  ],

  /** Experience requirement text */
  experience: [
    '[data-qa="vacancy-serp__experience"]',
    ".serp-item__experience",
    ".vacancy-serp__experience",
    '[data-qa="vacancy-serp-experience"]',
  ],

  /** Work mode badge (remote/hybrid/office) */
  workMode: [
    '[data-qa="vacancy-serp__work-mode"]',
    ".serp-item__work-mode",
    ".vacancy-serp__work-mode",
    '[data-qa="vacancy-work-mode-tag"]',
  ],

  /** Publication date / freshness indicator */
  publicationDate: [
    '[data-qa="vacancy-serp__publish-date"]',
    ".serp-item__publish-date",
    ".vacancy-serp__publish-date",
    ".vacancy-serp-item__date",
  ],
} as const;

/** Selector groups keyed by field name, each with ordered fallbacks. */
export type SearchSelectorMap = typeof SEARCH_SELECTORS_V1;
export type SearchSelectorField = keyof SearchSelectorMap;
