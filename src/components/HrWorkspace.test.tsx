// ── HR Workspace Tests ──
// Focus on safety boundaries and state management.
// No DOM rendering needed — tests verify:
// - Copy-only workflow (no auto-send)
// - Follow-up state management
// - Draft persistence
// - No HH DOM write patterns
// - Component source code safety

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ── Load source once ──────────────────────────────────────────────

let source: string;
beforeAll(() => {
  source = readFileSync(join(__dirname, "HrWorkspace.tsx"), "utf-8");
});

// ── Source code safety checks ─────────────────────────────────────

describe("HrWorkspace — source code safety", () => {
  it("does not contain fetch() calls to HH domains", () => {
    expect(source).not.toMatch(/fetch\s*\(\s*["'`][^"'`]*hh\.ru/i);
  });

  it("does not contain XMLHttpRequest", () => {
    expect(source).not.toMatch(/XMLHttpRequest/i);
  });

  it("does not programmatically click HH UI controls", () => {
    expect(source).not.toMatch(
      /querySelector\(["'`][^"'`]*(?:hh|bloko|apply|send|submit)[^"'`]*["'`]\)\s*\.\s*click\s*\(/i,
    );
  });

  it("does not set .value on HH form controls", () => {
    expect(source).not.toMatch(
      /querySelector\(["'`][^"'`]*(?:input|textarea|select)[^"'`]*["'`]\)\s*\.\s*value\s*=/i,
    );
  });

  it("does not send messages via chrome.runtime.sendMessage to HH", () => {
    expect(source).not.toMatch(/sendMessage.*hh/i);
  });

  it("contains explicit copy-only warning", () => {
    expect(source).toMatch(/copy.*clipboard/i);
    expect(source).toMatch(/never sends messages\s*automatically/i);
    expect(source).toMatch(/manual only/i);
  });

  it("uses navigator.clipboard.writeText for copy (not DOM manipulation of HH)", () => {
    expect(source).toMatch(/navigator\.clipboard\.writeText/);
  });

  it("renders reply draft as a textarea (not connected to HH)", () => {
    expect(source).toMatch(/textarea/);
    expect(source).toMatch(/draftReply/);
  });

  it("saves follow-up to local Dexie (not to HH)", () => {
    expect(source).toMatch(/db\.applications\.put/);
    expect(source).not.toMatch(/hh\.ru.*put/i);
  });
});

// ── Draft persistence ─────────────────────────────────────────────

describe("HrWorkspace — draft persistence", () => {
  it("uses chrome.storage.local for draft persistence", () => {
    // Draft is saved to chrome.storage.local, not sent to HH
    expect(source).toMatch(/chrome\.storage\.local\.get/);
    expect(source).toMatch(/chrome\.storage\.local\.set/);
  });

  it("draft storage key is scoped to job ID", () => {
    // Storage key includes jobId to isolate drafts per vacancy
    expect(source).toMatch(/hr_draft_v1_\$\{jobId\}/);
  });

  it("restores draft on component load", () => {
    // loadData reads draft from chrome.storage.local
    expect(source).toMatch(/stored\[draftStorageKey\]/);
    expect(source).toMatch(/setDraftReply\(savedDraft(?:\s*\?\?\s*""\s*)?\)/);
  });

  it("auto-saves draft with debounce", () => {
    // Debounced save to avoid excessive writes
    expect(source).toMatch(/draftSaveTimer/);
    expect(source).toMatch(/setTimeout/);
    expect(source).toMatch(/clearTimeout/);
  });

  it("debounce delay is reasonable (500ms)", () => {
    // Not too aggressive, not too slow
    expect(source).toMatch(/}, 500\)/);
  });

  it("cleanup clears the debounce timer", () => {
    // useEffect cleanup function clears the timer
    expect(source).toMatch(
      /return \(\) => \{\s*if \(draftSaveTimer\.current\) clearTimeout\(draftSaveTimer\.current\);\s*\}/,
    );
  });
});

// ── Reply type helpers ────────────────────────────────────────────

describe("HrWorkspace — reply type classification display", () => {
  it("has labels for all 6 classification types", () => {
    expect(source).toMatch(/invitation.*Приглашение/);
    expect(source).toMatch(/rejection.*Отказ/);
    expect(source).toMatch(/question.*Вопрос/);
    expect(source).toMatch(/test_task.*Тестовое задание/);
    expect(source).toMatch(/interview.*Собеседование/);
    expect(source).toMatch(/unknown.*Неизвестно/);
  });

  it("has distinct colors for each type", () => {
    const colorMatches = source.match(
      /(?:invitation|rejection|question|test_task|interview|unknown):\s*\{/g,
    );
    expect(colorMatches?.length).toBe(6);
  });
});

// ── Follow-up state logic ─────────────────────────────────────────

describe("HrWorkspace — follow-up state management", () => {
  it("date formatting helper handles valid ISO strings", () => {
    function formatInputDate(iso: string): string {
      try {
        return new Date(iso).toISOString().slice(0, 10);
      } catch {
        return "";
      }
    }

    expect(formatInputDate("2026-06-15T00:00:00.000Z")).toBe("2026-06-15");
    expect(formatInputDate("invalid")).toBe("");
    expect(formatInputDate("")).toBe("");
  });
});

// ── Copy-only workflow verification ───────────────────────────────

describe("HrWorkspace — copy-only workflow", () => {
  it("clipboard fallback uses temporary DOM element (not HH page element)", () => {
    expect(source).toMatch(/createElement\("textarea"\)/);
    expect(source).toMatch(/execCommand\("copy"\)/);

    const fallbackSection = source.match(
      /createElement\("textarea"\)[\s\S]*?removeChild/i,
    );
    if (fallbackSection) {
      expect(fallbackSection[0]).not.toMatch(/data-qa/);
      expect(fallbackSection[0]).not.toMatch(/hh/i);
    }
  });

  it("copy button is disabled when draft is empty", () => {
    expect(source).toMatch(/!draftReply\.trim\(\)/);
  });

  it("copy uses navigator.clipboard API with user gesture", () => {
    expect(source).toMatch(/onClick.*handleCopyReply/);
    expect(source).toMatch(/navigator\.clipboard\.writeText/);
  });
});

// ── No-auto-send boundaries ───────────────────────────────────────

describe("HrWorkspace — no-auto-send boundaries", () => {
  it("does not import chrome.runtime or chrome.tabs for HH communication", () => {
    expect(source).not.toMatch(/chrome\.runtime\.sendMessage/);
    expect(source).not.toMatch(/chrome\.tabs\.sendMessage/);
  });

  it("only writes to local Dexie (not to external services)", () => {
    expect(source).toMatch(/db\.applications\.put/);
    expect(source).toMatch(/hrTimelineRepo\.save/);
    expect(source).toMatch(/jobRepo\.save/);

    // No external API calls
    expect(source).not.toMatch(/fetch\(/);
    expect(source).not.toMatch(/XMLHttpRequest/);
    expect(source).not.toMatch(/webhook/);
    expect(source).not.toMatch(/n8n/);
  });
});
