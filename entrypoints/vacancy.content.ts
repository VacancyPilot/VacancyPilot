import { defineContentScript } from "wxt/sandbox";

export default defineContentScript({
  // Narrow scope: only HH.ru vacancy pages.
  // Badge displays score and status; click opens side panel.
  matches: ["https://*.hh.ru/vacancy/*"],
  main() {
    void createBadge();
  },
});

/**
 * Create a lightweight badge in Shadow DOM on HH.ru vacancy pages.
 *
 * Rules (spec 17.1):
 * - Small, does not interfere with HH layout.
 * - Does not cover HH buttons.
 * - No heavy UI.
 * - Shadow DOM isolates styles.
 * - Click opens the side panel.
 */
async function createBadge(): Promise<void> {
  // Check settings — only show badge if enabled.
  try {
    const result = await chrome.storage.local.get("app_settings_v1");
    const settings = result["app_settings_v1"] as
      | { general?: { showPageBadge?: boolean } }
      | undefined;
    if (settings?.general?.showPageBadge === false) {
      return;
    }
  } catch {
    // On read failure, show badge by default.
  }

  // Prevent duplicate injection.
  if (document.getElementById("vp-badge-host")) return;

  const host = document.createElement("div");
  host.id = "vp-badge-host";
  // Position in top-right corner, below any HH fixed headers.
  host.style.cssText =
    "position:fixed;top:8px;right:8px;z-index:9000;pointer-events:auto;";

  const shadow = host.attachShadow({ mode: "open" });

  // ── Styles (isolated, no global leakage) ──
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
    }
    .vp-badge {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 3px 7px;
      background: #fff;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      cursor: pointer;
      user-select: none;
    }
    .vp-badge:hover {
      border-color: #4a90d9;
      box-shadow: 0 1px 6px rgba(74,144,217,0.18);
    }
    .vp-score {
      background: #4a90d9;
      color: #fff;
      border-radius: 10px;
      padding: 0 6px;
      font-size: 11px;
      font-weight: 600;
      line-height: 18px;
      min-width: 20px;
      text-align: center;
    }
    .vp-score--high {
      background: #2a8;
    }
    .vp-score--mid {
      background: #e6a817;
      color: #333;
    }
    .vp-score--low {
      background: #c44;
    }
    .vp-status {
      font-size: 11px;
      color: #555;
      line-height: 18px;
    }
    .vp-label {
      font-size: 10px;
      color: #999;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  `;

  // ── Markup ──
  const container = document.createElement("div");
  container.className = "vp-badge";
  container.title = "Open VacancyPilot side panel";
  // Placeholder: "VP" label with dash.
  container.innerHTML = `
    <span class="vp-label">VP</span>
    <span class="vp-score">—</span>
    <span class="vp-status">—</span>
  `;

  // ── Click → Open side panel ──
  container.addEventListener("click", () => {
    void chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  });

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.body.appendChild(host);

  // Listen for badge updates from background/popup.
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "UPDATE_BADGE" && container) {
      updateBadgeContent(container, message.payload);
    }
  });
}

interface BadgePayload {
  score?: number;
  status?: string;
}

/**
 * Update badge DOM safely (no React, no heavy render).
 */
function updateBadgeContent(
  container: HTMLElement,
  payload: BadgePayload,
): void {
  const scoreEl = container.querySelector(".vp-score");
  const statusEl = container.querySelector(".vp-status");

  if (scoreEl) {
    const score = payload.score;
    if (score !== undefined && score !== null) {
      scoreEl.textContent = String(score);

      // Reset color classes
      scoreEl.className = "vp-score";
      if (score >= 80) {
        scoreEl.classList.add("vp-score--high");
      } else if (score >= 50) {
        scoreEl.classList.add("vp-score--mid");
      } else {
        scoreEl.classList.add("vp-score--low");
      }
    }
  }

  if (statusEl && payload.status) {
    statusEl.textContent = payload.status;
  }
}
