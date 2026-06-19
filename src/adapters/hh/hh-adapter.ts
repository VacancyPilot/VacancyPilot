// --- HHAdapter — safe, read-only vacancy parser skeleton ---
// Phase 0–1: extracts structured data from HH.ru vacancy pages.
// Uses versioned selectors with graceful degradation.
// Never makes network requests, never modifies the page.

import type { SiteAdapter, PageKind, RawSearchItemDTO, ApplicationStatusSync } from '../types';
import type { RawVacancyDTO, ParserWarning } from './types';
import { SELECTORS_V1, SELECTOR_VERSION } from './selectors-v1';

export class HHAdapter implements SiteAdapter {
  readonly siteId = 'hh' as const;

  // ── URL matching ──────────────────────────────────────────────

  matchUrl(url: string): PageKind {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('hh.ru')) return null;

      const path = parsed.pathname;

      if (/^\/vacancy\/\d+/i.test(path)) return 'vacancy';
      if (/^\/search\/vacancy/i.test(path)) return 'search';
      if (/^\/applicant\/resumes/i.test(path)) return 'applications';
      if (/^\/negotiations/i.test(path)) return 'messages';

      return null;
    } catch {
      return null;
    }
  }

  // ── Vacancy extraction (skeleton) ─────────────────────────────

  extractVacancy(doc: Document): RawVacancyDTO | null {
    const warnings: ParserWarning[] = [];
    const now = new Date().toISOString();
    const sourceUrl = doc.URL;

    // Check that page looks like a vacancy
    if (!this.looksLikeVacancyPage(doc)) {
      warnings.push({
        field: '_page',
        message: 'Document does not appear to be an HH vacancy page',
        severity: 'warn',
      });
      return null;
    }

    const sourceVacancyId = this.extractVacancyId(doc);
    if (!sourceVacancyId) {
      warnings.push({
        field: 'sourceVacancyId',
        message: 'Could not extract vacancy ID from URL or DOM',
        severity: 'warn',
      });
    }

    const title = this.tryExtract(doc, 'title');
    const companyName = this.tryExtract(doc, 'companyName');
    const salaryRaw = this.tryExtract(doc, 'salary');
    const city = this.tryExtract(doc, 'city');
    const experienceRaw = this.tryExtract(doc, 'experience');
    const employmentType = this.tryExtract(doc, 'employmentType');
    const schedule = this.tryExtract(doc, 'schedule');
    const descriptionHtml = this.tryExtract(doc, 'description');
    const workModeRaw = this.tryExtract(doc, 'workMode');

    // Collect warnings for missing fields
    const nullableFields: Array<{ key: keyof RawVacancyDTO; value: unknown }> = [
      { key: 'title', value: title },
      { key: 'companyName', value: companyName },
      { key: 'salaryRaw', value: salaryRaw },
      { key: 'city', value: city },
      { key: 'experienceRaw', value: experienceRaw },
      { key: 'employmentType', value: employmentType },
      { key: 'schedule', value: schedule },
      { key: 'descriptionHtml', value: descriptionHtml },
      { key: 'descriptionText', value: descriptionHtml ? this.stripHtml(descriptionHtml) : null },
      { key: 'skills', value: this.extractSkills(doc) },
    ];

    for (const { key, value } of nullableFields) {
      if (value === null || value === undefined) {
        warnings.push({
          field: String(key),
          message: `Field "${key}" could not be extracted`,
          severity: 'info',
        });
      }
    }

    const dto: RawVacancyDTO = {
      sourceVacancyId,
      sourceUrl,
      title: title ?? null,
      companyName: companyName ?? null,
      salaryRaw: salaryRaw ?? null,
      salaryMin: this.tryParseSalaryMin(salaryRaw),
      salaryMax: this.tryParseSalaryMax(salaryRaw),
      salaryCurrency: this.tryParseSalaryCurrency(salaryRaw),
      city: city ?? null,
      workMode: this.normalizeWorkMode(workModeRaw),
      experienceRaw: experienceRaw ?? null,
      employmentType: employmentType ?? null,
      schedule: schedule ?? null,
      descriptionHtml: descriptionHtml ?? null,
      descriptionText: descriptionHtml ? this.stripHtml(descriptionHtml) : null,
      skills: this.extractSkills(doc),
      extractedAt: now,
      selectorVersion: SELECTOR_VERSION,
      warnings,
    };

    return dto;
  }

  // ── Search list (not implemented in Phase 0) ──────────────────

  extractSearchList(_doc: Document): RawSearchItemDTO[] {
    void _doc;
    // Search parser comes in Phase 2.
    // Returning empty array satisfies the interface without the risk
    // of half-implemented extraction.
    return [];
  }

  // ── Application status sync (not implemented in Phase 0) ──────

  extractVisibleApplicationStatus?(_doc: Document): Partial<ApplicationStatusSync> | null {
    void _doc;
    // Passive status detection comes later.
    return null;
  }

  // ── Private helpers ────────────────────────────────────────────

  private looksLikeVacancyPage(doc: Document): boolean {
    // Check for known HH vacancy markers
    const hasVacancyUrl = /\/vacancy\/\d+/i.test(doc.URL);
    const hasVacancyTitle = doc.querySelector('[data-qa="vacancy-title"]');
    const hasDescription = doc.querySelector('[data-qa="vacancy-description"]');
    return hasVacancyUrl || !!(hasVacancyTitle || hasDescription);
  }

  private extractVacancyId(doc: Document): string | null {
    // Try URL first: https://hh.ru/vacancy/12345678
    try {
      const match = doc.URL.match(/\/vacancy\/(\d+)/i);
      if (match) return match[1];
    } catch {
      // fall through to DOM
    }

    // Try data attribute
    const el = doc.querySelector('[data-vacancy-id]');
    if (el) return el.getAttribute('data-vacancy-id');

    return null;
  }

  /**
   * Try each selector in the ordered fallback list.
   * Returns the text content of the first matching element, or null.
   */
  private tryExtract(doc: Document, field: keyof typeof SELECTORS_V1): string | null {
    const selectors = SELECTORS_V1[field];
    for (const selector of selectors) {
      try {
        const el = doc.querySelector(selector);
        if (el?.textContent?.trim()) {
          return el.textContent.trim();
        }
      } catch {
        // CSS selector parse error — skip to next
        continue;
      }
    }
    return null;
  }

  private extractSkills(doc: Document): string[] | null {
    const selectors = SELECTORS_V1.skills;
    for (const selector of selectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          const skills = Array.from(elements)
            .map((el) => el.textContent?.trim() ?? '')
            .filter(Boolean);
          if (skills.length > 0) return skills;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  // ── Normalizers ────────────────────────────────────────────────

  private normalizeWorkMode(raw: string | null): RawVacancyDTO['workMode'] {
    if (!raw) return null;
    const lower = raw.toLowerCase();
    if (lower.includes('удалён') || lower.includes('удален') || lower.includes('remote')) return 'remote';
    if (lower.includes('гибрид') || lower.includes('hybrid')) return 'hybrid';
    if (lower.includes('офис') || lower.includes('office') || lower.includes('на месте')) return 'office';
    return 'unknown';
  }

  private stripHtml(html: string): string {
    // Simple tag stripping — no DOMParser to keep this pure-function safe.
    // A more robust version will use the built-in parser in ITER-006.
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private tryParseSalaryMin(raw: string | null): number | null {
    if (!raw) return null;
    // Simple patterns: "100 000 – 150 000 ₽", "от 100 000 ₽", "до 150 000 ₽"
    const cleaned = raw.replace(/\u00A0/g, ' ').replace(/\s/g, ' ');
    const fromMatch = cleaned.match(/(?:от|с)\s*([\d\s]+)/i);
    if (fromMatch) return this.parseNumber(fromMatch[1]);
    const rangeMatch = cleaned.match(/([\d\s]+)\s*[–\-—]\s*([\d\s]+)/);
    if (rangeMatch) return this.parseNumber(rangeMatch[1]);
    return null;
  }

  private tryParseSalaryMax(raw: string | null): number | null {
    if (!raw) return null;
    const cleaned = raw.replace(/\u00A0/g, ' ').replace(/\s/g, ' ');
    const toMatch = cleaned.match(/(?:до)\s*([\d\s]+)/i);
    if (toMatch) return this.parseNumber(toMatch[1]);
    const rangeMatch = cleaned.match(/([\d\s]+)\s*[–\-—]\s*([\d\s]+)/);
    if (rangeMatch) return this.parseNumber(rangeMatch[2]);
    return null;
  }

  private tryParseSalaryCurrency(raw: string | null): string | null {
    if (!raw) return null;
    const currencyMap: Record<string, string> = {
      '₽': 'RUB', 'руб': 'RUB', 'rub': 'RUB',
      '$': 'USD', 'usd': 'USD',
      '€': 'EUR', 'eur': 'EUR',
    };
    const lower = raw.toLowerCase();
    for (const [symbol, code] of Object.entries(currencyMap)) {
      if (lower.includes(symbol)) return code;
    }
    return null;
  }

  private parseNumber(str: string): number | null {
    const num = parseInt(str.replace(/\s/g, ''), 10);
    return Number.isNaN(num) ? null : num;
  }
}
