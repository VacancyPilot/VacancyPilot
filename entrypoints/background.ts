import { defineBackground } from "wxt/sandbox";

export default defineBackground(() => {
  console.log("[VacancyPilot] background service worker started");

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
    // Return false — no async response.
    return false;
  });
});
