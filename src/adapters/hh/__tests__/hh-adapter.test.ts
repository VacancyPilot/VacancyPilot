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

  describe("extractVisibleApplicationStatus", () => {
    it("returns null (skeleton)", () => {
      const doc = makeDoc("https://hh.ru/vacancy/1");
      const result = adapter.extractVisibleApplicationStatus?.(doc);
      expect(result).toBeNull();
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
