/**
 * Fixture Regression Tests — ITER-015.
 *
 * Run all HH **vacancy** parser fixtures and produce a pass/fail summary.
 * Fails the test suite if any fixture regression is detected.
 *
 * HR timeline fixtures (hr-*) are excluded — they're tested separately
 * in hr-fixtures.test.ts via extractHrTimeline.
 *
 * This is a safety gate: if a parser change breaks an existing fixture,
 * CI will catch it immediately.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { runFixture } from "@/adapters/hh/__fixtures__/fixture-runner";

// ── Helpers ─────────────────────────────────────────────────────────────

const FIXTURES_DIR = join(__dirname, "..", "adapters", "hh", "__fixtures__");

interface FixtureCase {
  name: string;
  html: string;
  expected: Record<string, unknown> | null;
  url: string;
}

/** Fixture names that are for HR timeline, not vacancy parsing. */
const HR_FIXTURE_PREFIXES = ["hr-"];

function isHrFixture(name: string): boolean {
  return HR_FIXTURE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Discover all vacancy fixture pairs in the fixtures directory.
 * A fixture pair consists of <name>.html and <name>.expected.json.
 * HR timeline fixtures (hr-*) are skipped — they use a different parser.
 */
function discoverFixtures(): FixtureCase[] {
  const files = readdirSync(FIXTURES_DIR);
  const htmlFiles = files.filter((f) => f.endsWith(".html"));

  const fixtures: FixtureCase[] = [];

  for (const htmlFile of htmlFiles) {
    const name = basename(htmlFile, ".html");

    // Skip HR timeline fixtures — they're tested separately
    if (isHrFixture(name)) continue;

    const expectedFile = `${name}.expected.json`;

    if (!files.includes(expectedFile)) {
      console.warn(
        `[fixture-regression] Missing expected JSON for fixture "${name}"`,
      );
      continue;
    }

    const html = readFileSync(join(FIXTURES_DIR, htmlFile), "utf-8");
    const expectedRaw = readFileSync(join(FIXTURES_DIR, expectedFile), "utf-8");
    const expected = JSON.parse(expectedRaw);

    // Extract a numeric ID from the fixture name or use a stable placeholder
    const vacancyId = extractVacancyId(name);

    fixtures.push({
      name,
      html,
      expected,
      url: `https://hh.ru/vacancy/${vacancyId}`,
    });
  }

  return fixtures;
}

function extractVacancyId(fixtureName: string): string {
  // Map fixture names to stable vacancy IDs for URL construction
  const KNOWN_IDS: Record<string, string> = {
    "vacancy-normal": "12345678",
    "vacancy-no-salary": "77777777",
    "vacancy-archived": "99999999",
    "vacancy-hybrid": "11111111",
    "vacancy-office": "22222222",
    "vacancy-remote-description": "33333333",
    "vacancy-salary-from": "44444444",
    "vacancy-salary-to": "55555555",
    "vacancy-multiple-cities": "66666666",
    "vacancy-minimal": "77777770",
    "vacancy-no-experience": "88888888",
    "vacancy-no-company": "99999990",
    "vacancy-english": "10101010",
    "vacancy-part-time": "11111112",
    "vacancy-no-skills": "12121212",
    "vacancy-applied-status": "13131313",
    "vacancy-viewed-status": "14141414",
    "vacancy-invitation-status": "15151515",
    "vacancy-rejected-status": "16161616",
  };

  return KNOWN_IDS[fixtureName] ?? "00000000";
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("fixture regression", () => {
  const fixtures = discoverFixtures();

  // ── Discovery ───────────────────────────────────────────────────────

  it("finds at least 2 vacancy fixture pairs in the fixtures directory", () => {
    // HR fixtures are excluded — only vacancy fixtures should be counted
    expect(fixtures.length).toBeGreaterThanOrEqual(2);
  });

  it("does not include HR timeline fixtures", () => {
    const names = fixtures.map((f) => f.name);
    for (const name of names) {
      expect(name.startsWith("hr-")).toBe(false);
    }
  });

  it("each fixture has an HTML file and expected JSON file", () => {
    for (const f of fixtures) {
      expect(f.html.length).toBeGreaterThan(0);
      expect(typeof f.expected).toBe("object");
    }
  });

  // ── Per-fixture tests ───────────────────────────────────────────────

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

      it("has valid extractedAt timestamp when DTO returned", () => {
        const result = runFixture(fixture.html, fixture.url, fixture.expected);
        if (result.actual !== null) {
          expect(result.actual.extractedAt).toBeTruthy();
          expect(() => new Date(result.actual!.extractedAt)).not.toThrow();
        }
      });

      it("has current selector version when DTO returned", () => {
        const result = runFixture(fixture.html, fixture.url, fixture.expected);
        if (result.actual !== null) {
          expect(result.actual.selectorVersion).toBe("v1.0.0");
        }
      });
    },
  );

  // ── Aggregate summary ───────────────────────────────────────────────

  describe("fixture regression summary", () => {
    it("all fixtures pass (aggregate check)", () => {
      const failures: string[] = [];

      for (const fixture of fixtures) {
        const result = runFixture(fixture.html, fixture.url, fixture.expected);
        if (!result.passed) {
          const details = result.errors
            .map(
              (e) =>
                `  ${e.field}: expected ${JSON.stringify(e.expected)}, got ${JSON.stringify(e.actual)}`,
            )
            .join("\n");
          failures.push(`Fixture "${fixture.name}":\n${details}`);
        }
      }

      if (failures.length > 0) {
        throw new Error(
          `${failures.length} fixture(s) failed:\n\n${failures.join("\n\n")}`,
        );
      }
    });

    it("reports the total number of vacancy fixtures checked", () => {
      // This is a meta-test: it documents how many vacancy fixtures exist.
      // HR timeline fixtures are excluded — they're tested separately.
      expect(fixtures.length).toBeGreaterThanOrEqual(2);
      console.log(
        `[fixture-regression] Checked ${fixtures.length} vacancy fixture(s): ${fixtures
          .map((f) => f.name)
          .join(", ")}`,
      );
    });
  });
});
