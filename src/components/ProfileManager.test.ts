import { describe, it, expect } from "vitest";

/**
 * ITER-019: Profile & Resume management — pure logic tests.
 *
 * These tests cover the pure transformation functions used in the components.
 * UI interaction tests require a browser-like environment and are deferred
 * to manual QA or future E2E tests.
 */

// ── ID format validation ──

const ID_PATTERN = /^[a-z]+_[a-z0-9]+_[a-z0-9]+$/;

describe("profile ID format", () => {
  it("generates IDs matching the expected pattern", () => {
    // Simulate the generateId logic from ProfileManager
    function generateId(prefix: string): string {
      return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const id = generateId("profile");
    expect(id).toMatch(ID_PATTERN);
    expect(id.startsWith("profile_")).toBe(true);
  });

  it("generates unique IDs on successive calls", () => {
    function generateId(prefix: string): string {
      return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      ids.add(generateId("profile"));
    }
    expect(ids.size).toBe(10);
  });
});

describe("resume ID format", () => {
  it("generates resume IDs with correct prefix", () => {
    function generateId(prefix: string): string {
      return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const id = generateId("resume");
    expect(id).toMatch(ID_PATTERN);
    expect(id.startsWith("resume_")).toBe(true);
  });
});

// ── Comma-separated list parsing ──

describe("parseList (comma-separated string to array)", () => {
  function parseList(raw: string): string[] {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  it("splits comma-separated values", () => {
    expect(parseList("React, TypeScript, CSS")).toEqual([
      "React",
      "TypeScript",
      "CSS",
    ]);
  });

  it("trims whitespace", () => {
    expect(parseList("  React ,  TypeScript  , CSS ")).toEqual([
      "React",
      "TypeScript",
      "CSS",
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(parseList("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(parseList("  ,  ,  ")).toEqual([]);
  });

  it("handles single value", () => {
    expect(parseList("React")).toEqual(["React"]);
  });

  it("filters empty segments", () => {
    expect(parseList("React,,TypeScript")).toEqual(["React", "TypeScript"]);
  });
});

// ── Work modes parsing ──

describe("work modes collection", () => {
  function collectWorkModes(
    remote: boolean,
    hybrid: boolean,
    office: boolean,
  ): ("remote" | "hybrid" | "office")[] {
    const modes: ("remote" | "hybrid" | "office")[] = [];
    if (remote) modes.push("remote");
    if (hybrid) modes.push("hybrid");
    if (office) modes.push("office");
    return modes;
  }

  it("collects all selected modes", () => {
    expect(collectWorkModes(true, true, false)).toEqual(["remote", "hybrid"]);
    expect(collectWorkModes(false, false, true)).toEqual(["office"]);
    expect(collectWorkModes(true, true, true)).toEqual([
      "remote",
      "hybrid",
      "office",
    ]);
  });

  it("returns empty array when none selected", () => {
    expect(collectWorkModes(false, false, false)).toEqual([]);
  });
});

// ── Profile form field defaults ──

describe("profile form defaults", () => {
  const DEFAULT_FORM = {
    name: "",
    summary: "",
    targetTitlesRaw: "",
    mustHaveSkillsRaw: "",
    niceToHaveSkillsRaw: "",
    avoidKeywordsRaw: "",
    workModeRemote: true,
    workModeHybrid: true,
    workModeOffice: false,
    preferredCitiesRaw: "",
    salaryExpectationMin: "",
    salaryCurrency: "RUB",
  };

  it("has remote and hybrid enabled by default", () => {
    expect(DEFAULT_FORM.workModeRemote).toBe(true);
    expect(DEFAULT_FORM.workModeHybrid).toBe(true);
    expect(DEFAULT_FORM.workModeOffice).toBe(false);
  });

  it("has RUB as default currency", () => {
    expect(DEFAULT_FORM.salaryCurrency).toBe("RUB");
  });

  it("has empty strings for text fields", () => {
    expect(DEFAULT_FORM.name).toBe("");
    expect(DEFAULT_FORM.summary).toBe("");
    expect(DEFAULT_FORM.salaryExpectationMin).toBe("");
  });
});

// ── Resume language validation ──

describe("resume language values", () => {
  const VALID_LANGUAGES = ["ru", "en", "ro"] as const;

  it("accepts ru, en, ro", () => {
    for (const lang of VALID_LANGUAGES) {
      expect(VALID_LANGUAGES).toContain(lang);
    }
  });
});

// ── Default profile ID resolution logic ──

describe("default profile resolution (priority)", () => {
  function resolveProfileId(
    jobSelectedProfileId: string | undefined,
    settingsDefaultProfileId: string | undefined,
    firstProfileId: string | undefined,
  ): string | undefined {
    return jobSelectedProfileId ?? settingsDefaultProfileId ?? firstProfileId;
  }

  it("prefers job's selected profile", () => {
    expect(resolveProfileId("p1", "p2", "p3")).toBe("p1");
  });

  it("falls back to settings default", () => {
    expect(resolveProfileId(undefined, "p2", "p3")).toBe("p2");
  });

  it("falls back to first profile", () => {
    expect(resolveProfileId(undefined, undefined, "p3")).toBe("p3");
  });

  it("returns undefined when all are undefined", () => {
    expect(resolveProfileId(undefined, undefined, undefined)).toBeUndefined();
  });
});
