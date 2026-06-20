import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Window } from "happy-dom";
import {
  createRenderScheduler,
  observeDynamicSearchList,
  shouldRefreshSearchBadges,
} from "./search-page-sync";

describe("createRenderScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces multiple refresh requests into one render", async () => {
    const render = vi.fn();
    const schedule = createRenderScheduler(render, 50);

    schedule();
    schedule();
    schedule();

    expect(render).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);

    expect(render).toHaveBeenCalledTimes(1);
  });
});

describe("shouldRefreshSearchBadges", () => {
  it("returns true when nodes were added", () => {
    const win = new Window();
    const host = win.document.createElement("div");
    host.appendChild(win.document.createElement("span"));
    const record = {
      type: "childList",
      addedNodes: host.childNodes,
      removedNodes: win.document.createDocumentFragment().childNodes,
    } as unknown as MutationRecord;

    expect(shouldRefreshSearchBadges([record])).toBe(true);
  });

  it("returns false for VacancyPilot badge host mutations", () => {
    const win = new Window();
    const host = win.document.createElement("span");
    host.className = "vp-sb-host";

    const child = win.document.createElement("span");
    child.textContent = "saved";
    host.appendChild(child);

    const record = {
      type: "childList",
      target: host,
      addedNodes: host.childNodes,
      removedNodes: win.document.createDocumentFragment().childNodes,
    } as unknown as MutationRecord;

    expect(shouldRefreshSearchBadges([record])).toBe(false);
  });

  it("returns false for text-node updates inside VacancyPilot badge UI", () => {
    const win = new Window();
    const host = win.document.createElement("span");
    host.className = "vp-sb-host";

    const textNode = win.document.createTextNode("updated");
    host.appendChild(textNode);

    const record = {
      type: "childList",
      target: host,
      addedNodes: host.childNodes,
      removedNodes: win.document.createDocumentFragment().childNodes,
    } as unknown as MutationRecord;

    expect(shouldRefreshSearchBadges([record])).toBe(false);
  });

  it("returns false for non-structural mutations", () => {
    const record = {
      type: "attributes",
      target: null,
      addedNodes: [] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
    } as unknown as MutationRecord;

    expect(shouldRefreshSearchBadges([record])).toBe(false);
  });
});

describe("observeDynamicSearchList", () => {
  it("triggers callback when a new node is inserted", async () => {
    const win = new Window({ url: "https://hh.ru/search/vacancy?text=test" });
    const doc = win.document as unknown as Document;
    let calls = 0;

    const observer = observeDynamicSearchList(doc, () => {
      calls += 1;
    });

    const card = doc.createElement("div");
    card.className = "serp-item";
    doc.body.appendChild(card);

    await Promise.resolve();

    observer?.disconnect();
    expect(calls).toBeGreaterThan(0);
  });
});
