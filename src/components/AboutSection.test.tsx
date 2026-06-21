import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── AboutSection safety and content tests ──
// Verifies that the AboutSection presents compact product identity
// and delegates trust/safety disclosures to TrustSafetySummary.

const sourcePath = resolve(__dirname, "AboutSection.tsx");
let source = "";

describe("AboutSection — product identity", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("presents the product name and tagline", () => {
    expect(source).toMatch(/About VacancyPilot/);
    expect(source).toMatch(/local-first, read-first/);
  });

  it("shows the product status", () => {
    expect(source).toMatch(/Status.*Private alpha/);
    expect(source).toMatch(/dogfooding/);
  });

  it("discloses the tech stack", () => {
    expect(source).toMatch(/Manifest V3/);
    expect(source).toMatch(/WXT/);
    expect(source).toMatch(/TypeScript/);
    expect(source).toMatch(/React/);
    expect(source).toMatch(/Dexie/);
    expect(source).toMatch(/IndexedDB/);
  });

  it("delegates trust/safety content to TrustSafetySummary", () => {
    expect(source).toMatch(/TrustSafetySummary/);
  });

  it("contains no forbidden patterns", () => {
    expect(source).not.toMatch(/fetch\(.*hh\.ru/);
  });
});

describe("AboutSection — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./AboutSection");
    }).not.toThrow();
  });
});
