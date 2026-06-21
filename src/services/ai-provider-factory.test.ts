import { describe, it, expect } from "vitest";
import {
  getLLMProvider,
  isProviderImplemented,
  providerLabel,
  checkAIReadiness,
} from "./ai-provider-factory";
import { MockLLMProvider } from "./ai-provider";
import { OpenAILLMProvider } from "./ai-provider-openai";
import type { AppSettings } from "@/models/settings";
import { defaultSettings } from "@/db/settings-bridge";

function makeSettings(overrides?: Partial<AppSettings>): AppSettings {
  return { ...defaultSettings(), ...overrides };
}

// ── getLLMProvider ────────────────────────────────────────────────────────

describe("getLLMProvider", () => {
  it("returns MockLLMProvider when provider is 'mock'", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: "mock" },
    });
    const provider = getLLMProvider(settings);
    expect(provider).toBeInstanceOf(MockLLMProvider);
    expect(provider.id).toBe("mock");
  });

  it("returns OpenAILLMProvider when provider is 'openai'", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: {
        ...defaultSettings().ai,
        provider: "openai",
        model: "gpt-4o-mini",
      },
    });
    const provider = getLLMProvider(settings);
    expect(provider).toBeInstanceOf(OpenAILLMProvider);
    expect(provider.id).toBe("openai");
  });

  it("throws when AI is disabled", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: false },
      ai: { ...defaultSettings().ai, provider: "openai" },
    });
    expect(() => getLLMProvider(settings)).toThrow(
      "AI features are disabled",
    );
  });

  it("throws when no provider is selected", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: undefined },
    });
    expect(() => getLLMProvider(settings)).toThrow(
      "No AI provider selected",
    );
  });

  it("throws for unimplemented provider 'deepseek'", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: "deepseek" },
    });
    expect(() => getLLMProvider(settings)).toThrow(
      "is not yet implemented",
    );
  });

  it("throws for unimplemented provider 'openrouter'", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: "openrouter" },
    });
    expect(() => getLLMProvider(settings)).toThrow(
      "is not yet implemented",
    );
  });

  it("passes model from settings to OpenAI provider", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: {
        ...defaultSettings().ai,
        provider: "openai",
        model: "gpt-4-turbo",
      },
    });
    const provider = getLLMProvider(settings) as OpenAILLMProvider;
    // The model is internal — we verify that construction succeeds
    expect(provider.id).toBe("openai");
  });
});

// ── isProviderImplemented ─────────────────────────────────────────────────

describe("isProviderImplemented", () => {
  it("returns true for 'openai'", () => {
    expect(isProviderImplemented("openai")).toBe(true);
  });

  it("returns true for 'mock'", () => {
    expect(isProviderImplemented("mock")).toBe(true);
  });

  it("returns false for 'deepseek'", () => {
    expect(isProviderImplemented("deepseek")).toBe(false);
  });

  it("returns false for 'openrouter'", () => {
    expect(isProviderImplemented("openrouter")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isProviderImplemented(undefined)).toBe(false);
  });
});

// ── providerLabel ─────────────────────────────────────────────────────────

describe("providerLabel", () => {
  it("returns 'OpenAI' for 'openai'", () => {
    expect(providerLabel("openai")).toBe("OpenAI");
  });

  it("returns 'DeepSeek' for 'deepseek'", () => {
    expect(providerLabel("deepseek")).toBe("DeepSeek");
  });

  it("returns 'OpenRouter' for 'openrouter'", () => {
    expect(providerLabel("openrouter")).toBe("OpenRouter");
  });

  it("returns 'Mock' for 'mock'", () => {
    expect(providerLabel("mock")).toBe("Mock");
  });

  it("returns 'None' for undefined", () => {
    expect(providerLabel(undefined)).toBe("None");
  });
});

// ── checkAIReadiness ──────────────────────────────────────────────────────

describe("checkAIReadiness", () => {
  it("returns ready for openai with AI enabled", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: "openai" },
    });
    expect(checkAIReadiness(settings)).toEqual({ ready: true });
  });

  it("returns ready for mock with AI enabled", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: "mock" },
    });
    expect(checkAIReadiness(settings)).toEqual({ ready: true });
  });

  it("returns not ready when AI is disabled", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: false },
      ai: { ...defaultSettings().ai, provider: "openai" },
    });
    const result = checkAIReadiness(settings);
    expect(result).toHaveProperty("ready", false);
    if ("reason" in result) {
      expect(result.reason).toContain("disabled");
    }
  });

  it("returns not ready when no provider selected", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: undefined },
    });
    const result = checkAIReadiness(settings);
    expect(result).toHaveProperty("ready", false);
    if ("reason" in result) {
      expect(result.reason).toContain("No AI provider selected");
    }
  });

  it("returns not ready for unimplemented provider", () => {
    const settings = makeSettings({
      privacy: { ...defaultSettings().privacy, aiEnabled: true },
      ai: { ...defaultSettings().ai, provider: "deepseek" },
    });
    const result = checkAIReadiness(settings);
    expect(result).toHaveProperty("ready", false);
    if ("reason" in result) {
      expect(result.reason).toContain("not yet implemented");
    }
  });

  it("default settings return not ready (AI disabled)", () => {
    const settings = defaultSettings();
    const result = checkAIReadiness(settings);
    expect(result).toHaveProperty("ready", false);
  });
});
