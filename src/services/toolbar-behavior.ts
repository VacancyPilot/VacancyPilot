import type { AppSettings } from "@/models/settings";

export type ToolbarClickBehavior = AppSettings["general"]["toolbarClickBehavior"];
export type SidePanelLayoutSide = "left" | "right";

export interface ToolbarBehaviorApplyResult {
  behavior: ToolbarClickBehavior;
  popupPath: string | null;
}

interface ToolbarBehaviorDeps {
  getManifest: () => chrome.runtime.Manifest;
  setActionPopup: (popup: string) => Promise<void>;
  setPanelBehavior: (openPanelOnActionClick: boolean) => Promise<void>;
  getSidePanelLayout?: () => Promise<{ side: SidePanelLayoutSide } | null>;
}

const defaultToolbarBehaviorDeps: ToolbarBehaviorDeps = {
  getManifest(): chrome.runtime.Manifest {
    return chrome.runtime.getManifest();
  },
  async setActionPopup(popup: string): Promise<void> {
    await chrome.action.setPopup({ popup });
  },
  async setPanelBehavior(openPanelOnActionClick: boolean): Promise<void> {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick });
  },
  getSidePanelLayout:
    typeof chrome !== "undefined" &&
    typeof chrome.sidePanel?.getLayout === "function"
      ? async () => {
          const layout = await chrome.sidePanel.getLayout();
          return layout ? { side: layout.side } : null;
        }
      : undefined,
};

export function getDefaultActionPopupPath(
  manifest: chrome.runtime.Manifest,
): string | null {
  return manifest.action?.default_popup ?? null;
}

export async function applyToolbarClickBehavior(
  behavior: ToolbarClickBehavior,
  deps: ToolbarBehaviorDeps = defaultToolbarBehaviorDeps,
): Promise<ToolbarBehaviorApplyResult> {
  const popupPath = getDefaultActionPopupPath(deps.getManifest());

  if (behavior === "sidePanel") {
    await deps.setActionPopup("");
    await deps.setPanelBehavior(true);
    return { behavior, popupPath };
  }

  if (!popupPath) {
    throw new Error(
      "VacancyPilot could not restore the action popup because the manifest does not expose default_popup.",
    );
  }

  await deps.setActionPopup(popupPath);
  await deps.setPanelBehavior(false);
  return { behavior, popupPath };
}

export async function applyToolbarBehaviorFromSettings(
  settings: AppSettings,
  deps: ToolbarBehaviorDeps = defaultToolbarBehaviorDeps,
): Promise<ToolbarBehaviorApplyResult> {
  return applyToolbarClickBehavior(settings.general.toolbarClickBehavior, deps);
}

export async function getSidePanelLayoutSide(
  deps: ToolbarBehaviorDeps = defaultToolbarBehaviorDeps,
): Promise<SidePanelLayoutSide | null> {
  if (!deps.getSidePanelLayout) {
    return null;
  }

  try {
    const layout = await deps.getSidePanelLayout();
    return layout?.side ?? null;
  } catch {
    return null;
  }
}
