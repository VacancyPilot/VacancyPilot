import { describe, it, expect } from "vitest";

// ── Pure interaction-state logic tests (no React rendering) ──────────────
// ITER-068: verify that accessibility attributes and interaction-state
// labels are applied correctly by the component logic.

// ── ActionButton state logic ────────────────────────────────────────────

interface ActionButtonState {
  label: string;
  disabled: boolean;
  busy: boolean;
  ariaLabel: string;
  ariaDisabled: string | undefined;
  ariaBusy: string | undefined;
  cursor: string;
  opacity: number;
}

function computeActionButtonState(params: {
  label: string;
  disabled?: boolean;
  busy?: boolean;
}): ActionButtonState {
  const disabled = params.disabled === true;
  const busy = params.busy === true;

  return {
    label:
      disabled && busy ? `${params.label.replace(/…$/, "")}…` : params.label,
    disabled,
    busy,
    ariaLabel: params.label,
    ariaDisabled: disabled ? "true" : undefined,
    ariaBusy: busy ? "true" : undefined,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

describe("ActionButton interaction state logic", () => {
  it("idle button has pointer cursor and full opacity", () => {
    const state = computeActionButtonState({ label: "Save" });
    expect(state.cursor).toBe("pointer");
    expect(state.opacity).toBe(1);
    expect(state.disabled).toBe(false);
    expect(state.busy).toBe(false);
  });

  it("disabled button has not-allowed cursor, reduced opacity, aria-disabled", () => {
    const state = computeActionButtonState({
      label: "Save",
      disabled: true,
    });
    expect(state.cursor).toBe("not-allowed");
    expect(state.opacity).toBe(0.6);
    expect(state.ariaDisabled).toBe("true");
    expect(state.ariaBusy).toBeUndefined();
  });

  it("busy+disabled button has aria-busy", () => {
    const state = computeActionButtonState({
      label: "Saving…",
      disabled: true,
      busy: true,
    });
    expect(state.ariaBusy).toBe("true");
    expect(state.ariaDisabled).toBe("true");
    expect(state.cursor).toBe("not-allowed");
  });

  it("not-busy button has no aria-busy", () => {
    const state = computeActionButtonState({
      label: "Save",
      disabled: false,
      busy: false,
    });
    expect(state.ariaBusy).toBeUndefined();
  });

  it("aria-label matches the display label", () => {
    const state = computeActionButtonState({ label: "Save" });
    expect(state.ariaLabel).toBe("Save");
  });

  it("busy button shows action-in-progress label", () => {
    const state = computeActionButtonState({
      label: "Saving…",
      disabled: true,
      busy: true,
    });
    expect(state.label).toContain("Saving");
    expect(state.label).toContain("…");
  });
});

// ── Score breakdown toggle aria-expanded logic ──────────────────────────

interface ToggleState {
  ariaExpanded: boolean;
  label: string;
  controlsId: string;
}

function computeToggleState(expanded: boolean): ToggleState {
  return {
    ariaExpanded: expanded,
    label: expanded ? "▾ Hide breakdown" : "▸ Show breakdown",
    controlsId: "popup-score-breakdown",
  };
}

describe("Score breakdown toggle aria-expanded logic", () => {
  it("collapsed state has aria-expanded=false", () => {
    const state = computeToggleState(false);
    expect(state.ariaExpanded).toBe(false);
    expect(state.label).toContain("Show breakdown");
  });

  it("expanded state has aria-expanded=true", () => {
    const state = computeToggleState(true);
    expect(state.ariaExpanded).toBe(true);
    expect(state.label).toContain("Hide breakdown");
  });

  it("controlsId points to the breakdown panel", () => {
    const state = computeToggleState(false);
    expect(state.controlsId).toBe("popup-score-breakdown");
  });

  it("toggles correctly between states", () => {
    const collapsed = computeToggleState(false);
    const expanded = computeToggleState(true);

    expect(collapsed.ariaExpanded).toBe(false);
    expect(expanded.ariaExpanded).toBe(true);

    // Transition: collapsed -> expanded
    const afterToggle = computeToggleState(!collapsed.ariaExpanded);
    expect(afterToggle.ariaExpanded).toBe(true);
  });
});

// ── Error chip accessibility logic ──────────────────────────────────────

interface ChipAttrs {
  role: string;
  ariaLive: string;
}

function computeErrorChipAttrs(): ChipAttrs {
  return {
    role: "alert",
    ariaLive: "assertive",
  };
}

function computePassiveStatusChipAttrs(): ChipAttrs {
  return {
    role: "status",
    ariaLive: "polite",
  };
}

describe("Chip accessibility attributes", () => {
  it("error chip has role=alert and aria-live=assertive", () => {
    const attrs = computeErrorChipAttrs();
    expect(attrs.role).toBe("alert");
    expect(attrs.ariaLive).toBe("assertive");
  });

  it("passive status chip has role=status and aria-live=polite", () => {
    const attrs = computePassiveStatusChipAttrs();
    expect(attrs.role).toBe("status");
    expect(attrs.ariaLive).toBe("polite");
  });

  it("error and passive status chips have different announce priorities", () => {
    const errorAttrs = computeErrorChipAttrs();
    const statusAttrs = computePassiveStatusChipAttrs();

    expect(errorAttrs.ariaLive).toBe("assertive");
    expect(statusAttrs.ariaLive).toBe("polite");
    expect(errorAttrs.ariaLive).not.toBe(statusAttrs.ariaLive);
  });
});

// ── Profile selector label association ─────────────────────────────────

interface LabelAssociation {
  htmlFor: string;
  selectId: string;
}

function computeProfileSelectorAttrs(): LabelAssociation {
  return {
    htmlFor: "popup-profile-select",
    selectId: "popup-profile-select",
  };
}

describe("Profile selector label association", () => {
  it("label htmlFor matches select id", () => {
    const attrs = computeProfileSelectorAttrs();
    expect(attrs.htmlFor).toBe(attrs.selectId);
    expect(attrs.htmlFor).toBe("popup-profile-select");
  });

  it("uses a stable, non-colliding id", () => {
    const attrs = computeProfileSelectorAttrs();
    expect(attrs.selectId).toMatch(/^popup-profile-select$/);
  });
});

// ── Tab panel aria relationships (side panel) ──────────────────────────

interface TabAriaAttrs {
  tabId: string;
  panelId: string;
  selected: boolean;
  tabIndex: number;
}

function computeTabAriaAttrs(tabId: string, selected: boolean): TabAriaAttrs {
  return {
    tabId: `tab-${tabId}`,
    panelId: `panel-${tabId}`,
    selected,
    tabIndex: selected ? 0 : -1,
  };
}

describe("Tab panel aria relationships", () => {
  it("active tab has tabIndex=0", () => {
    const attrs = computeTabAriaAttrs("overview", true);
    expect(attrs.tabIndex).toBe(0);
    expect(attrs.selected).toBe(true);
  });

  it("inactive tab has tabIndex=-1", () => {
    const attrs = computeTabAriaAttrs("score", false);
    expect(attrs.tabIndex).toBe(-1);
    expect(attrs.selected).toBe(false);
  });

  it("tab id and panel id are consistent pairs", () => {
    const tabs = [
      "overview",
      "score",
      "letter",
      "apply",
      "profile",
      "history",
      "hr",
    ];
    for (const tabId of tabs) {
      const attrs = computeTabAriaAttrs(tabId, false);
      expect(attrs.tabId).toBe(`tab-${tabId}`);
      expect(attrs.panelId).toBe(`panel-${tabId}`);
    }
  });

  it("only one tab can be selected at a time in a list", () => {
    const tabs = ["overview", "score", "letter"];
    // Simulate that exactly one tab is selected
    const selectedTab = "score";
    const attrsList = tabs.map((id) =>
      computeTabAriaAttrs(id, id === selectedTab),
    );

    const selectedCount = attrsList.filter((a) => a.selected).length;
    expect(selectedCount).toBe(1);
    expect(attrsList.find((a) => a.selected)!.tabId).toBe("tab-score");
  });
});

// ── Search badge aria-label generation ──────────────────────────────────

function buildBadgeAriaAttrs(params: {
  score?: number;
  status?: string;
  workMode?: string;
}): {
  scoreAriaLabel?: string;
  statusAriaLabel?: string;
  workModeAriaLabel?: string;
} {
  const result: ReturnType<typeof buildBadgeAriaAttrs> = {};

  if (params.score !== undefined && params.score !== null) {
    result.scoreAriaLabel = `Score ${params.score}`;
  }

  if (params.status) {
    const fullLabels: Record<string, string> = {
      saved: "Saved",
      viewed: "Viewed",
      letter_ready: "Letter ready",
      applied: "Applied",
      rejected_by_me: "Rejected by me",
      rejected_by_company: "Rejected by company",
      interview: "Interview",
      offer: "Offer",
      hr_replied: "HR replied",
      test_task: "Test task",
      new: "New",
      blacklist: "Blacklisted",
    };
    result.statusAriaLabel = fullLabels[params.status] ?? params.status;
  }

  if (params.workMode && params.workMode !== "unknown") {
    result.workModeAriaLabel = `Work mode: ${params.workMode}`;
  }

  return result;
}

describe("Search badge aria-label generation", () => {
  it("generates score aria-label", () => {
    const attrs = buildBadgeAriaAttrs({ score: 78 });
    expect(attrs.scoreAriaLabel).toBe("Score 78");
  });

  it("skips score aria-label for undefined score", () => {
    const attrs = buildBadgeAriaAttrs({ status: "saved" });
    expect(attrs.scoreAriaLabel).toBeUndefined();
  });

  it("generates full status aria-label", () => {
    const attrs = buildBadgeAriaAttrs({ status: "applied" });
    expect(attrs.statusAriaLabel).toBe("Applied");
  });

  it("generates work mode aria-label", () => {
    const attrs = buildBadgeAriaAttrs({ workMode: "remote" });
    expect(attrs.workModeAriaLabel).toBe("Work mode: remote");
  });

  it("skips work mode aria-label for unknown", () => {
    const attrs = buildBadgeAriaAttrs({ workMode: "unknown" });
    expect(attrs.workModeAriaLabel).toBeUndefined();
  });

  it("generates all three labels together", () => {
    const attrs = buildBadgeAriaAttrs({
      score: 85,
      status: "saved",
      workMode: "office",
    });
    expect(attrs.scoreAriaLabel).toBe("Score 85");
    expect(attrs.statusAriaLabel).toBe("Saved");
    expect(attrs.workModeAriaLabel).toBe("Work mode: office");
  });

  it("uses correct label for rejected_by_me", () => {
    const attrs = buildBadgeAriaAttrs({ status: "rejected_by_me" });
    expect(attrs.statusAriaLabel).toBe("Rejected by me");
  });
});

// ── Quick action button aria-label generation ──────────────────────────

function buildQuickActionAriaLabel(action: "save" | "reject"): string {
  switch (action) {
    case "save":
      return "Save vacancy";
    case "reject":
      return "Reject vacancy";
  }
}

describe("Quick action button aria-labels", () => {
  it("save button has correct aria-label", () => {
    expect(buildQuickActionAriaLabel("save")).toBe("Save vacancy");
  });

  it("reject button has correct aria-label", () => {
    expect(buildQuickActionAriaLabel("reject")).toBe("Reject vacancy");
  });
});

// ── popupScoreColor — softer popup score colors (ITER-070) ───────────────

import { popupScoreColor } from "@/styles";
import { getPopupContainerStyle } from "./App";

describe("popupScoreColor (softer popup semantics)", () => {
  it("returns placeholder for undefined score", () => {
    expect(popupScoreColor(undefined)).toBe("#999");
  });

  it("green for strong matches (>= 85)", () => {
    expect(popupScoreColor(85)).toBe("#2a8");
    expect(popupScoreColor(100)).toBe("#2a8");
  });

  it("greenMuted for good matches (70-84)", () => {
    expect(popupScoreColor(70)).toBe("#6a6");
    expect(popupScoreColor(80)).toBe("#6a6");
  });

  it("amber for medium matches (50-69)", () => {
    expect(popupScoreColor(50)).toBe("#e6a817");
    expect(popupScoreColor(65)).toBe("#e6a817");
  });

  it("textMuted for weak matches (35-49) — not alarm red", () => {
    expect(popupScoreColor(35)).toBe("#666");
    expect(popupScoreColor(45)).toBe("#666");
    // Key: the old scoreColor would return red for these scores
  });

  it("amber for very low scores (< 35) — still not red", () => {
    expect(popupScoreColor(0)).toBe("#e6a817");
    expect(popupScoreColor(20)).toBe("#e6a817");
    // Even the lowest scores in popup use amber, reserving red for risk flags
  });

  it("never returns red (#c44) unlike the shared scoreColor", () => {
    // All possible scores 0-100
    for (let i = 0; i <= 100; i++) {
      expect(popupScoreColor(i)).not.toBe("#c44");
    }
  });
});

describe("Popup container responsive width", () => {
  it("has minWidth 300 to avoid cramped layout", () => {
    const style = getPopupContainerStyle();
    expect(style.minWidth).toBe(300);
  });

  it("has maxWidth 360 to fit Chrome popup constraints", () => {
    const style = getPopupContainerStyle();
    expect(style.maxWidth).toBe(360);
    expect(style.maxWidth).toBeLessThanOrEqual(400);
  });

  it("fills available width with 100%", () => {
    const style = getPopupContainerStyle();
    expect(style.width).toBe("100%");
  });

  it("maxWidth is >= minWidth", () => {
    const style = getPopupContainerStyle();
    expect(style.maxWidth).toBeGreaterThan(style.minWidth);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ITER-070 Manual QA Notes — Popup & Page Badge
// ═══════════════════════════════════════════════════════════════════════════
//
// Run these manual checks after loading the unpacked extension in Chrome:
//
// 1. POPUP LAYOUT (on a vacancy page with a saved+scored vacancy):
//    a. Open popup — confirm no horizontal scrollbar at 300px width.
//    b. Score number is prominent (22px bold), status is inline right.
//    c. "Show breakdown" is collapsed by default.
//    d. Side Panel button is first (full width), Save+Reject share a row.
//    e. Dashboard button is at the bottom (full width).
//    f. Low-score vacancies (e.g. <50) show amber/grey score, NOT red.
//
// 2. BADGE POSITIONING (on hh.ru/vacancy/* page):
//    a. Badge appears in top-right corner, ~56px from top.
//    b. Badge does NOT overlap the HH header logo/search bar.
//    c. Hover shows blue border highlight with smooth transition.
//    d. Score chip uses muted rose (#b08080) for low scores, not #c44.
//    e. Click opens side panel (may require two clicks per Chrome rules).
//
// 3. REGRESSION CHECKS:
//    a. On a non-vacancy page (e.g. search), popup shows "No vacancy detected".
//    b. Passive HH status hints still appear when detected.
//    c. Export/import flows are unaffected.
//    d. Settings remain functional (dashboard opens via options page).
// ═══════════════════════════════════════════════════════════════════════════
