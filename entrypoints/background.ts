import { defineBackground } from "wxt/sandbox";

interface SidePanelContext {
  tabId: number;
  vacancyId: string | null;
}

export default defineBackground(() => {
  console.log("[VacancyPilot] background service worker started");

  // ── Side panel explicit context ──
  // Instead of the side panel guessing the active tab, the background
  // stores the vacancy context when OPEN_SIDE_PANEL is received and
  // the side panel reads it explicitly via GET_SIDE_PANEL_CONTEXT.

  let activeContext: SidePanelContext | null = null;

  async function resolveWindowId(
    sender: chrome.runtime.MessageSender,
  ): Promise<number | undefined> {
    if (sender.tab?.windowId !== undefined) {
      return sender.tab.windowId;
    }

    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      return activeTab?.windowId;
    } catch (error) {
      console.error("[VacancyPilot] Failed to resolve active window:", error);
      return undefined;
    }
  }

  // Handle OPEN_SIDE_PANEL message from popup, content badge, or side panel.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "OPEN_SIDE_PANEL") {
      // Store explicit context so the side panel can pick it up.
      // If the sender is a tab (content script), use sender.tab.
      // Popup messages come without a tab; they include vacancyId in the message.
      const vacancyId =
        message.vacancyId ?? extractVacancyIdFromUrl(sender.tab?.url);
      activeContext = {
        tabId: message.tabId ?? sender.tab?.id ?? -1,
        vacancyId,
      };

      void resolveWindowId(sender).then((windowId) => {
        if (windowId === undefined) {
          console.error("[VacancyPilot] Could not determine target window");
          sendResponse();
          return;
        }

        chrome.sidePanel.open({ windowId }).catch((err: unknown) => {
          console.error("[VacancyPilot] Failed to open side panel:", err);
        });
        sendResponse();
      });
      return true;
    }

    if (message.type === "GET_SIDE_PANEL_CONTEXT") {
      sendResponse(activeContext);
      // Don't clear — the side panel may re-read on refresh.
      return false;
    }

    // Return false — no async response.
    return false;
  });
});

/** Extract vacancy ID from an hh.ru vacancy URL. */
function extractVacancyIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/vacancy\/(\d+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
