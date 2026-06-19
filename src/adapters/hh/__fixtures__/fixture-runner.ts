// ── Fixture test runner for HH vacancy parser ──
// Creates a happy-dom Document from sanitized HTML snippets,
// runs the HHAdapter parser, and compares against expected DTO fields.
// Dynamic fields (extractedAt, warnings, sourceUrl) are excluded from comparison.

import { Window } from "happy-dom";
import { HHAdapter } from "../hh-adapter";
import type { RawVacancyDTO } from "../types";

// ── Types ────────────────────────────────────────────────────────

export interface FixtureError {
  field: string;
  expected: unknown;
  actual: unknown;
}

export interface FixtureResult {
  actual: RawVacancyDTO | null;
  expected: Partial<RawVacancyDTO> | null;
  errors: FixtureError[];
  passed: boolean;
}

// ── DOM creation ─────────────────────────────────────────────────

/**
 * Create a minimal Document from an HTML string and a URL.
 * The URL must match the HH vacancy pattern for the parser to work.
 */
export function createDocument(html: string, url: string): Document {
  const window = new Window({ url });
  window.document.write(html);
  window.document.close();
  // happy-dom's Document is API-compatible with browser Document
  return window.document as unknown as Document;
}

// ── Fixture runner ───────────────────────────────────────────────

const SKIP_FIELDS = new Set(["extractedAt", "warnings", "sourceUrl"]);

/**
 * Parse the HTML fixture, extract the vacancy DTO, and compare against expected.
 * Returns a detailed result with field-level errors.
 */
export function runFixture(
  html: string,
  url: string,
  expected: Partial<RawVacancyDTO> | null,
): FixtureResult {
  const doc = createDocument(html, url);
  const adapter = new HHAdapter();
  const actual = adapter.extractVacancy(doc);

  const errors = compareResults(actual, expected);
  return {
    actual,
    expected,
    errors,
    passed: errors.length === 0,
  };
}

// ── Comparison helpers ───────────────────────────────────────────

function compareResults(
  actual: RawVacancyDTO | null,
  expected: Partial<RawVacancyDTO> | null,
): FixtureError[] {
  const errors: FixtureError[] = [];

  // Both null — OK (e.g. archived vacancy)
  if (actual === null && expected === null) return [];

  // Expected null but parser returned a DTO
  if (actual !== null && expected === null) {
    errors.push({
      field: "_root",
      expected: null,
      actual: "DTO returned (expected null)",
    });
    return errors;
  }

  // Expected a DTO but parser returned null
  if (actual === null && expected !== null) {
    errors.push({ field: "_root", expected: "DTO", actual: null });
    return errors;
  }

  // Compare each expected field
  for (const [key, expectedValue] of Object.entries(expected!)) {
    if (SKIP_FIELDS.has(key)) continue;

    const actualValue = (actual! as unknown as Record<string, unknown>)[key];

    if (!deepEqual(actualValue, expectedValue)) {
      errors.push({
        field: key,
        expected: expectedValue,
        actual: actualValue,
      });
    }
  }

  return errors;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}
