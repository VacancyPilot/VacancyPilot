// ── Parser fixture tests ──
// Uses happy-dom to parse sanitized HTML fixtures and compares
// the HHAdapter extractVacancy output against expected JSON DTOs.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runFixture, createDocument } from "../__fixtures__/fixture-runner";

// ── Fixture loader ───────────────────────────────────────────────

const fixturesDir = join(__dirname, "..", "__fixtures__");

interface FixtureCase {
  name: string;
  html: string;
  expected: Record<string, unknown> | null;
  url: string;
}

function loadFixture(name: string, vacancyId: string): FixtureCase {
  const html = readFileSync(join(fixturesDir, `${name}.html`), "utf-8");
  const expectedRaw = readFileSync(
    join(fixturesDir, `${name}.expected.json`),
    "utf-8",
  );
  const expected = JSON.parse(expectedRaw);
  const url = `https://hh.ru/vacancy/${vacancyId}`;
  return { name, html, expected, url };
}

// ── Fixture list ─────────────────────────────────────────────────

const fixtures: FixtureCase[] = [
  loadFixture("vacancy-normal", "12345678"),
  loadFixture("vacancy-no-salary", "77777777"),
  loadFixture("vacancy-archived", "99999999"),
  loadFixture("vacancy-hybrid", "11111111"),
  loadFixture("vacancy-office", "22222222"),
  loadFixture("vacancy-remote-description", "33333333"),
  loadFixture("vacancy-salary-from", "44444444"),
  loadFixture("vacancy-salary-to", "55555555"),
  loadFixture("vacancy-multiple-cities", "66666666"),
  loadFixture("vacancy-minimal", "77777770"),
  loadFixture("vacancy-no-experience", "88888888"),
  loadFixture("vacancy-no-company", "99999990"),
  loadFixture("vacancy-english", "10101010"),
  loadFixture("vacancy-part-time", "11111112"),
  loadFixture("vacancy-no-skills", "12121212"),
  loadFixture("vacancy-applied-status", "13131313"),
  loadFixture("vacancy-viewed-status", "14141414"),
  loadFixture("vacancy-invitation-status", "15151515"),
  loadFixture("vacancy-rejected-status", "16161616"),
];

// ── Tests ────────────────────────────────────────────────────────

describe("fixture harness", () => {
  it("all fixture HTML snippets are parseable by happy-dom", () => {
    for (const f of fixtures) {
      const doc = createDocument(f.html, f.url);
      expect(doc).toBeTruthy();
      expect(doc.URL).toBe(f.url);
    }
  });

  it("all expected JSON files are valid and parseable", () => {
    for (const f of fixtures) {
      expect(typeof f.expected === "object" || f.expected === null).toBe(true);
    }
  });
});

describe.each(fixtures.map((f) => [f.name, f] as const))(
  "fixture: %s",
  (_name, fixture) => {
    it("parses without throwing", () => {
      expect(() =>
        runFixture(fixture.html, fixture.url, fixture.expected),
      ).not.toThrow();
    });

    it("matches expected DTO fields", () => {
      const result = runFixture(fixture.html, fixture.url, fixture.expected);

      if (!result.passed) {
        const details = result.errors
          .map(
            (e) =>
              `  ${e.field}: expected ${JSON.stringify(e.expected)}, got ${JSON.stringify(e.actual)}`,
          )
          .join("\n");
        throw new Error(`Fixture "${fixture.name}" mismatch:\n${details}`);
      }
    });

    it("returns null DTO only when expected is null", () => {
      const result = runFixture(fixture.html, fixture.url, fixture.expected);
      if (fixture.expected !== null) {
        expect(result.actual).not.toBeNull();
        expect(result.actual!.sourceUrl).toBe(fixture.url);
      } else {
        expect(result.actual).toBeNull();
      }
    });

    it("has a valid extractedAt timestamp when DTO is returned", () => {
      const result = runFixture(fixture.html, fixture.url, fixture.expected);
      if (result.actual !== null) {
        expect(result.actual.extractedAt).toBeTruthy();
        expect(() => new Date(result.actual!.extractedAt)).not.toThrow();
      }
    });

    it("has the current selector version when DTO is returned", () => {
      const result = runFixture(fixture.html, fixture.url, fixture.expected);
      if (result.actual !== null) {
        expect(result.actual.selectorVersion).toBe("v1.0.0");
      }
    });

    it("descriptionHtml contains actual HTML when description is present", () => {
      const result = runFixture(fixture.html, fixture.url, fixture.expected);
      if (result.actual === null) return; // archived — no DTO
      if (!result.actual.descriptionHtml) return; // no description in fixture

      // descriptionHtml must contain HTML markup (tags), not just plain text
      expect(result.actual.descriptionHtml).toMatch(/<\w+[^>]*>/);

      // descriptionHtml should differ from descriptionText (HTML vs plain text)
      // unless the description is purely text with no markup
      const hasTags = /<\w+[^>]*>/.test(result.actual.descriptionHtml);
      if (hasTags && result.actual.descriptionText) {
        // HTML and text versions should not be identical string
        expect(result.actual.descriptionHtml).not.toBe(
          result.actual.descriptionText,
        );
      }
    });
  },
);
