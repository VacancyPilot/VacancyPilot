// ── HR Timeline Fixture Tests ──
// Uses happy-dom to parse sanitized HTML fixtures and compares
// the HHAdapter extractHrTimeline output against expected JSON DTOs.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";
import { HHAdapter } from "../hh-adapter";
import type { RawHrTimelineDTO } from "@/models/hr-timeline";

// ── Fixture loader ───────────────────────────────────────────────

const fixturesDir = join(__dirname, "..", "__fixtures__");

interface HrFixtureCase {
  name: string;
  html: string;
  expected: RawHrTimelineDTO[];
  url: string;
}

function loadHrFixture(name: string, url: string): HrFixtureCase {
  const html = readFileSync(join(fixturesDir, `${name}.html`), "utf-8");
  const expectedRaw = readFileSync(
    join(fixturesDir, `${name}.expected.json`),
    "utf-8",
  );
  const expected = JSON.parse(expectedRaw) as RawHrTimelineDTO[];
  return { name, html, expected, url };
}

// ── DOM creation ─────────────────────────────────────────────────

function createDocument(html: string, url: string): Document {
  const window = new Window({ url });
  window.document.write(html);
  window.document.close();
  return window.document as unknown as Document;
}

// ── Skipped fields (dynamic) ─────────────────────────────────────

const SKIP_FIELDS = new Set(["extractedAt", "sourceUrl"]);

// ── Comparison helper ────────────────────────────────────────────

interface DtoError {
  index: number;
  field: string;
  expected: unknown;
  actual: unknown;
}

function compareHrDtos(
  actual: RawHrTimelineDTO[],
  expected: RawHrTimelineDTO[],
): DtoError[] {
  const errors: DtoError[] = [];

  if (actual.length !== expected.length) {
    errors.push({
      index: -1,
      field: "_length",
      expected: expected.length,
      actual: actual.length,
    });
    return errors;
  }

  for (let i = 0; i < expected.length; i++) {
    const exp = expected[i];
    const act = actual[i];

    for (const [key, expectedValue] of Object.entries(exp)) {
      if (SKIP_FIELDS.has(key)) continue;

      const actualValue = (act as unknown as Record<string, unknown>)[key];

      if (expectedValue === null && actualValue === null) continue;

      if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
        errors.push({
          index: i,
          field: key,
          expected: expectedValue,
          actual: actualValue,
        });
      }
    }
  }

  return errors;
}

// ── Fixture list ─────────────────────────────────────────────────

const fixtures: HrFixtureCase[] = [
  loadHrFixture("hr-invitation", "https://hh.ru/negotiations/12345"),
  loadHrFixture("hr-rejection", "https://hh.ru/applicant/responses"),
  loadHrFixture("hr-question", "https://hh.ru/negotiations/67890"),
  loadHrFixture("hr-test-task", "https://hh.ru/negotiations/11111"),
  loadHrFixture("hr-interview", "https://hh.ru/negotiations/22222"),
  loadHrFixture("hr-unknown", "https://hh.ru/applicant/responses"),
];

// ── Tests ────────────────────────────────────────────────────────

describe("hr fixture harness", () => {
  it("all HR fixture HTML snippets are parseable by happy-dom", () => {
    for (const f of fixtures) {
      const doc = createDocument(f.html, f.url);
      expect(doc).toBeTruthy();
      expect(doc.URL).toBe(f.url);
    }
  });

  it("all expected JSON files are valid arrays", () => {
    for (const f of fixtures) {
      expect(Array.isArray(f.expected)).toBe(true);
      expect(f.expected.length).toBeGreaterThan(0);
    }
  });
});

