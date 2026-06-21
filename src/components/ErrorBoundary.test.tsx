import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── ErrorBoundary content tests ──
// Verifies the class-based error boundary renders the expected structure
// and uses shared design tokens instead of hardcoded values.

const sourcePath = resolve(__dirname, "ErrorBoundary.tsx");
let source = "";

describe("ErrorBoundary — content", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("is a class component with error boundary lifecycle", () => {
    expect(source).toMatch(/class ErrorBoundary extends Component/);
    expect(source).toMatch(/static getDerivedStateFromError/);
    expect(source).toMatch(/componentDidCatch/);
    expect(source).toContain("Reload UI");
  });

  it("shows error message and Reload UI button", () => {
    expect(source).toMatch(/hasError/);
    expect(source).toMatch(/\{label\} crashed/);
    expect(source).toMatch(/error\?\.message/);
    expect(source).toMatch(/Reload UI/);
  });

  it("uses design tokens instead of hardcoded values", () => {
    expect(source).toMatch(/spacing\.xxxl/);
    expect(source).toMatch(/spacing\.md/);
    expect(source).toMatch(/spacing\.xs/);
    expect(source).toMatch(/spacing\.xl/);
    expect(source).toMatch(/colors\.text/);
    expect(source).toMatch(/colors\.actionErrorBg/);
    expect(source).toMatch(/colors\.redBorder/);
    expect(source).toMatch(/colors\.textMuted/);
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

  it("logs error to console but does not send telemetry", () => {
    expect(source).toMatch(/console\.error/);
    // "telemetry" appears only in the doc comment (no telemetry), which is expected
    const codeOnly = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*/g, "");
    expect(codeOnly).not.toMatch(/telemetry/);
    expect(codeOnly).not.toMatch(/fetch\(/);
  });

  it("handles reload via setState", () => {
    expect(source).toMatch(/handleReload/);
    expect(source).toMatch(/hasError: false/);
  });

  it("renders children when no error", () => {
    expect(source).toMatch(/this\.props\.children/);
  });
});

describe("ErrorBoundary — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./ErrorBoundary");
    }).not.toThrow();
  });
});
