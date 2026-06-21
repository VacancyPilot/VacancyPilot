import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getProviderOptionalOrigin,
  hasProviderOriginAccess,
  ensureProviderOriginAccess,
} from "./ai-provider-permissions";

describe("ai-provider-permissions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (
      globalThis as typeof globalThis & {
        chrome?: typeof chrome;
      }
    ).chrome = {} as typeof chrome;
  });

  it("returns the narrow OpenAI optional origin", () => {
    expect(getProviderOptionalOrigin("openai")).toBe("https://api.openai.com/*");
    expect(getProviderOptionalOrigin("mock")).toBeNull();
  });

  it("treats providers without optional origins as already granted", async () => {
    expect(await hasProviderOriginAccess("mock")).toBe(true);
    await expect(ensureProviderOriginAccess("mock")).resolves.toMatchObject({
      granted: true,
      requested: false,
    });
  });

  it("checks chrome.permissions.contains for OpenAI", async () => {
    globalThis.chrome!.permissions = {
      contains: vi.fn().mockResolvedValue(true),
    } as unknown as typeof chrome.permissions;

    await expect(hasProviderOriginAccess("openai")).resolves.toBe(true);
    expect(globalThis.chrome!.permissions.contains).toHaveBeenCalledWith({
      origins: ["https://api.openai.com/*"],
    });
  });

  it("requests optional origin when not granted yet", async () => {
    globalThis.chrome!.permissions = {
      contains: vi.fn().mockResolvedValue(false),
      request: vi.fn().mockResolvedValue(true),
    } as unknown as typeof chrome.permissions;

    await expect(ensureProviderOriginAccess("openai")).resolves.toMatchObject({
      granted: true,
      requested: true,
      origin: "https://api.openai.com/*",
    });
    expect(globalThis.chrome!.permissions.request).toHaveBeenCalledWith({
      origins: ["https://api.openai.com/*"],
    });
  });

  it("surfaces denial when browser rejects the optional origin", async () => {
    globalThis.chrome!.permissions = {
      contains: vi.fn().mockResolvedValue(false),
      request: vi.fn().mockResolvedValue(false),
    } as unknown as typeof chrome.permissions;

    await expect(ensureProviderOriginAccess("openai")).resolves.toMatchObject({
      granted: false,
      requested: true,
      origin: "https://api.openai.com/*",
    });
  });
});