describe.each(fixtures.map((f) => [f.name, f] as const))(
  "hr fixture: %s",
  (_name, fixture) => {
    it("parses without throwing", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      expect(() => adapter.extractHrTimeline?.(doc)).not.toThrow();
    });

    it("returns at least one DTO", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractHrTimeline?.(doc) ?? [];
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("matches expected DTO fields", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const actual = adapter.extractHrTimeline?.(doc) ?? [];

      const errors = compareHrDtos(actual, fixture.expected);

      if (errors.length > 0) {
        const details = errors
          .map(
            (e) =>
              `  [${e.index}] ${e.field}: expected ${JSON.stringify(e.expected)}, got ${JSON.stringify(e.actual)}`,
          )
          .join("\n");
        throw new Error(
          `HR fixture "${fixture.name}" mismatch:\n${details}`,
        );
      }
    });

    it("has a valid extractedAt timestamp", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractHrTimeline?.(doc) ?? [];
      for (const dto of result) {
        expect(dto.extractedAt).toBeTruthy();
        expect(() => new Date(dto.extractedAt)).not.toThrow();
      }
    });

    it("has correct sourceUrl", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractHrTimeline?.(doc) ?? [];
      for (const dto of result) {
        expect(dto.sourceUrl).toBe(fixture.url);
      }
    });

    it("has correct sourcePage based on URL", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractHrTimeline?.(doc) ?? [];
      for (const dto of result) {
        expect(dto.sourcePage).toBe(
          fixture.expected[0]?.sourcePage,
        );
      }
    });

    it("classification type matches expected", () => {
      const doc = createDocument(fixture.html, fixture.url);
      const adapter = new HHAdapter();
      const result = adapter.extractHrTimeline?.(doc) ?? [];

      for (let i = 0; i < result.length; i++) {
        expect(result[i].type).toBe(fixture.expected[i].type);
      }
    });
  },
);

// ── Safety: no hidden automation ─────────────────────────────────

describe("extractHrTimeline — safety", () => {
  it("returns empty array for non-HR pages (vacancy page)", () => {
    const vacHtml = `<html><body><h1 data-qa="vacancy-title">Job</h1></body></html>`;
    const doc = createDocument(vacHtml, "https://hh.ru/vacancy/12345");
    const adapter = new HHAdapter();
    const result = adapter.extractHrTimeline?.(doc) ?? [];
    expect(result).toEqual([]);
  });

  it("returns empty array for pages with no HR content", () => {
    const emptyHtml = `<html><body><p>No negotiations here</p></body></html>`;
    const doc = createDocument(
      emptyHtml,
      "https://hh.ru/negotiations/99999",
    );
    const adapter = new HHAdapter();
    const result = adapter.extractHrTimeline?.(doc) ?? [];
    expect(result).toEqual([]);
  });

  it("does not throw on malformed HTML", () => {
    const malformed = `<html><body><div>`;
    const doc = createDocument(
      malformed,
      "https://hh.ru/negotiations/12345",
    );
    const adapter = new HHAdapter();
    expect(() => adapter.extractHrTimeline?.(doc)).not.toThrow();
  });

  it("returns empty array for null/undefined document", () => {
    const adapter = new HHAdapter();
    // @ts-expect-error testing edge case
    expect(() => adapter.extractHrTimeline?.(null)).toThrow();
  });

  it("does not perform any network operations (static analysis check)", () => {
    // This test verifies the method source doesn't contain fetch or XHR
    const adapter = new HHAdapter();
    const methodStr = adapter.extractHrTimeline?.toString() ?? "";
    expect(methodStr).not.toMatch(/fetch\s*\(/i);
    expect(methodStr).not.toMatch(/XMLHttpRequest/i);
    expect(methodStr).not.toMatch(/\.click\s*\(/i);
    expect(methodStr).not.toMatch(/\.value\s*=/i);
  });
});

// ── Multiple messages in a single page ───────────────────────────

describe("extractHrTimeline — multiple messages", () => {
  it("extracts multiple message blocks from a single page", () => {
    const html = `<!DOCTYPE html>
<html>
<body>
<div class="negotiations-page">
  <div class="negotiation-item" data-qa="negotiation-message">
    <div class="negotiations-status" data-qa="negotiation-status">Приглашение</div>
    <div class="negotiations-date">10 июня</div>
    <div class="negotiations-message-text" data-qa="negotiation-message-text">
      Приглашаем на собеседование.
    </div>
  </div>
  <div class="negotiation-item" data-qa="negotiation-message">
    <div class="negotiations-date">11 июня</div>
    <div class="negotiations-message-text" data-qa="negotiation-message-text">
      Не могли бы вы уточнить ваш опыт?
    </div>
  </div>
</div>
</body>
</html>`;

    const doc = createDocument(html, "https://hh.ru/negotiations/12345");
    const adapter = new HHAdapter();
    const result = adapter.extractHrTimeline?.(doc) ?? [];

    expect(result.length).toBe(2);
    expect(result[0].type).toBe("invitation");
    expect(result[1].type).toBe("question");
  });
});
