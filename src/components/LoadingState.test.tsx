import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── LoadingState content tests ──
// Verifies the component renders the expected structure
// and uses shared design tokens instead of hardcoded values.

const sourcePath = resolve(__dirname, "LoadingState.tsx");
let source = "";

describe("LoadingState — content", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("renders a centered message", () => {
    expect(source).toMatch(/interface LoadingStateProps/);
    expect(source).toMatch(/message\?/);
    expect(source).toMatch(/export function LoadingState/);
    expect(source).toMatch(/display: "flex"/);
    expect(source).toMatch(/alignItems: "center"/);
    expect(source).toMatch(/justifyContent: "center"/);
  });

  it("uses design tokens instead of hardcoded values", () => {
    expect(source).toMatch(/spacing\.empty/);
    expect(source).toMatch(/colors\.textPlaceholder/);
    expect(source).toMatch(/fontSizes\.body/);
    expect(source).toMatch(/fontFamily/);
  });

  it("has no hardcoded hex color", () => {
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("default message is Loading…", () => {
    expect(source).toContain("Loading");
  });

  it("contains no forbidden patterns", () => {
    expect(source).not.toMatch(/fetch\(/);
  });
});

describe("LoadingState — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./LoadingState");
    }).not.toThrow();
  });
});
