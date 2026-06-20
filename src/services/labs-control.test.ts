import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AppSettings } from "@/models/settings";
import { defaultSettings } from "@/db/settings-bridge";

/**
 * Tests for labs-control.ts gating behaviour.
 *
 * These tests verify that:
 * - Labs features are off by default.
 * - The master toggle effectively enables/disables.
 * - The kill switch overrides everything.
 * - Guided-apply toggle works independently.
 * - Daily action budget is enforced.
 */

// ── chrome.storage.local mock ──

const mockStorage = new Map<string, unknown>();

function mockGet(_keys?: string | string[] | Record<string, unknown>) {
  void _keys;
  return Promise.resolve(Object.fromEntries(mockStorage));
}

function mockSet(items: Record<string, unknown>) {
  for (const [key, value] of Object.entries(items)) {
    mockStorage.set(key, value);
  }
  return Promise.resolve();
}

// ── labsActionRepo mock ──
// We mock the repository to avoid IndexedDB dependency in the test environment.

const { mockCountSince, mockList, mockListSince } = vi.hoisted(() => ({
  mockCountSince: vi.fn<() => Promise<number>>().mockResolvedValue(0),
  mockList: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  mockListSince: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
}));

vi.mock("@/db/labs-repository", () => ({
  labsActionRepo: {
    list: mockList,
    listSince: mockListSince,
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    countSince: mockCountSince,
    deleteAll: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeEach(() => {
  mockStorage.clear();
  mockCountSince.mockResolvedValue(0);
  mockList.mockResolvedValue([]);
  mockListSince.mockResolvedValue([]);
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: mockGet,
        set: mockSet,
        remove: vi.fn(),
      },
    },
  });
});

// ── Helpers ──

async function setLabsSettings(partial: Partial<AppSettings["labs"]>) {
  const settings = defaultSettings();
  settings.labs = { ...settings.labs, ...partial };
  await mockSet({ app_settings_v1: settings });
}

async function resetToDefaults() {
  await mockSet({ app_settings_v1: defaultSettings() });
}

// ── Dynamic imports (after mock is installed) ──
// We use dynamic import so the module reads our mocked chrome.storage.

let isLabsEnabled: () => Promise<boolean>;
let isGuidedApplyEnabled: () => Promise<boolean>;
let getRemainingDailyBudget: () => Promise<number>;
let hasDailyBudget: () => Promise<boolean>;
let checkGuidedApplyGate: () => Promise<
  { allowed: true } | { allowed: false; reason: string }
>;

beforeEach(async () => {
  const mod = await import("./labs-control");
  isLabsEnabled = mod.isLabsEnabled;
  isGuidedApplyEnabled = mod.isGuidedApplyEnabled;
  getRemainingDailyBudget = mod.getRemainingDailyBudget;
  hasDailyBudget = mod.hasDailyBudget;
  checkGuidedApplyGate = mod.checkGuidedApplyGate;
});

// ── Default-off behaviour ──

describe("default-off behaviour", () => {
  it("returns false for isLabsEnabled on default settings", async () => {
    await resetToDefaults();
    expect(await isLabsEnabled()).toBe(false);
  });

  it("returns false for isGuidedApplyEnabled on default settings", async () => {
    await resetToDefaults();
    expect(await isGuidedApplyEnabled()).toBe(false);
  });

  it("returns false for hasDailyBudget on default settings (0 limit configured)", async () => {
    await resetToDefaults();
    // Default dailyActionLimit is 5, budget check requires >0 used
    expect(await hasDailyBudget()).toBe(true);
  });
});

// ── Master toggle ──

describe("master toggle", () => {
  it("isLabsEnabled returns true when master toggle is on", async () => {
    await setLabsSettings({ enabled: true });
    expect(await isLabsEnabled()).toBe(true);
  });

  it("isLabsEnabled returns false when master toggle is off", async () => {
    await setLabsSettings({ enabled: false });
    expect(await isLabsEnabled()).toBe(false);
  });
});

// ── Kill switch ──

describe("kill switch", () => {
  it("overrides master toggle — labs disabled when kill switch is on", async () => {
    await setLabsSettings({ enabled: true, killSwitchEnabled: true });
    expect(await isLabsEnabled()).toBe(false);
  });

  it("does not affect when off and master toggle is on", async () => {
    await setLabsSettings({ enabled: true, killSwitchEnabled: false });
    expect(await isLabsEnabled()).toBe(true);
  });

  it("blocks guided-apply even when master and guided-apply are on", async () => {
    await setLabsSettings({
      enabled: true,
      guidedApplyEnabled: true,
      killSwitchEnabled: true,
    });
    expect(await isGuidedApplyEnabled()).toBe(false);
  });
});

