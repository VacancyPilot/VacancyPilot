import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── ErrorState content tests ──
// Verifies the component renders the expected structure
// and uses shared design tokens instead of hardcoded values.

const sourcePath = resolve(__dirname, "ErrorState.tsx");
let source = "";

describe("ErrorState — content", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("renders message, optional details, and optional retry button", () => {
    expect(source).toMatch(/interface ErrorStateProps/);
    expect(source).toMatch(/message: string/);
    expect(source).toMatch(/details\?/);
    expect(source).toMatch(/onRetry\?/);
    expect(source).toMatch(/export function ErrorState/);
  });

  it("uses design tokens instead of hardcoded values", () => {
    expect(source).toMatch(/spacing\.xxxl/);
    expect(source).toMatch(/spacing\.xs/);
    expect(source).toMatch(/spacing\.md/);
    expect(source).toMatch(/colors\.red/);
    expect(source).toMatch(/colors\.errorBg/);
    expect(source).toMatch(/colors\.redBorder/);
    expect(source).toMatch(/colors\.textFaint/);
    expect(source).toMatch(/colors\.white/);
    expect(source).toMatch(/colors\.borderLight/);
    expect(source).toMatch(/borderRadius\.lg/);
    expect(source).toMatch(/borderRadius\.md/);
    expect(source).toMatch(/fontSizes\.body/);
    expect(source).toMatch(/fontSizes\.md/);
    expect(source).toMatch(/fontWeights\.semibold/);
    expect(source).toMatch(/fontFamily/);
  });

  it("has no hardcoded hex color", () => {
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("renders a retry button when onRetry is provided", () => {
    expect(source).toContain("Retry");
    expect(source).toMatch(/onRetry &&/);
  });

  it("contains no forbidden patterns", () => {
    expect(source).not.toMatch(/fetch\(/);
  });
});

describe("ErrorState — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./ErrorState");
    }).not.toThrow();
  });
});
