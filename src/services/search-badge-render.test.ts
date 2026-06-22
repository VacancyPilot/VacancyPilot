/**
 * Search badge rendering unit tests — ITER-034.
 *
 * Tests the pure rendering functions from search-badge-render.ts
 * with happy-dom for DOM manipulation verification.
 */

import { describe, it, expect } from "vitest";
import { Window } from "happy-dom";
import {
  buildSearchBadgeHTML,
  injectSearchBadgeStyles,
  createBadgeHost,
  attachBadgeToCard,
  applySearchCardState,
  buildCardElementMap,
  findSearchCardElements,
  createSaveButton,
  createRejectButton,
  appendActionButtons,
} from "./search-badge-render";
import type { SearchBadgeState } from "./search-badge-render";
import type { RawSearchItemDTO } from "@/adapters/types";

// ── Helpers ─────────────────────────────────────────────────────────

function makeCard(overrides: Partial<RawSearchItemDTO> = {}): RawSearchItemDTO {
  return {
    sourceId: "12345678",
    title: "Senior Frontend Developer",
    companyName: "Test Company",
    url: "https://hh.ru/vacancy/12345678",
    salaryRaw: null,
    city: null,
    experienceRaw: null,
    workMode: null,
    publicationDate: null,
    ...overrides,
  };
}

function makeState(
  overrides: Partial<SearchBadgeState> = {},
): SearchBadgeState {
  return { ...overrides };
}

function makeDocument(html: string): Document {
  const window = new Window({ url: "https://hh.ru/search/vacancy" });
  window.document.write(html);
  window.document.close();
  return window.document as unknown as Document;
}

// ── buildSearchBadgeHTML ────────────────────────────────────────────

describe("buildSearchBadgeHTML", () => {
  it("returns empty string when there is nothing to show", () => {
    const card = makeCard({ workMode: null });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toBe("");
  });

  it("returns empty string when workMode is unknown", () => {
    const card = makeCard({ workMode: "unknown" });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toBe("");
  });

  it("shows work mode badge for remote card", () => {
    const card = makeCard({ workMode: "remote" });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toContain("УД");
    expect(html).toContain("vp-sb-wm--remote");
  });

  it("shows work mode badge for hybrid card", () => {
    const card = makeCard({ workMode: "hybrid" });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toContain("Гиб");
    expect(html).toContain("vp-sb-wm--hybrid");
  });

  it("shows work mode badge for office card", () => {
    const card = makeCard({ workMode: "office" });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toContain("Оф");
    expect(html).toContain("vp-sb-wm--office");
  });

  it("shows score with correct class for high score", () => {
    const card = makeCard();
    const state = makeState({ score: 85 });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("85");
    expect(html).toContain("vp-sb-score--high");
  });

  it("shows score with correct class for mid score", () => {
    const card = makeCard();
    const state = makeState({ score: 65 });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("65");
    expect(html).toContain("vp-sb-score--mid");
  });

  it("shows score with correct class for low score", () => {
    const card = makeCard();
    const state = makeState({ score: 30 });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("30");
    expect(html).toContain("vp-sb-score--low");
  });

  it("shows score exactly at boundary 80 as high", () => {
    const card = makeCard();
    const state = makeState({ score: 80 });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("vp-sb-score--high");
  });

  it("shows score exactly at boundary 50 as mid", () => {
    const card = makeCard();
    const state = makeState({ score: 50 });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("vp-sb-score--mid");
  });

  it("does not show score when undefined", () => {
    const card = makeCard({ workMode: "remote" });
    const state = makeState({ status: "saved" });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).not.toContain("vp-sb-score");
  });

  it("shows status with icon for saved", () => {
    const card = makeCard();
    const state = makeState({ status: "saved" });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("сохр");
    expect(html).toContain('title="Saved"');
  });

  it("shows status with icon for applied", () => {
    const card = makeCard();
    const state = makeState({ status: "applied" });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("отклк");
  });

  it("shows status with icon for rejected_by_me", () => {
    const card = makeCard();
    const state = makeState({ status: "rejected_by_me" });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain("отклз");
  });

  it("shows combined score + status + work mode", () => {
    const card = makeCard({ workMode: "remote" });
    const state = makeState({ score: 75, status: "saved" });
    const html = buildSearchBadgeHTML(card, state);

    expect(html).toContain("75");
    expect(html).toContain("vp-sb-score--mid");
    expect(html).toContain("сохр");
    expect(html).toContain("УД");
  });

  it("renders status + work mode without score", () => {
    const card = makeCard({ workMode: "office" });
    const state = makeState({ status: "applied" });
    const html = buildSearchBadgeHTML(card, state);

    expect(html).not.toContain("vp-sb-score");
    expect(html).toContain("отклк");
    expect(html).toContain("Оф");
  });

  it("produces valid HTML structure with container", () => {
    const card = makeCard({ workMode: "remote" });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toMatch(/^<span class="vp-sb-container">/);
    expect(html).toMatch(/<\/span>$/);
  });

  // ── Accessibility attributes (ITER-068) ──────────────────────────────

  it("includes aria-label on score span", () => {
    const card = makeCard();
    const state = makeState({ score: 78 });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain('aria-label="Score 78"');
    expect(html).toContain('role="status"');
  });

  it("includes full status label in aria-label and title", () => {
    const card = makeCard();
    const state = makeState({ status: "applied" });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain('aria-label="Applied"');
    expect(html).toContain('title="Applied"');
  });

  it("includes work mode in aria-label", () => {
    const card = makeCard({ workMode: "remote" });
    const html = buildSearchBadgeHTML(card, undefined);
    expect(html).toContain('aria-label="Work mode: remote"');
  });

  it("uses correct full label for rejected_by_me", () => {
    const card = makeCard();
    const state = makeState({ status: "rejected_by_me" });
    const html = buildSearchBadgeHTML(card, state);
    expect(html).toContain('aria-label="Rejected by me"');
    expect(html).toContain('title="Rejected by me"');
  });
});

