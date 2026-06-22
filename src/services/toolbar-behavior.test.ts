import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/db/settings-bridge";
import {
  applyToolbarBehaviorFromSettings,
  applyToolbarClickBehavior,
  getDefaultActionPopupPath,
  getSidePanelLayoutSide,
} from "./toolbar-behavior";

describe("toolbar behavior settings", () => {
  it('defaults toolbarClickBehavior to "popup"', () => {
    expect(defaultSettings().general.toolbarClickBehavior).toBe("popup");
  });

  it("defaults closePopupAfterOpeningSidePanel to true", () => {
    expect(defaultSettings().general.closePopupAfterOpeningSidePanel).toBe(
      true,
    );
  });
});

describe("getDefaultActionPopupPath", () => {
  it("returns popup path from manifest action block", () => {
    expect(
      getDefaultActionPopupPath({
        manifest_version: 3,
        name: "VacancyPilot",
        version: "0.1.0",
        action: { default_popup: "popup.html" },
      }),
    ).toBe("popup.html");
  });

  it("returns null when manifest has no default_popup", () => {
    expect(
      getDefaultActionPopupPath({
        manifest_version: 3,
        name: "VacancyPilot",
        version: "0.1.0",
      }),
    ).toBeNull();
  });
});

describe("applyToolbarClickBehavior", () => {
  it("applies popup mode", async () => {
    const setActionPopup = vi.fn().mockResolvedValue(undefined);
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);

    const result = await applyToolbarClickBehavior("popup", {
      getManifest: () =>
        ({
          manifest_version: 3,
          name: "VacancyPilot",
          version: "0.1.0",
          action: { default_popup: "popup.html" },
        }) as chrome.runtime.Manifest,
      setActionPopup,
      setPanelBehavior,
    });

    expect(setActionPopup).toHaveBeenCalledWith("popup.html");
    expect(setPanelBehavior).toHaveBeenCalledWith(false);
    expect(result).toEqual({ behavior: "popup", popupPath: "popup.html" });
  });

  it("applies sidePanel mode", async () => {
    const setActionPopup = vi.fn().mockResolvedValue(undefined);
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);

    const result = await applyToolbarClickBehavior("sidePanel", {
      getManifest: () =>
        ({
          manifest_version: 3,
          name: "VacancyPilot",
          version: "0.1.0",
          action: { default_popup: "popup.html" },
        }) as chrome.runtime.Manifest,
      setActionPopup,
      setPanelBehavior,
    });

    expect(setActionPopup).toHaveBeenCalledWith("");
    expect(setPanelBehavior).toHaveBeenCalledWith(true);
    expect(result).toEqual({
      behavior: "sidePanel",
      popupPath: "popup.html",
    });
  });

  it("applies behavior from settings", async () => {
    const settings = defaultSettings();
    settings.general.toolbarClickBehavior = "sidePanel";

    const setActionPopup = vi.fn().mockResolvedValue(undefined);
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);

    await applyToolbarBehaviorFromSettings(settings, {
      getManifest: () =>
        ({
          manifest_version: 3,
          name: "VacancyPilot",
          version: "0.1.0",
          action: { default_popup: "popup.html" },
        }) as chrome.runtime.Manifest,
      setActionPopup,
      setPanelBehavior,
    });

    expect(setActionPopup).toHaveBeenCalledWith("");
    expect(setPanelBehavior).toHaveBeenCalledWith(true);
  });

  it("throws when popup mode cannot restore a manifest popup", async () => {
    await expect(
      applyToolbarClickBehavior("popup", {
        getManifest: () =>
          ({
            manifest_version: 3,
            name: "VacancyPilot",
            version: "0.1.0",
          }) as chrome.runtime.Manifest,
        setActionPopup: vi.fn(),
        setPanelBehavior: vi.fn(),
      }),
    ).rejects.toThrow(/default_popup/);
  });
});

describe("getSidePanelLayoutSide", () => {
  it("returns the reported side when getLayout is supported", async () => {
    await expect(
      getSidePanelLayoutSide({
        getManifest: () =>
          ({
            manifest_version: 3,
            name: "VacancyPilot",
            version: "0.1.0",
          }) as chrome.runtime.Manifest,
        setActionPopup: vi.fn(),
        setPanelBehavior: vi.fn(),
        getSidePanelLayout: vi.fn().mockResolvedValue({ side: "right" }),
      }),
    ).resolves.toBe("right");
  });

  it("returns null when getLayout is unavailable", async () => {
    await expect(
      getSidePanelLayoutSide({
        getManifest: () =>
          ({
            manifest_version: 3,
            name: "VacancyPilot",
            version: "0.1.0",
          }) as chrome.runtime.Manifest,
        setActionPopup: vi.fn(),
        setPanelBehavior: vi.fn(),
      }),
    ).resolves.toBeNull();
  });
});
