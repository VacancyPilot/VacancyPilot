import { defineBackground } from "wxt/utils/define-background";
import {
  quickSaveSearchCard,
  quickRejectSearchCard,
} from "@/services/search-actions";
import { jobRepo } from "@/db/repositories";
import { createStatusChange } from "@/services/status-transitions";
import {
  checkGuidedApplyGate,
  recordLabsAction,
} from "@/services/labs-control";
import type { RawSearchItemDTO } from "@/adapters/types";
import { upsertApplicationFromJob } from "@/services/hr-timeline-sync";
import {
  ensureMigrationsBootstrapped,
  getStoredVersion,
  CURRENT_VERSION,
} from "@/db";

interface SidePanelContext {
  tabId: number;
  vacancyId: string | null;
}

async function bootBackground(): Promise<void> {
  try {
    const storedVersion = await getStoredVersion();
    console.log(
      `[VacancyPilot] schema version: stored=${storedVersion}, current=${CURRENT_VERSION}`,
    );
    await ensureMigrationsBootstrapped();
    if (storedVersion < CURRENT_VERSION) {
      console.log(
        `[VacancyPilot] migration applied: v${storedVersion} → v${CURRENT_VERSION}`,
      );
    }
  } catch (error) {
    console.error("[VacancyPilot] migration boot failed:", error);
  }
}

export default defineBackground(() => {
  console.log("[VacancyPilot] background service worker started");

  // ── Async boot (fire-and-forget, outside sync listener registration) ──
  void bootBackground();

  // ── First-install onboarding ──
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      console.log("[VacancyPilot] first install detected — opening onboarding");
      try {
        await chrome.tabs.create({
          url: chrome.runtime.getURL("options.html#onboarding"),
        });
      } catch (err) {
        console.error("[VacancyPilot] failed to open onboarding tab:", err);
      }
    }
  });

  // ── Side panel explicit context ──
  // Context is set via SET_SIDE_PANEL_CONTEXT (popup) or OPEN_SIDE_PANEL (badge).
  // Side panel reads it via GET_SIDE_PANEL_CONTEXT.
  // Popup opens the side panel directly to preserve the user-gesture path.

  let activeContext: SidePanelContext | null = null;

  /** Persist the context without opening the side panel (used by popup). */
  function persistContext(
    message: { tabId?: number; vacancyId?: string },
    sender: chrome.runtime.MessageSender,
  ): void {
    const nextTabId = message.tabId ?? sender.tab?.id ?? -1;
    const vacancyId =
      message.vacancyId ??
      extractVacancyIdFromUrl(sender.tab?.url) ??
      (activeContext?.tabId === nextTabId ? activeContext?.vacancyId : null);
    activeContext = { tabId: nextTabId, vacancyId };
  }

  /** Open the side panel in the given window. Returns true on success. */
  async function openPanelInWindow(
    windowId: number | undefined,
  ): Promise<boolean> {
    if (windowId === undefined) {
      console.error("[VacancyPilot] Could not determine target window");
      return false;
    }
    try {
      await chrome.sidePanel.open({ windowId });
      return true;
    } catch (err: unknown) {
      console.error("[VacancyPilot] Failed to open side panel:", err);
      return false;
    }
  }

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

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // ── SET_SIDE_PANEL_CONTEXT (from popup) ──
    // Popup persists context here and opens the side panel directly.
    if (message.type === "SET_SIDE_PANEL_CONTEXT") {
      persistContext(message, sender);
      sendResponse({ success: true });
      return false; // sync
    }

    // ── OPEN_SIDE_PANEL (from content badge) ──
    // Badge click path: store context AND open the side panel from background.
    if (message.type === "OPEN_SIDE_PANEL") {
      persistContext(message, sender);

      void resolveWindowId(sender).then((windowId) => {
        void openPanelInWindow(windowId).finally(() => sendResponse());
      });
      return true; // async response
    }

    // ── GET_SIDE_PANEL_CONTEXT ──
    if (message.type === "GET_SIDE_PANEL_CONTEXT") {
      sendResponse(activeContext);
      // Don't clear — the side panel may re-read on refresh.
      return false;
    }

    // ── Search quick actions (ITER-035) ──

    if (message.type === "QUICK_SAVE_SEARCH_CARD") {
      const card = message.card as RawSearchItemDTO | undefined;
      if (!card?.sourceId) {
        sendResponse({ success: false, error: "Invalid search card data" });
        return false;
      }
      void quickSaveSearchCard(card).then(
        (result) => sendResponse({ success: true, ...result }),
        (err: unknown) =>
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          }),
      );
      return true; // async response
    }

    if (message.type === "QUICK_REJECT_SEARCH_CARD") {
      const card = message.card as RawSearchItemDTO | undefined;
      if (!card?.sourceId) {
        sendResponse({ success: false, error: "Invalid search card data" });
        return false;
      }
      void quickRejectSearchCard(card).then(
        (result) => sendResponse({ success: true, ...result }),
        (err: unknown) =>
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          }),
      );
      return true; // async response
    }

    // ── Guided Apply: mark job as applied ──

    if (message.type === "MARK_APPLIED") {
      const jobId = message.jobId as string | undefined;
      if (!jobId) {
        sendResponse({ success: false, error: "Missing jobId" });
        return false;
      }
      void (async () => {
        try {
          const gate = await checkGuidedApplyGate();
          if (!gate.allowed) {
            sendResponse({ success: false, error: gate.reason });
            return;
          }
          const job = await jobRepo.getById(jobId);
          if (!job) {
            sendResponse({ success: false, error: "Job not found" });
            return;
          }
          const change = createStatusChange(
            job.status,
            "applied",
            "user",
            "Marked as applied via guided apply",
          );
          job.status = "applied";
          job.statusHistory = [...job.statusHistory, change];
          job.updatedAt = new Date().toISOString();
          await jobRepo.save(job);
          await upsertApplicationFromJob(job, "guided");
          await recordLabsAction("guided_apply_completed", {
            jobId,
            vacancyUrl: job.sourceUrl,
            countsTowardBudget: true,
          });
          sendResponse({ success: true });
        } catch (err: unknown) {
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
      return true; // async response
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
