import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── OnboardingSection safety and content tests ──
// Verifies required onboarding disclosures from spec §18.1.

const sourcePath = resolve(__dirname, "OnboardingSection.tsx");
let source = "";

describe("OnboardingSection — content disclosure", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("discloses what VacancyPilot does (spec §18.1.1)", () => {
    expect(source).toMatch(/What VacancyPilot Does/);
    expect(source).toMatch(/Parses and scores/);
    expect(source).toMatch(/Tracks your application status/);
  });

  it("discloses what VacancyPilot does NOT do (spec §18.1.2)", () => {
    expect(source).toMatch(/What VacancyPilot Does NOT Do/);
    expect(source).toMatch(/auto-submit/);
    expect(source).toMatch(/auto-click/);
    expect(source).toMatch(/CAPTCHA/);
  });

  it("explains permissions used (spec §18.1.3)", () => {
    expect(source).toMatch(/Permissions Used/);
    expect(source).toMatch(/storage/);
    expect(source).toMatch(/sidePanel/);
    expect(source).toMatch(/activeTab/);
  });

  it("explains where data is stored (spec §18.1.4)", () => {
    expect(source).toMatch(/Where Data Is Stored/);
    expect(source).toMatch(/IndexedDB/);
    expect(source).toMatch(/chrome\.storage\.local/);
    expect(source).toMatch(/only in your browser/);
  });

  it("explains how AI works (spec §18.1.5)", () => {
    expect(source).toMatch(/How AI Works/);
    expect(source).toMatch(/opt-in/);
    expect(source).toMatch(/payload preview/);
    expect(source).toMatch(/Strict Privacy mode/);
  });

  it("explains how n8n works (spec §18.1.6)", () => {
    expect(source).toMatch(/How n8n/);
    expect(source).toMatch(/Labs/);
    expect(source).toMatch(/off by default/);
  });

  it("explains API key security warning (spec §18.1.8)", () => {
    expect(source).toMatch(/API Key Security/);
    expect(source).toMatch(/plaintext/);
    expect(source).toMatch(/not a secure vault/);
  });

  it("explains that Labs are off by default (spec §18.1.10)", () => {
    expect(source).toMatch(/off by default/);
    expect(source).toMatch(/not required for core/);
  });

  it("includes setup steps (spec §18.2)", () => {
    expect(source).toMatch(/Quick Setup/);
    expect(source).toMatch(/Create a Profile/);
    expect(source).toMatch(/Add Resume Highlights/);
    expect(source).toMatch(/Configure AI Provider/);
    expect(source).toMatch(/Configure n8n/);
  });

  it("contains no forbidden patterns", () => {
    expect(source).not.toMatch(/fetch\(.*hh\.ru/);
    expect(source).not.toMatch(/XMLHttpRequest/);
  });
});

describe("OnboardingSection — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./OnboardingSection");
    }).not.toThrow();
  });
});
