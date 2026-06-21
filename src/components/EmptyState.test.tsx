import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── EmptyState content tests ──
// Verifies the component renders the expected structure
// and uses shared design tokens instead of hardcoded values.

const sourcePath = resolve(__dirname, "EmptyState.tsx");
let source = "";

describe("EmptyState — content", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("renders icon, message, and optional description", () => {
    expect(source).toMatch(/interface EmptyStateProps/);
    expect(source).toMatch(/icon\?/);
    expect(source).toMatch(/message: string/);
    expect(source).toMatch(/description\?/);
    expect(source).toMatch(/export function EmptyState/);
  });

  it("uses design tokens instead of hardcoded values", () => {
    expect(source).toMatch(/spacing\.emptyLarge/);
    expect(source).toMatch(/colors\.textPlaceholder/);
    expect(source).toMatch(/colors\.textMuted/);
    expect(source).toMatch(/fontSizes\.body/);
    expect(source).toMatch(/fontSizes\.icon/);
    expect(source).toMatch(/fontFamily/);
  });

  it("has no hardcoded hex color", () => {
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("has no hardcoded font-family string", () => {
    expect(source).not.toMatch(/"system-ui/);
  });

  it("default icon is a clipboard emoji", () => {
    expect(source).toContain("📋");
  });

  it("contains no forbidden patterns", () => {
    expect(source).not.toMatch(/fetch\(/);
  });
});

describe("EmptyState — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./EmptyState");
    }).not.toThrow();
  });
});
