/**
 * Storage API Safety Test — ITER-028.
 *
 * Static analysis: forbids usage of `chrome.storage.local.onChanged` across
 * all project source files. The correct API is `chrome.storage.onChanged`
 * with `areaName === "local"` filter.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ── Helpers ─────────────────────────────────────────────────────────────

const BASE_DIR = join(__dirname, "..", "..");

function findSourceFiles(): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules, .output, .git
          if (
            entry.name === "node_modules" ||
            entry.name === ".output" ||
            entry.name === ".git" ||
            entry.name === "dist"
          ) {
            continue;
          }
          walk(full);
        } else if (entry.isFile()) {
          const ext = entry.name.split(".").pop()?.toLowerCase();
          if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
            // Exclude this test file itself (it references the forbidden API in comments)
            if (full.includes("storage-api-safety")) continue;
            results.push(full);
          }
        }
      }
    } catch {
      // Directory doesn't exist — skip
    }
  }

  walk(BASE_DIR);
  return results;
}

// ── Forbidden pattern ───────────────────────────────────────────────────

const FORBIDDEN_STORAGE_API = /chrome\.storage\.local\.onChanged/;

// ── Tests ────────────────────────────────────────────────────────────────

describe("storage API safety — no chrome.storage.local.onChanged", () => {
  const sourceFiles = findSourceFiles();

  it("has source files to check", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it.each(
    sourceFiles
      .map((f) => [f.replace(BASE_DIR, "").replace(/\\/g, "/"), f] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  )("%s does not use chrome.storage.local.onChanged", (_label, path) => {
    const content = readFileSync(path, "utf-8");
    expect(content).not.toMatch(FORBIDDEN_STORAGE_API);
  });
});
