/**
 * Search Card Fixture Regression Tests — ITER-033.
 *
 * Run all HH search card parser fixtures and produce a pass/fail summary.
 * Fails the test suite if any search card fixture regression is detected.
 *
 * This is a safety gate: if a parser change breaks an existing search card
 * fixture, CI will catch it immediately.
 *
 * Unlike the vacancy fixture regression test (which tests extractVacancy),
 * this test validates extractSearchList against search page fixtures.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { Window } from "happy-dom";
import { HHAdapter } from "@/adapters/hh/hh-adapter";
import type { RawSearchItemDTO } from "@/adapters/types";

// ── Helpers ─────────────────────────────────────────────────────────────

const SEARCH_FIXTURES_DIR = join(
  __dirname,
  "..",
  "adapters",
  "hh",
  "__fixtures__",
  "search-cards",
);

const SEARCH_PAGE_URL = "https://hh.ru/search/vacancy?text=frontend&area=1";

interface SearchFixtureCase {
  name: string;
  html: string;
  expected: RawSearchItemDTO[];
  url: string;
}

/**
 * Auto-discover all search card fixture pairs in the search-cards directory.
 * A fixture pair consists of <name>.html and <name>.expected.json.
 */
function discoverSearchFixtures(): SearchFixtureCase[] {
  try {
    const files = readdirSync(SEARCH_FIXTURES_DIR);
    const htmlFiles = files.filter((f) => f.endsWith(".html"));

    const fixtures: SearchFixtureCase[] = [];

    for (const htmlFile of htmlFiles) {
      const name = basename(htmlFile, ".html");
      const expectedFile = `${name}.expected.json`;

      if (!files.includes(expectedFile)) {
        console.warn(
          `[search-card-regression] Missing expected JSON for fixture "${name}"`,
        );
        continue;
      }

      const html = readFileSync(join(SEARCH_FIXTURES_DIR, htmlFile), "utf-8");
      const expectedRaw = readFileSync(
        join(SEARCH_FIXTURES_DIR, expectedFile),
        "utf-8",
      );
      const expected = JSON.parse(expectedRaw) as RawSearchItemDTO[];

      fixtures.push({
        name,
        html,
        expected,
        url: SEARCH_PAGE_URL,
      });
    }

    return fixtures;
  } catch {
    // If directory doesn't exist or is empty, return empty array.
    return [];
  }
}

function createDocument(html: string, url: string): Document {
  const window = new Window({ url });
  window.document.write(html);
  window.document.close();
  return window.document as unknown as Document;
}

// ── Field comparison helpers ────────────────────────────────────────────

interface SearchCardFieldError {
  cardIndex: number;
  field: string;
  expected: unknown;
  actual: unknown;
}

function compareSearchCardResults(
  actual: RawSearchItemDTO[],
  expected: RawSearchItemDTO[],
): SearchCardFieldError[] {
  const errors: SearchCardFieldError[] = [];

  if (actual.length !== expected.length) {
    errors.push({
      cardIndex: -1,
      field: "_length",
      expected: expected.length,
      actual: actual.length,
    });
    return errors;
  }

  const fields: Array<keyof RawSearchItemDTO> = [
    "sourceId",
    "title",
    "companyName",
    "url",
    "salaryRaw",
    "city",
    "experienceRaw",
    "workMode",
    "publicationDate",
  ];

  for (let i = 0; i < expected.length; i++) {
    for (const field of fields) {
      if (actual[i][field] !== expected[i][field]) {
        errors.push({
          cardIndex: i,
          field,
          expected: expected[i][field],
          actual: actual[i][field],
        });
      }
    }
  }

  return errors;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("search card fixture regression", () => {
  const fixtures = discoverSearchFixtures();

  // ── Discovery ───────────────────────────────────────────────────────

  it("finds at least 1 search card fixture pair", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(1);
  });

  it("each search fixture has an HTML file and expected JSON array", () => {
    for (const f of fixtures) {
      expect(f.html.length).toBeGreaterThan(0);
      expect(Array.isArray(f.expected)).toBe(true);
    }
  });

  // ── Per-fixture tests ───────────────────────────────────────────────

  describe.each(fixtures.map((f) => [f.name, f] as const))(
    "search fixture: %s",
    (_name, fixture) => {
      it("extracts without throwing", () => {
        const doc = createDocument(fixture.html, fixture.url);
        const adapter = new HHAdapter();
        expect(() => adapter.extractSearchList(doc)).not.toThrow();
      });

      it("returns expected number of cards", () => {
        const doc = createDocument(fixture.html, fixture.url);
        const adapter = new HHAdapter();
        const result = adapter.extractSearchList(doc);
        expect(result).toHaveLength(fixture.expected.length);
      });

      it("matches expected card fields", () => {
        const doc = createDocument(fixture.html, fixture.url);
        const adapter = new HHAdapter();
        const actual = adapter.extractSearchList(doc);
        const errors = compareSearchCardResults(actual, fixture.expected);

        if (errors.length > 0) {
          const details = errors
            .map(
              (e) =>
                `  card[${e.cardIndex}].${e.field}: expected ${JSON.stringify(e.expected)}, got ${JSON.stringify(e.actual)}`,
            )
            .join("\n");
          throw new Error(
            `Search fixture "${fixture.name}" mismatch:\n${details}`,
          );
        }
      });

      it("every card has a numeric sourceId", () => {
        const doc = createDocument(fixture.html, fixture.url);
        const adapter = new HHAdapter();
        const result = adapter.extractSearchList(doc);
        for (const card of result) {
          expect(card.sourceId).toMatch(/^\d+$/);
        }
      });
    },
  );

  // ── Aggregate summary ───────────────────────────────────────────────

  describe("search card regression summary", () => {
    it("all search card fixtures pass (aggregate check)", () => {
      const failures: string[] = [];

      for (const fixture of fixtures) {
        const doc = createDocument(fixture.html, fixture.url);
        const adapter = new HHAdapter();
        const actual = adapter.extractSearchList(doc);
        const errors = compareSearchCardResults(actual, fixture.expected);

        if (errors.length > 0) {
          const details = errors
            .map(
              (e) =>
                `  card[${e.cardIndex}].${e.field}: expected ${JSON.stringify(e.expected)}, got ${JSON.stringify(e.actual)}`,
            )
            .join("\n");
          failures.push(`Search fixture "${fixture.name}":\n${details}`);
        }
      }

      if (failures.length > 0) {
        throw new Error(
          `${failures.length} search fixture(s) failed:\n\n${failures.join("\n\n")}`,
        );
      }
    });

    it("reports the total number of search fixtures checked", () => {
      expect(fixtures.length).toBeGreaterThanOrEqual(1);
      console.log(
        `[search-card-regression] Checked ${fixtures.length} search fixture(s): ${fixtures
          .map((f) => f.name)
          .join(", ")}`,
      );
    });
  });
});
