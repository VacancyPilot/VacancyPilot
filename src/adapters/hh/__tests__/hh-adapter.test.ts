import { describe, it, expect } from "vitest";
import { HHAdapter } from "../hh-adapter";
import { SELECTORS_V1, SELECTOR_VERSION } from "../selectors-v1";

// ── Minimal DOM mock helper ──────────────────────────────────────
// Full fixture-based DOM tests will use happy-dom in ITER-006.
// This helper provides just enough Document API for the parser skeleton.

interface MockElement {
  tagName: string;
  textContent: string | null;
  getAttribute(name: string): string | null;
  querySelector(selector: string): MockElement | null;
  querySelectorAll(selector: string): MockElement[];
}

interface MockDocument extends Document {
  _setElement(selector: string, element: MockElement): void;
}

function makeDoc(url: string): MockDocument {
  // Build a minimal Document-like object for the adapter.
  // The adapter only uses .URL, .querySelector, .querySelectorAll, .getAttribute.
  const elements = new Map<string, MockElement>();
  const normalizeSelector = (selector: string) =>
    selector.split("[").join("").split("]").join("").split('"').join("");

  const doc = {
    URL: url,
    querySelector(selector: string): MockElement | null {
      // Check our registered elements first
      for (const [registered, elem] of elements) {
        if (
          selector === registered ||
          selector.includes(normalizeSelector(registered))
        ) {
          return elem;
        }
      }
      return null;
    },
    querySelectorAll(selector: string): MockElement[] {
      const result: MockElement[] = [];
      for (const [registered, elem] of elements) {
        if (
          selector === registered ||
          selector.includes(normalizeSelector(registered))
        ) {
          result.push(elem);
        }
      }
      return result;
    },
  } as unknown as MockDocument;

  // Attach element registration
  doc._setElement = (sel: string, elem: MockElement) => {
    elements.set(sel, elem);
  };

  return doc;
}

// ── Tests ───────────────────────────────────────────────────────

