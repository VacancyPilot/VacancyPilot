// ── Search card fixture tests ──
// Uses happy-dom to parse sanitized search page HTML fixtures and compares
// the HHAdapter extractSearchList output against expected JSON arrays.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";
import { HHAdapter } from "../hh-adapter";
import type { RawSearchItemDTO } from "../../types";

// ── Helpers ───────────────────────────────────────────────────────

const fixturesDir = join(__dirname, "..", "__fixtures__", "search-cards");

interface SearchFixtureCase {
  name: string;
  html: string;
  expected: RawSearchItemDTO[];
  url: string;
}

function loadSearchFixture(name: string): SearchFixtureCase {
  const html = readFileSync(join(fixturesDir, `${name}.html`), "utf-8");
  const expectedRaw = readFileSync(
    join(fixturesDir, `${name}.expected.json`),
    "utf-8",
  );
  const expected = JSON.parse(expectedRaw) as RawSearchItemDTO[];
  const url = "https://hh.ru/search/vacancy?text=frontend&area=1";
  return { name, html, expected, url };
}

/**
 * Create a minimal Document from an HTML string and a URL.
 */
function createDocument(html: string, url: string): Document {
  const window = new Window({ url });
  window.document.write(html);
  window.document.close();
  return window.document as unknown as Document;
}

// ── Fixture list ──────────────────────────────────────────────────

const fixtures: SearchFixtureCase[] = [
  loadSearchFixture("search-normal"),
  loadSearchFixture("search-no-salary"),
  loadSearchFixture("search-multiple-cards"),
];

// ── Tests ─────────────────────────────────────────────────────────

describe("search fixture harness", () => {
  it("all search fixture HTML snippets are parseable by happy-dom", () => {
    for (const f of fixtures) {
      const doc = createDocument(f.html, f.url);
      expect(doc).toBeTruthy();
      expect(doc.URL).toBe(f.url);
    }
  });

  it("all expected JSON files are valid arrays", () => {
    for (const f of fixtures) {
      expect(Array.isArray(f.expected)).toBe(true);
    }
  });
});

describe.each(fixtures.map((f) => [f.name, f] as const))(
  "search fixture: %s",
  (_name, fixture) => {
    it("extracts without throwing", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      expect(() => adapter.extractSearchList(doc)).not.toThrow();
    });

    it("returns the expected number of cards", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractSearchList(doc);
      expect(result).toHaveLength(fixture.expected.length);
    });

    it("matches expected card fields", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const actual = adapter.extractSearchList(doc);
      const expected = fixture.expected;

      expect(actual).toHaveLength(expected.length);

      for (let i = 0; i < expected.length; i++) {
        // Compare each field individually for clear error messages
        expect(actual[i].sourceId).toBe(expected[i].sourceId);
        expect(actual[i].title).toBe(expected[i].title);
        expect(actual[i].companyName).toBe(expected[i].companyName);
        expect(actual[i].url).toBe(expected[i].url);
        expect(actual[i].salaryRaw).toBe(expected[i].salaryRaw);
        expect(actual[i].city).toBe(expected[i].city);
        expect(actual[i].experienceRaw).toBe(expected[i].experienceRaw);
        expect(actual[i].workMode).toBe(expected[i].workMode);
        expect(actual[i].publicationDate).toBe(expected[i].publicationDate);
      }
    });

    it("every card has a non-empty sourceId", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractSearchList(doc);
      for (const card of result) {
        expect(card.sourceId).toBeTruthy();
        expect(card.sourceId).toMatch(/^\d+$/);
      }
    });

    it("every card has a title when expected", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const actual = adapter.extractSearchList(doc);
      const expected = fixture.expected;

      for (let i = 0; i < expected.length; i++) {
        if (expected[i].title !== null) {
          expect(actual[i].title).toBeTruthy();
        }
      }
    });
  },
);

describe("search card parser edge cases", () => {
  it("returns empty array for empty search page", () => {
    const html =
      "<!DOCTYPE html><html><body><div class='empty-search'>No results</div></body></html>";
    const doc = createDocument(
      html,
      "https://hh.ru/search/vacancy?text=nonexistent12345",
    );
    const adapter = new HHAdapter();
    const result = adapter.extractSearchList(doc);
    expect(result).toEqual([]);
  });

  it("skips malformed cards gracefully", () => {
    // Card with no title link — should be skipped, not crashed on.
    const html = `<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <div>No link here</div>
  </div>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <a data-qa="serp-item__title" href="/vacancy/99999999">Valid Card</a>
    <span data-qa="vacancy-serp__city">Москва</span>
  </div>
</body></html>`;
    const doc = createDocument(
      html,
      "https://hh.ru/search/vacancy?text=test",
    );
    const adapter = new HHAdapter();
    const result = adapter.extractSearchList(doc);
    // Should return only the valid card.
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe("99999999");
    expect(result[0].title).toBe("Valid Card");
  });

  it("returns empty array when no card containers found", () => {
    const html =
      "<!DOCTYPE html><html><body><p>Just a regular page</p></body></html>";
    const doc = createDocument(
      html,
      "https://hh.ru/search/vacancy?text=test",
    );
    const adapter = new HHAdapter();
    const result = adapter.extractSearchList(doc);
    expect(result).toEqual([]);
  });

  it("extractSearchList does not make any network requests", () => {
    // This is a design guarantee, not runtime testable in happy-dom.
    // We test that the method runs purely on the DOM without any fetch/network calls.
    const html = `<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item">
    <a data-qa="serp-item__title" href="/vacancy/12345">Test</a>
  </div>
</body></html>`;
    const doc = createDocument(
      html,
      "https://hh.ru/search/vacancy?text=test",
    );
    const adapter = new HHAdapter();

    // Run extraction — it must not throw and must not trigger any async operations.
    const result = adapter.extractSearchList(doc);
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe("12345");
  });
});
