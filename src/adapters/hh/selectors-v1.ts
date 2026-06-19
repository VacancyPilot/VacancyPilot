// --- HH vacancy page selectors — version 1 ---
// Selectors are versioned so the parser can fall back to older versions
// when HH changes its DOM. Maintenance: update this file and bump the version
// when fixtures show selector breakage.

export const SELECTOR_VERSION = 'v1.0.0';

/**
 * Primary CSS selectors for HH.ru vacancy pages.
 * Prefer stable data-qa attributes; fall back to semantic selectors.
 */
export const SELECTORS_V1 = {
  /** Vacancy title */
  title: [
    '[data-qa="vacancy-title"]',
    'h1[data-qa="vacancy-title"]',
    'h1.bloko-header-1',
  ],

  /** Company name */
  companyName: [
    '[data-qa="vacancy-company-name"]',
    'a[data-qa="vacancy-company-name"]',
    '.vacancy-company-name',
    '.employer-company-name',
  ],

  /** Salary text */
  salary: [
    '[data-qa="vacancy-salary"]',
    '.vacancy-salary',
    '.salary',
    'span[data-qa="vacancy-salary"]',
  ],

  /** Location / city */
  city: [
    '[data-qa="vacancy-view-location"]',
    '[data-qa="vacancy-view-raw-address"]',
    '.vacancy-location',
  ],

  /** Experience requirement */
  experience: [
    '[data-qa="vacancy-experience"]',
    'span[data-qa="vacancy-experience"]',
    '.vacancy-experience',
  ],

  /** Employment type (full-time, part-time, etc.) */
  employmentType: [
    '[data-qa="vacancy-view-employment-mode"]',
    '.vacancy-employment-mode',
  ],

  /** Work schedule */
  schedule: [
    '[data-qa="vacancy-work-schedule"]',
    '.vacancy-work-schedule',
  ],

  /** Skills / key skills tags */
  skills: [
    '[data-qa="skills-element"]',
    '[data-qa="bloko-tag"]',
    '.bloko-tag',
    '.skill-tag',
  ],

  /** Vacancy description body */
  description: [
    '[data-qa="vacancy-description"]',
    '.vacancy-description',
    '.g-user-content',
    '[data-qa="vacancy-description-text"]',
  ],

  /** Remote / office / hybrid badge */
  workMode: [
    '[data-qa="vacancy-work-mode"]',
    '.vacancy-work-mode',
  ],
} as const;

/** Selector groups keyed by field name, each with ordered fallbacks. */
export type SelectorMap = typeof SELECTORS_V1;
export type SelectorField = keyof SelectorMap;