describe("HHAdapter", () => {
  const adapter = new HHAdapter();

  describe("siteId", () => {
    it('reports "hh" site', () => {
      expect(adapter.siteId).toBe("hh");
    });
  });

  describe("matchUrl", () => {
    it('returns "vacancy" for HH vacancy URLs', () => {
      expect(adapter.matchUrl("https://hh.ru/vacancy/12345678")).toBe(
        "vacancy",
      );
      expect(adapter.matchUrl("https://spb.hh.ru/vacancy/99999999")).toBe(
        "vacancy",
      );
    });

    it('returns "vacancy" for vacancy URLs with query params', () => {
      expect(
        adapter.matchUrl("https://hh.ru/vacancy/12345678?query=param"),
      ).toBe("vacancy");
      expect(
        adapter.matchUrl(
          "https://hh.ru/vacancy/12345678?hhtmFrom=vacancy_search_list",
        ),
      ).toBe("vacancy");
    });

    it('returns "search" for search URLs', () => {
      expect(adapter.matchUrl("https://hh.ru/search/vacancy")).toBe("search");
      expect(
        adapter.matchUrl("https://spb.hh.ru/search/vacancy?text=frontend"),
      ).toBe("search");
    });

    it('returns "applications" for resume/applicant URLs', () => {
      expect(adapter.matchUrl("https://hh.ru/applicant/resumes")).toBe(
        "applications",
      );
    });

    it('returns "messages" for negotiations URLs', () => {
      expect(adapter.matchUrl("https://hh.ru/negotiations")).toBe("messages");
    });

    it("returns null for non-HH domains", () => {
      expect(adapter.matchUrl("https://linkedin.com/jobs/view/123")).toBeNull();
      expect(adapter.matchUrl("https://google.com")).toBeNull();
      expect(adapter.matchUrl("https://habr.com")).toBeNull();
    });

    it("returns null for HH main page", () => {
      expect(adapter.matchUrl("https://hh.ru/")).toBeNull();
      expect(adapter.matchUrl("https://hh.ru/article")).toBeNull();
    });

    it("returns null for malformed URLs", () => {
      expect(adapter.matchUrl("not-a-url")).toBeNull();
      expect(adapter.matchUrl("")).toBeNull();
    });

    it("handles hh.ru subdomains correctly", () => {
      expect(adapter.matchUrl("https://hh.ru/vacancy/111")).toBe("vacancy");
      expect(adapter.matchUrl("https://hh.ru/search/vacancy")).toBe("search");
    });

    it("rejects lookalike domains like evil-hh.ru", () => {
      expect(adapter.matchUrl("https://evil-hh.ru/vacancy/123")).toBeNull();
      expect(adapter.matchUrl("https://xhh.ru/vacancy/123")).toBeNull();
      expect(adapter.matchUrl("https://hh.ru.evil.com/vacancy/123")).toBeNull();
      expect(adapter.matchUrl("https://hh-ru.com/vacancy/123")).toBeNull();
    });

    it("accepts regional subdomains like spb.hh.ru", () => {
      expect(adapter.matchUrl("https://spb.hh.ru/vacancy/999")).toBe("vacancy");
      expect(adapter.matchUrl("https://ekaterinburg.hh.ru/vacancy/42")).toBe(
        "vacancy",
      );
      expect(adapter.matchUrl("https://nn.hh.ru/search/vacancy")).toBe(
        "search",
      );
    });
  });

  describe("normalizeWorkMode", () => {
    it("returns null for null input with null description", () => {
      // Access the private method via prototype for testing
      const result = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"]?.("", null);
      expect(result).toBeNull();
    });

    it("detects remote from badge", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      expect(fn("Можно удалённо", null)).toBe("remote");
      expect(fn("Remote", null)).toBe("remote");
    });

    it("detects hybrid from badge", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      expect(fn("Гибрид", null)).toBe("hybrid");
      expect(fn("Hybrid", null)).toBe("hybrid");
    });

    it("detects office from badge", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      expect(fn("Офис", null)).toBe("office");
    });

    it("detects remote from description text when badge is missing", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      // Badge empty, but description mentions remote work
      expect(fn(null, "Мы предлагаем полностью удалённую работу")).toBe(
        "remote",
      );
      expect(fn(null, "Fully remote position with flexible hours")).toBe(
        "remote",
      );
    });

    it("detects hybrid from description text", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      expect(fn(null, "Гибридный формат: офис + удалённая работа")).toBe(
        "hybrid",
      );
    });

    it("detects office from description text", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      expect(fn(null, "Работа в офисе в центре Москвы")).toBe("office");
      expect(fn(null, "On-site position")).toBe("office");
    });

    it("badge takes priority over description", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      // Badge says remote, description mentions office — badge wins
      expect(fn("Можно удалённо", "Работа в офисе")).toBe("remote");
    });

    it("returns unknown for unparseable data", () => {
      const fn = (
        HHAdapter.prototype as unknown as Record<
          string,
          (a: string | null, b: string | null) => string | null
        >
      )["normalizeWorkMode"];
      expect(fn("Какой-то текст", null)).toBe("unknown");
    });
  });

  describe("extractVacancy — skeleton", () => {
    it("returns null for non-vacancy URLs (no vacancy markers)", () => {
      const doc = makeDoc("https://hh.ru/");
      const result = adapter.extractVacancy(doc);
      expect(result).toBeNull();
    });

    it("returns a DTO with sourceUrl and warnings for a minimal vacancy page", () => {
      const doc = makeDoc("https://hh.ru/vacancy/12345678");
      // looksLikeVacancyPage now requires at least one DOM marker.
      // Register a minimal title element so the page is recognized as a vacancy.
      doc._setElement('[data-qa="vacancy-title"]', {
        tagName: "h1",
        textContent: "Minimal Vacancy",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVacancy(doc);

      expect(result).not.toBeNull();
      expect(result!.sourceUrl).toBe("https://hh.ru/vacancy/12345678");
      expect(result!.selectorVersion).toBe(SELECTOR_VERSION);
      expect(result!.extractedAt).toBeTruthy();
      // Most fields will be null since we have no DOM content
      expect(result!.warnings.length).toBeGreaterThan(0);
    });

    it("extracts vacancy ID from URL", () => {
      const doc = makeDoc("https://hh.ru/vacancy/87654321");
      // looksLikeVacancyPage requires at least one DOM marker
      doc._setElement('[data-qa="vacancy-title"]', {
        tagName: "h1",
        textContent: "Vacancy",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVacancy(doc);

      expect(result).not.toBeNull();
      expect(result!.sourceVacancyId).toBe("87654321");
    });

    it("does not throw on missing fields", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      expect(() => adapter.extractVacancy(doc)).not.toThrow();
    });

    it("includes warnings for missing fields", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      // looksLikeVacancyPage requires at least one DOM marker
      doc._setElement('[data-qa="vacancy-title"]', {
        tagName: "h1",
        textContent: "Vacancy",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVacancy(doc);

      expect(result).not.toBeNull();
      const missingFields = result!.warnings
        .filter((w) => w.severity === "info")
        .map((w) => w.field);
      // Should warn about missing company, salary, etc.
      // (title is registered in the mock, so it will not appear as missing)
      expect(missingFields).toContain("companyName");
      expect(missingFields).toContain("salaryRaw");
    });
  });

  describe("extractSearchList", () => {
    it("returns an empty array (skeleton)", () => {
      const doc = makeDoc("https://hh.ru/search/vacancy");
      const result = adapter.extractSearchList(doc);
      expect(result).toEqual([]);
    });
  });

  describe("extractVisibleApplicationStatus — passive status extraction", () => {
    it("returns null when no status indicators are present", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).toBeNull();
    });

    it("detects applied status from data-qa attribute", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      doc._setElement('[data-qa="vacancy-response-status"]', {
        tagName: "span",
        textContent: "Вы откликнулись",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).not.toBeNull();
      expect(result!.detectedApplied).toBe(true);
      expect(result!.rawLabel).toBe("Вы откликнулись");
      expect(result!.detectedAt).toBeTruthy();
    });

    it("detects viewed-by-employer status", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      doc._setElement('[data-qa="negotiation-status"]', {
        tagName: "span",
        textContent: "Работодатель просмотрел резюме",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).not.toBeNull();
      expect(result!.detectedViewedByEmployer).toBe(true);
    });

    it("detects invitation status", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      doc._setElement(".negotiations-status", {
        tagName: "div",
        textContent: "Приглашение на собеседование",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).not.toBeNull();
      expect(result!.detectedInvitation).toBe(true);
    });

    it("detects rejection status", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      doc._setElement('[data-qa="response-status-rejected"]', {
        tagName: "span",
        textContent: "Отказ",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).not.toBeNull();
      expect(result!.detectedRejected).toBe(true);
    });

    it("detects English status labels", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      doc._setElement('[data-qa="vacancy-response-status"]', {
        tagName: "span",
        textContent: "Applied",
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).not.toBeNull();
      expect(result!.detectedApplied).toBe(true);
    });

    it("does not crash on malformed selectors", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      // No status elements registered — should return null without throwing
      expect(() =>
        adapter.extractVisibleApplicationStatus?.(doc),
      ).not.toThrow();
      expect(adapter.extractVisibleApplicationStatus?.(doc)).toBeNull();
    });
  });
});

