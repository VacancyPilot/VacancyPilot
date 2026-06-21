import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── PermissionsSection safety and content tests ──
// Verifies permission disclosure matches real manifest (spec §19.6).

const sourcePath = resolve(__dirname, "PermissionsSection.tsx");
let source = "";

describe("PermissionsSection — manifest alignment", () => {
  beforeAll(() => {
    source = readFileSync(sourcePath, "utf-8");
  });

  it("lists required permissions from the real manifest", () => {
    expect(source).toMatch(/"storage"/);
    expect(source).toMatch(/"sidePanel"/);
    expect(source).toMatch(/"activeTab"/);
  });

  it("states that no host permissions are declared in the current build", () => {
    expect(source).toMatch(/no declared host permissions/i);
    expect(source).toMatch(/https:\/\/hh\.ru\/\*/);
  });

  it("states that no optional runtime permissions are declared", () => {
    expect(source).toMatch(/no optional runtime permissions/i);
    expect(source).toMatch(/clipboardWrite/);
    expect(source).toMatch(/alarms/);
  });

  it("provides explanation for every permission", () => {
    const permissionEntries = source.match(/permission:/g);
    expect(permissionEntries).toBeTruthy();
    expect(permissionEntries!.length).toBeGreaterThanOrEqual(3);
  });

  it("includes access revocation instructions", () => {
    expect(source).toMatch(/How to Revoke Access/);
    expect(source).toMatch(/chrome:\/\/extensions\//);
    expect(source).toMatch(/remove the extension/i);
  });

  it("does not request forbidden permissions", () => {
    expect(source).not.toMatch(/"cookies"/);
    expect(source).not.toMatch(/"webRequest"/);
    expect(source).not.toMatch(/"nativeMessaging"/);
    expect(source).not.toMatch(/<all_urls>/);
  });

  it("contains no forbidden patterns", () => {
    expect(source).not.toMatch(/fetch\(.*hh\.ru/);
    expect(source).not.toMatch(/XMLHttpRequest/);
  });

  it("keeps AI and n8n described as integrations, not declared permissions", () => {
    expect(source).toMatch(/OpenAI/);
    expect(source).toMatch(/DeepSeek/);
    expect(source).toMatch(/OpenRouter/);
    expect(source).toMatch(/n8n/);
    expect(source).toMatch(/opt-in product features/i);
  });
});

describe("PermissionsSection — import", () => {
  it("can be imported without errors", () => {
    expect(async () => {
      await import("./PermissionsSection");
    }).not.toThrow();
  });
});
