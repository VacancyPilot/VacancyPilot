import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AppSettings } from "@/models/settings";
import { defaultSettings, loadSettings, saveSettings } from "./settings-bridge";

// Mock chrome.storage.local
const mockStorage = new Map<string, unknown>();

beforeEach(() => {
  mockStorage.clear();
});

// Provide a minimal chrome.storage.local mock
vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: async (keys?: string | string[] | Record<string, unknown>) => {
        const result: Record<string, unknown> = {};
        if (typeof keys === "string") {
          result[keys] = mockStorage.get(keys) ?? undefined;
        } else if (Array.isArray(keys)) {
          for (const key of keys) {
            result[key] = mockStorage.get(key) ?? undefined;
          }
        } else if (keys) {
          for (const key of Object.keys(keys)) {
            result[key] = mockStorage.get(key) ?? keys[key];
          }
        }
        return result;
      },
      set: async (items: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(items)) {
          mockStorage.set(key, value);
        }
      },
      remove: async (keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const key of keyList) {
          mockStorage.delete(key);
        }
      },
    },
  },
});

describe("defaultSettings", () => {
  it("returns factory settings with all sections present", () => {
    const settings = defaultSettings();

    expect(settings.schemaVersion).toBe(1);
    expect(settings.onboardingCompleted).toBe(false);
    expect(settings.general).toBeDefined();
    expect(settings.privacy).toBeDefined();
    expect(settings.ai).toBeDefined();
    expect(settings.n8n).toBeDefined();
    expect(settings.labs).toBeDefined();
  });

  it("has privacy defaults matching spec — strict by default", () => {
    const settings = defaultSettings();

    expect(settings.privacy.aiEnabled).toBe(false);
    expect(settings.privacy.n8nEnabled).toBe(false);
    expect(settings.privacy.strictPrivacyMode).toBe(true);
    expect(settings.privacy.allowResumeHighlightsToAI).toBe(false);
    expect(settings.privacy.redactContacts).toBe(true);
  });

  it("has general defaults", () => {
    const settings = defaultSettings();

    expect(settings.general.language).toBe("ru");
    expect(settings.general.theme).toBe("system");
    expect(settings.general.autosaveViewedJobs).toBe(true);
  });

  it("has AI disabled with safe defaults", () => {
    const settings = defaultSettings();

    expect(settings.ai.provider).toBeUndefined();
    expect(settings.ai.model).toBeUndefined();
    expect(settings.ai.dailyRequestLimit).toBe(10);
    expect(settings.ai.enableStreaming).toBe(false);
  });

  it("has n8n disabled by default", () => {
    const settings = defaultSettings();

    expect(settings.n8n.enabled).toBe(false);
    expect(settings.n8n.hmacSecretSet).toBe(false);
  });

  it("has labs disabled by default", () => {
    const settings = defaultSettings();

    expect(settings.labs.enabled).toBe(false);
    expect(settings.labs.guidedApplyEnabled).toBe(false);
  });
});

describe("loadSettings", () => {
  it("returns default settings when none are stored", async () => {
    const settings = await loadSettings();
    expect(settings).toEqual(defaultSettings());
  });

  it("returns stored settings when present", async () => {
    const custom: AppSettings = {
      ...defaultSettings(),
      general: { ...defaultSettings().general, language: "en" as const },
    };
    await saveSettings(custom);

    const loaded = await loadSettings();
    expect(loaded.general.language).toBe("en");
  });

  it("fills newly added fields for older stored settings", async () => {
    const legacy = {
      schemaVersion: 1,
      general: { language: "en" as const },
      privacy: { aiEnabled: true },
    };

    await chrome.storage.local.set({ app_settings_v1: legacy });

    const loaded = await loadSettings();

    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.onboardingCompleted).toBe(false);
    expect(loaded.general.language).toBe("en");
    expect(loaded.general.theme).toBe("system");
    expect(loaded.privacy.aiEnabled).toBe(true);
    expect(loaded.privacy.strictPrivacyMode).toBe(true);
    expect(loaded.n8n.enabled).toBe(false);
  });
});

describe("saveSettings", () => {
  it("persists settings and loads them back", async () => {
    const settings = defaultSettings();
    settings.general.theme = "dark";
    settings.privacy.aiEnabled = true;

    await saveSettings(settings);
    const loaded = await loadSettings();

    expect(loaded.general.theme).toBe("dark");
    expect(loaded.privacy.aiEnabled).toBe(true);
  });
});