// ── injectSearchBadgeStyles ─────────────────────────────────────────

describe("injectSearchBadgeStyles", () => {
  it("injects a style element into the document head", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;

    injectSearchBadgeStyles(doc);

    const styleEl = doc.getElementById("vp-search-badge-styles");
    expect(styleEl).toBeTruthy();
    expect(styleEl?.tagName.toLowerCase()).toBe("style");
  });

  it("is idempotent — does not inject duplicate styles", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;

    injectSearchBadgeStyles(doc);
    injectSearchBadgeStyles(doc);

    const styles = doc.querySelectorAll("#vp-search-badge-styles");
    expect(styles.length).toBe(1);
  });

  it("includes expected CSS classes in style content", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;

    injectSearchBadgeStyles(doc);

    const styleEl = doc.getElementById("vp-search-badge-styles");
    const text = styleEl?.textContent ?? "";

    expect(text).toContain(".vp-sb-host");
    expect(text).toContain(".vp-sb-score");
    expect(text).toContain(".vp-sb-score--high");
    expect(text).toContain(".vp-sb-score--mid");
    expect(text).toContain(".vp-sb-score--low");
    expect(text).toContain(".vp-sb-status");
    expect(text).toContain(".vp-sb-wm");
    expect(text).toContain(".vp-sb-wm--remote");
    expect(text).toContain(".vp-sb-wm--hybrid");
    expect(text).toContain(".vp-sb-wm--office");
    expect(text).toContain(".vp-sb-card--dimmed");
    expect(text).toContain(".vp-sb-card--hidden");
  });
});

// ── createBadgeHost ─────────────────────────────────────────────────

describe("createBadgeHost", () => {
  it("returns null when there is nothing to show", () => {
    const card = makeCard({ workMode: null });
    const d = new Window({ url: "https://hh.ru/search/vacancy" })
      .document as unknown as Document;
    const host = createBadgeHost(card, undefined, undefined, d);
    expect(host).toBeNull();
  });

  it("returns a span element with vp-sb-host class", () => {
    const card = makeCard({ workMode: "remote" });
    const d = new Window({ url: "https://hh.ru/search/vacancy" })
      .document as unknown as Document;
    const host = createBadgeHost(card, undefined, undefined, d);
    expect(host).toBeTruthy();
    expect(host!.tagName.toLowerCase()).toBe("span");
    expect(host!.className).toBe("vp-sb-host");
  });

  it("host contains badge HTML children", () => {
    const card = makeCard({ workMode: "remote" });
    const state = makeState({ score: 90 });
    const d = new Window({ url: "https://hh.ru/search/vacancy" })
      .document as unknown as Document;
    const host = createBadgeHost(card, state, undefined, d);
    expect(host!.innerHTML).toContain("90");
    expect(host!.innerHTML).toContain("УД");
  });

  it("renders view count when available", () => {
    const card = makeCard({ workMode: "remote" });
    const state = makeState({ viewCount: 3 });
    const html = buildSearchBadgeHTML(card, state, {
      showViewCount: true,
    });

    expect(html).toContain("3×");
    expect(html).toContain("vp-sb-view-count");
  });
});