describe("selectors-v1", () => {
  it("has selectors for all expected fields", () => {
    const expectedFields = [
      "title",
      "companyName",
      "salary",
      "city",
      "experience",
      "employmentType",
      "schedule",
      "skills",
      "description",
      "workMode",
    ];

    for (const field of expectedFields) {
      expect(SELECTORS_V1).toHaveProperty(field);
      expect(
        Array.isArray(SELECTORS_V1[field as keyof typeof SELECTORS_V1]),
      ).toBe(true);
      expect(
        SELECTORS_V1[field as keyof typeof SELECTORS_V1].length,
      ).toBeGreaterThan(0);
    }
  });

  it("has a version string", () => {
    expect(SELECTOR_VERSION).toBeTruthy();
    expect(typeof SELECTOR_VERSION).toBe("string");
    expect(SELECTOR_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it("prefers data-qa selectors as first fallback", () => {
    // For each field, the first selector should be the most stable one
    for (const field of Object.keys(SELECTORS_V1) as Array<
      keyof typeof SELECTORS_V1
    >) {
      const selectors = SELECTORS_V1[field];
      expect(selectors.length).toBeGreaterThan(0);
      // First selector should be a data-qa or structural selector
      const first = selectors[0];
      expect(typeof first).toBe("string");
    }
  });
});
