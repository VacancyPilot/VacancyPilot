import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const contentScriptPath = join(
  __dirname,
  "..",
  "..",
  "entrypoints",
  "search.content.ts",
);

function readSearchContentScript(): string {
  return readFileSync(contentScriptPath, "utf-8");
}

describe("search highlights content flow safety", () => {
  it("does not gate search highlights on the page badge setting", () => {
    const content = readSearchContentScript();

    expect(content).not.toContain("showPageBadge");
  });

  it("uses link-based discovery when legacy card selectors fail", () => {
    const content = readSearchContentScript();

    expect(content).toContain("discoverSearchCardsFromLinks");
    expect(content).not.toMatch(
      /adapter\.extractSearchList\(document\);\s*if\s*\([^)]*\.length\s*===\s*0\)\s*return/s,
    );
  });

  it("clears extension-owned markers when search highlights are disabled", () => {
    const content = readSearchContentScript();

    expect(content).toContain("if (!controls.enabled)");
    expect(content).toContain("clearSearchBadgeRenderState(document)");
  });
});
