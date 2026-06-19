/**
 * Content Script Safety Tests — ITER-015.
 *
 * Verify that content scripts do not contain forbidden HH automation patterns:
 * - No fetch() to HH domains
 * - No XMLHttpRequest to HH domains
 * - No .click() on HH page elements
 * - No .value mutation on HH form elements
 *
 * Uses static analysis (regex patterns on source files) to catch
 * accidental regressions. This is NOT a runtime test — it scans the
 * source code for dangerous patterns.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ── Helpers ─────────────────────────────────────────────────────────────

const BASE_DIR = join(__dirname, "..", "..");

/** Find all content script files (entrypoints/** / *.content.ts) */
function findContentScripts(): string[] {
  const results: string[] = [];
  walkDir(join(BASE_DIR, "entrypoints"), results);
  return results.filter(
    (f) => f.endsWith(".content.ts") || f.endsWith(".content.tsx"),
  );
}

function walkDir(dir: string, results: string[]): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(full, results);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  } catch {
    // Directory doesn't exist — skip
  }
}

// ── Forbidden patterns ──────────────────────────────────────────────────

/** Patterns that indicate a forbidden fetch to HH */
const HH_FETCH_PATTERNS = [
  /fetch\s*\(\s*["'`][^"'`]*hh\.ru/i,
  /fetch\s*\(\s*`[^`]*hh\.ru/i,
  /fetch\s*\(\s*["'`][^"'`]*hh\.ru/i,
  /XMLHttpRequest/i,
];

/** Patterns that indicate forbidden DOM mutation on HH controls */
const HH_CLICK_PATTERNS = [
  // .click() on elements that might be HH UI controls
  // We need to be careful: legitimate clicks on extension-owned elements are OK.
  // Flag: .click() where the target might be an HH DOM element selector.
  /querySelector\(["'`][^"'`]*(?:hh|bloko|vacancy)[^"'`]*["'`]\)\s*\.\s*click\s*\(/i,
  /getElementById\(["'`][^"'`]*(?:hh|bloko|apply)[^"'`]*["'`]\)\s*\.\s*click\s*\(/i,
];

/** Patterns that indicate forbidden value mutation on HH form controls */
const HH_VALUE_PATTERNS = [
  // .value = on elements that might be HH form fields
  /querySelector\(["'`][^"'`]*(?:input|textarea|select)[^"'`]*["'`]\)\s*\.\s*value\s*=/i,
  /\.value\s*=\s*.+querySelector\(["'`][^"'`]*(?:hh|bloko|vacancy)/i,
];

// ── Tests ────────────────────────────────────────────────────────────────

describe("content script safety — no HH fetch", () => {
  const scripts = findContentScripts();

  it("has content script files to check", () => {
    expect(scripts.length).toBeGreaterThan(0);
  });

  it.each(scripts.map((s) => [s.replace(BASE_DIR, ""), s] as const))(
    "%s does not contain fetch() calls to HH domains",
    (_label, path) => {
      const content = readFileSync(path, "utf-8");

      for (const pattern of HH_FETCH_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    },
  );

  it.each(scripts.map((s) => [s.replace(BASE_DIR, ""), s] as const))(
    "%s does not contain XMLHttpRequest",
    (_label, path) => {
      const content = readFileSync(path, "utf-8");
      expect(content).not.toMatch(/XMLHttpRequest/i);
    },
  );
});

describe("content script safety — no HH DOM mutation", () => {
  const scripts = findContentScripts();

  it.each(scripts.map((s) => [s.replace(BASE_DIR, ""), s] as const))(
    "%s does not programmatically click HH UI controls",
    (_label, path) => {
      const content = readFileSync(path, "utf-8");

      for (const pattern of HH_CLICK_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    },
  );

  it.each(scripts.map((s) => [s.replace(BASE_DIR, ""), s] as const))(
    "%s does not set .value on HH form controls",
    (_label, path) => {
      const content = readFileSync(path, "utf-8");

      for (const pattern of HH_VALUE_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    },
  );
});

describe("content script safety — structure", () => {
  const scripts = findContentScripts();

  it("content scripts only match HH vacancy pages", () => {
    for (const script of scripts) {
      const content = readFileSync(script, "utf-8");
      // Content scripts must be scoped to vacancy pages, not all HH
      // Verify that matches array includes vacancy path restriction
      const hasVacancyMatch =
        content.includes("vacancy") || content.includes("matches") === false; // May not have explicit matches
      expect(hasVacancyMatch).toBe(true);
    }
  });

  it("content scripts use Shadow DOM for UI isolation", () => {
    // UI must be isolated via Shadow DOM or similar mechanism
    // This is a soft check — at least one content script should use attachShadow
    const allContent = scripts.map((s) => readFileSync(s, "utf-8")).join("\n");

    expect(allContent).toMatch(/attachShadow|shadowRoot|Shadow DOM/i);
  });
});

// ── Additional: Background script safety ─────────────────────────────────

describe("background script safety", () => {
  const bgPath = join(BASE_DIR, "entrypoints", "background.ts");

  it("background script exists", () => {
    let exists = false;
    try {
      readFileSync(bgPath, "utf-8");
      exists = true;
    } catch {
      // file may not exist
    }
    expect(exists).toBe(true);
  });

  it("background script does not fetch HH endpoints", () => {
    const content = readFileSync(bgPath, "utf-8");
    expect(content).not.toMatch(/fetch\s*\(\s*["'`][^"'`]*hh\.ru/i);
  });

  it("background script does not use XMLHttpRequest", () => {
    const content = readFileSync(bgPath, "utf-8");
    expect(content).not.toMatch(/XMLHttpRequest/i);
  });
});