// ── attachBadgeToCard ───────────────────────────────────────────────

describe("attachBadgeToCard", () => {
  it("attaches badge to card header when available", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3 class="serp-item__header">
      <a data-qa="serp-item__title" href="/vacancy/111">Job</a>
    </h3>
  </div>
</body></html>`);

    const cardEl = doc.querySelector('[data-qa="vacancy-serp-item"]')!;
    const badge = doc.createElement("span");
    badge.className = "vp-sb-host";
    badge.textContent = "TEST";

    attachBadgeToCard(cardEl, badge);

    const header = cardEl.querySelector(".serp-item__header");
    expect(header?.querySelector(".vp-sb-host")).toBeTruthy();
  });

  it("replaces existing host instead of duplicating", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3 class="serp-item__header">
      <a data-qa="serp-item__title" href="/vacancy/222">Job</a>
    </h3>
  </div>
</body></html>`);

    const cardEl = doc.querySelector('[data-qa="vacancy-serp-item"]')!;

    const badge1 = doc.createElement("span");
    badge1.className = "vp-sb-host";
    badge1.textContent = "FIRST";
    attachBadgeToCard(cardEl, badge1);

    const badge2 = doc.createElement("span");
    badge2.className = "vp-sb-host";
    badge2.textContent = "SECOND";
    attachBadgeToCard(cardEl, badge2);

    const hosts = cardEl.querySelectorAll(".vp-sb-host");
    expect(hosts.length).toBe(1);
    expect(hosts[0]!.textContent).toBe("SECOND");
  });

  it("works with card that has no dedicated header class", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3>
      <a data-qa="serp-item__title" href="/vacancy/333">Job</a>
    </h3>
  </div>
</body></html>`);

    const cardEl = doc.querySelector('[data-qa="vacancy-serp-item"]')!;
    const badge = doc.createElement("span");
    badge.className = "vp-sb-host";
    badge.textContent = "TEST";

    attachBadgeToCard(cardEl, badge);

    const h3 = cardEl.querySelector("h3");
    expect(h3?.querySelector(".vp-sb-host")).toBeTruthy();
  });

  it("does nothing when cardEl is falsy", () => {
    // Should not throw when attaching to null
    const doc = makeDocument(`<!DOCTYPE html><html><body></body></html>`);
    const badge = doc.createElement("span");
    badge.className = "vp-sb-host";

    expect(() =>
      attachBadgeToCard(null as unknown as Element, badge),
    ).not.toThrow();
  });
});

// ── applySearchCardState ───────────────────────────────────────────────

describe("applySearchCardState", () => {
  it("dims rejected cards when requested", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">Card</div>
</body></html>`);

    const cardEl = doc.querySelector('[data-qa="vacancy-serp-item"]')!;
    applySearchCardState(cardEl, { dimmed: true });

    expect(cardEl.classList.contains("vp-sb-card--dimmed")).toBe(true);
    expect(cardEl.classList.contains("vp-sb-card--hidden")).toBe(false);
  });

  it("hides rejected cards when requested", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">Card</div>
</body></html>`);

    const cardEl = doc.querySelector('[data-qa="vacancy-serp-item"]')!;
    applySearchCardState(cardEl, { hidden: true });

    expect(cardEl.classList.contains("vp-sb-card--hidden")).toBe(true);
    expect(cardEl.classList.contains("vp-sb-card--dimmed")).toBe(false);
  });
});

// ── buildCardElementMap ─────────────────────────────────────────────

describe("buildCardElementMap", () => {
  it("maps vacancy IDs to card elements from title link hrefs", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3 class="serp-item__header">
      <a data-qa="serp-item__title" class="serp-item__title" href="/vacancy/12345678">Job 1</a>
    </h3>
  </div>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3 class="serp-item__header">
      <a data-qa="serp-item__title" class="serp-item__title" href="/vacancy/87654321?query=test">Job 2</a>
    </h3>
  </div>
</body></html>`);

    const elements = Array.from(
      doc.querySelectorAll('[data-qa="vacancy-serp-item"]'),
    );
    const map = buildCardElementMap(elements);

    expect(map.size).toBe(2);
    expect(map.has("12345678")).toBe(true);
    expect(map.has("87654321")).toBe(true);
  });

  it("skips cards without extractable vacancy IDs", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3>
      <span>No link here</span>
    </h3>
  </div>
  <div data-qa="vacancy-serp-item" class="serp-item">
    <h3>
      <a data-qa="serp-item__title" href="/vacancy/999">Valid</a>
    </h3>
  </div>
</body></html>`);

    const elements = Array.from(
      doc.querySelectorAll('[data-qa="vacancy-serp-item"]'),
    );
    const map = buildCardElementMap(elements);

    expect(map.size).toBe(1);
    expect(map.has("999")).toBe(true);
  });

  it("returns empty map for empty input", () => {
    const map = buildCardElementMap([]);
    expect(map.size).toBe(0);
  });
});

// ── findSearchCardElements ──────────────────────────────────────────

describe("findSearchCardElements", () => {
  it("finds cards by data-qa attribute", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item" class="serp-item">Card 1</div>
  <div data-qa="vacancy-serp-item" class="serp-item">Card 2</div>
</body></html>`);

    const elements = findSearchCardElements(doc);
    expect(elements).toHaveLength(2);
  });

  it("falls back to class selector", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div class="serp-item">Card 1</div>
  <div class="serp-item">Card 2</div>
</body></html>`);

    const elements = findSearchCardElements(doc);
    expect(elements).toHaveLength(2);
  });

  it("returns empty array when no cards found", () => {
    const doc = makeDocument(
      "<!DOCTYPE html><html><body><p>No cards</p></body></html>",
    );
    const elements = findSearchCardElements(doc);
    expect(elements).toEqual([]);
  });
});

// ── Quick action buttons (ITER-035) ───────────────────────────────────

describe("createSaveButton", () => {
  it("creates a button element with correct class and text", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;
    const btn = createSaveButton(doc);

    expect(btn.tagName.toLowerCase()).toBe("button");
    expect(btn.className).toContain("vp-sb-action");
    expect(btn.className).toContain("vp-sb-action--save");
    expect(btn.textContent).toBe("\u2295");
    expect(btn.title).toBe("Save vacancy");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.getAttribute("aria-label")).toBe("Save vacancy");
  });
});

describe("createRejectButton", () => {
  it("creates a button element with correct class and text", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;
    const btn = createRejectButton(doc);

    expect(btn.tagName.toLowerCase()).toBe("button");
    expect(btn.className).toContain("vp-sb-action");
    expect(btn.className).toContain("vp-sb-action--reject");
    expect(btn.textContent).toBe("\u2297");
    expect(btn.title).toBe("Reject vacancy");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.getAttribute("aria-label")).toBe("Reject vacancy");
  });
});

describe("appendActionButtons", () => {
  it("appends save and reject buttons to a badge host", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;

    const host = doc.createElement("span");
    host.className = "vp-sb-host";

    const { wrapper, saveBtn, rejectBtn } = appendActionButtons(host, doc);

    expect(wrapper.className).toBe("vp-sb-actions");
    expect(host.contains(wrapper)).toBe(true);
    expect(wrapper.contains(saveBtn)).toBe(true);
    expect(wrapper.contains(rejectBtn)).toBe(true);
  });

  it("returns references to created buttons", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;

    const host = doc.createElement("span");
    host.className = "vp-sb-host";

    const { saveBtn, rejectBtn } = appendActionButtons(host, doc);

    expect(saveBtn.textContent).toBe("\u2295");
    expect(rejectBtn.textContent).toBe("\u2297");
  });

  it("buttons are children of the wrapper", () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy" });
    const doc = win.document as unknown as Document;

    const host = doc.createElement("span");
    host.className = "vp-sb-host";

    const { wrapper } = appendActionButtons(host, doc);
    const buttons = wrapper.querySelectorAll(".vp-sb-action");
    expect(buttons.length).toBe(2);
  });
});
