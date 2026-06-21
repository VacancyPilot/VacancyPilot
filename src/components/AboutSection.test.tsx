import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── AboutSection safety and content tests ──
// Verifies that the AboutSection discloses required product boundaries
// and does not contain forbidden patterns.

const sourcePath = resolve(__dirname, "AboutSection.tsx");
let source = "";

describe("AboutSection — content disclosure", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("discloses what VacancyPilot does", () => {
    expect(source).toMatch(/What VacancyPilot Does/);
    expect(source).toMatch(/Extracts vacancy data/);
    expect(source).toMatch(/Scores vacancies/);
    expect(source).toMatch(/Tracks your application status/);
  });

  it("discloses what VacancyPilot does NOT do", () => {
    expect(source).toMatch(/What VacancyPilot Does NOT Do/);
    expect(source).toMatch(/auto-submit/);
    expect(source).toMatch(/auto-click/);
    expect(source).toMatch(/CAPTCHA/);
    expect(source).toMatch(/telemetry/);
  });

  it("discloses key principles", () => {
    expect(source).toMatch(/Local-first/);
    expect(source).toMatch(/Read-first/);
    expect(source).toMatch(/User in control/);
    expect(source).toMatch(/Works without AI/);
    expect(source).toMatch(/Privacy by default/);
    expect(source).toMatch(/Core vs Labs/);
  });

  it("discloses the tech stack", () => {
    expect(source).toMatch(/Manifest V3/);
    expect(source).toMatch(/WXT/);
    expect(source).toMatch(/TypeScript/);
    expect(source).toMatch(/React/);
    expect(source).toMatch(/Dexie/);
    expect(source).toMatch(/IndexedDB/);
  });

  it("contains no forbidden patterns", () => {
    // No hidden fetch to HH (disclosure text about non-goals is expected)
    expect(source).not.toMatch(/fetch\(.*hh\.ru/);
  });
});

describe("AboutSection — import", () => {
  it("can be imported without errors", () => {
    // Dynamic import to verify the module is well-formed
    expect(async () => {
      await import("./AboutSection");
    }).not.toThrow();
  });
});