// ── Guided-apply toggle ──

describe("guided-apply toggle", () => {
  it("returns true only when master AND guided-apply are on", async () => {
    await setLabsSettings({ enabled: true, guidedApplyEnabled: true });
    expect(await isGuidedApplyEnabled()).toBe(true);
  });

  it("returns false when guided-apply is off even if master is on", async () => {
    await setLabsSettings({ enabled: true, guidedApplyEnabled: false });
    expect(await isGuidedApplyEnabled()).toBe(false);
  });

  it("returns false when master is off even if guided-apply is on", async () => {
    await setLabsSettings({ enabled: false, guidedApplyEnabled: true });
    expect(await isGuidedApplyEnabled()).toBe(false);
  });
});

// ── Daily action budget ──

describe("daily action budget", () => {
  it("getRemainingDailyBudget returns the configured limit when no actions used", async () => {
    await setLabsSettings({ dailyActionLimit: 5 });
    expect(await getRemainingDailyBudget()).toBe(5);
  });

  it("getRemainingDailyBudget returns 0 when limit is 0", async () => {
    await setLabsSettings({ dailyActionLimit: 0 });
    expect(await getRemainingDailyBudget()).toBe(0);
  });

  it("hasDailyBudget returns true when limit > 0 and no actions used", async () => {
    await setLabsSettings({ dailyActionLimit: 3 });
    expect(await hasDailyBudget()).toBe(true);
  });

  it("hasDailyBudget returns false when limit is 0", async () => {
    await setLabsSettings({ dailyActionLimit: 0 });
    expect(await hasDailyBudget()).toBe(false);
  });

  it("ignores non-budgeted logs like workspace-open events", async () => {
    await setLabsSettings({ dailyActionLimit: 3 });
    mockListSince.mockResolvedValue([
      {
        id: "a1",
        type: "guided_apply_started",
        details: {},
        createdAt: new Date().toISOString(),
      },
    ]);
    expect(await getRemainingDailyBudget()).toBe(3);
  });

  it("counts only budgeted actions toward the daily limit", async () => {
    await setLabsSettings({ dailyActionLimit: 3 });
    mockListSince.mockResolvedValue([
      {
        id: "a1",
        type: "guided_apply_started",
        details: {},
        createdAt: new Date().toISOString(),
      },
      {
        id: "a2",
        type: "guided_apply_step",
        details: { countsTowardBudget: true },
        createdAt: new Date().toISOString(),
      },
      {
        id: "a3",
        type: "guided_apply_completed",
        details: { countsTowardBudget: true },
        createdAt: new Date().toISOString(),
      },
    ]);
    expect(await getRemainingDailyBudget()).toBe(1);
  });
});

// ── Integrated gate check ──

describe("checkGuidedApplyGate", () => {
  it("returns allowed:true when all conditions are met", async () => {
    await setLabsSettings({
      enabled: true,
      guidedApplyEnabled: true,
      dailyActionLimit: 5,
    });
    const result = await checkGuidedApplyGate();
    expect(result.allowed).toBe(true);
  });

  it("rejects when labs master toggle is off", async () => {
    await setLabsSettings({
      enabled: false,
      guidedApplyEnabled: true,
      dailyActionLimit: 5,
    });
    const result = await checkGuidedApplyGate();
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("master toggle");
    }
  });

  it("rejects when kill switch is active", async () => {
    await setLabsSettings({
      enabled: true,
      guidedApplyEnabled: true,
      killSwitchEnabled: true,
      dailyActionLimit: 5,
    });
    const result = await checkGuidedApplyGate();
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("kill switch");
    }
  });

  it("rejects when guided-apply is disabled", async () => {
    await setLabsSettings({
      enabled: true,
      guidedApplyEnabled: false,
      dailyActionLimit: 5,
    });
    const result = await checkGuidedApplyGate();
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Guided apply");
    }
  });

  it("rejects when daily budget is exhausted", async () => {
    await setLabsSettings({
      enabled: true,
      guidedApplyEnabled: true,
      dailyActionLimit: 0,
    });
    const result = await checkGuidedApplyGate();
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("budget");
    }
  });
});
