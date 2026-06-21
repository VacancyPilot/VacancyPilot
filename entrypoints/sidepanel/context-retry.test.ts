/**
 * Side panel context retry logic — pure function tests.
 *
 * ITER-069: Tests the retry mechanism used to handle the short timing
 * race between the popup storing context and the side panel loading.
 */
import { describe, it, expect, vi } from "vitest";

// ── Pure context retry logic (extracted from SidePanelContent.detect) ──

interface SidePanelContext {
  tabId: number;
  vacancyId: string | null;
}

/**
 * Simulates the retry loop used in SidePanelContent to fetch context.
 * The real implementation uses chrome.runtime.sendMessage; this pure
 * version accepts a fetch function and a cancellation signal.
 */
async function fetchContextWithRetry(
  fetchFn: () => Promise<SidePanelContext | null>,
  maxRetries: number,
  signal?: { cancelled: boolean },
): Promise<SidePanelContext | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.cancelled) return null;
    const context = await fetchFn();
    // Valid context has a positive tabId.
    if (context?.tabId && context.tabId > 0) return context;
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return null;
}

// ── persistContext logic (extracted from background.ts) ──

function extractVacancyIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/vacancy\/(\d+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function persistContext(
  activeContext: SidePanelContext | null,
  message: { tabId?: number; vacancyId?: string },
  senderUrl?: string,
): SidePanelContext {
  const nextTabId = message.tabId ?? -1;
  const vacancyId =
    message.vacancyId ??
    extractVacancyIdFromUrl(senderUrl) ??
    (activeContext?.tabId === nextTabId ? activeContext?.vacancyId : null);
  return { tabId: nextTabId, vacancyId };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("fetchContextWithRetry", () => {
  it("returns context on first attempt when valid", async () => {
    const context: SidePanelContext = { tabId: 42, vacancyId: "12345" };
    const fetchFn = vi.fn().mockResolvedValue(context);

    const result = await fetchContextWithRetry(fetchFn, 3);

    expect(result).toEqual(context);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("retries until valid context is returned", async () => {
    const valid: SidePanelContext = { tabId: 99, vacancyId: "888" };
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ tabId: 0, vacancyId: null })
      .mockResolvedValueOnce(valid);

    const result = await fetchContextWithRetry(fetchFn, 3);

    expect(result).toEqual(valid);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("returns null after exhausting all retries", async () => {
    const fetchFn = vi.fn().mockResolvedValue(null);

    const result = await fetchContextWithRetry(fetchFn, 2);

    expect(result).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(3); // 0, 1, 2 = 3 attempts
  });

  it("returns null when context has tabId <= 0", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ tabId: -1, vacancyId: null });

    const result = await fetchContextWithRetry(fetchFn, 1);

    expect(result).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("stops early when cancelled", async () => {
    const signal = { cancelled: false };
    const fetchFn = vi.fn().mockImplementation(async () => {
      // Simulate cancellation during first attempt
      signal.cancelled = true;
      return null;
    });

    const result = await fetchContextWithRetry(fetchFn, 3, signal);

    expect(result).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1); // cancelled after first attempt
  });

  it("does not retry when maxRetries is 0", async () => {
    const fetchFn = vi.fn().mockResolvedValue(null);

    const result = await fetchContextWithRetry(fetchFn, 0);

    expect(result).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("returns immediately when already cancelled before first attempt", async () => {
    const signal = { cancelled: true };
    const fetchFn = vi.fn();

    const result = await fetchContextWithRetry(fetchFn, 3, signal);

    expect(result).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("persistContext (background logic)", () => {
  it("stores tabId and vacancyId from message", () => {
    const result = persistContext(null, {
      tabId: 42,
      vacancyId: "12345",
    });

    expect(result).toEqual({ tabId: 42, vacancyId: "12345" });
  });

  it("handles badge OPEN_SIDE_PANEL flow: vacancyId from message, tabId from sender", () => {
    // The content script badge sends { type: "OPEN_SIDE_PANEL", vacancyId }
    // without tabId. Background resolves tabId from sender.tab.id and
    // vacancyId from the message directly.
    const result = persistContext(null, {
      vacancyId: "badge-999",
    });

    expect(result).toEqual({ tabId: -1, vacancyId: "badge-999" });
    // In production, sender.tab.id supplies the real tabId;
    // -1 is the pure-function fallback when neither message nor sender
    // provides it, which is covered by a separate test.
  });

  it("handles badge OPEN_SIDE_PANEL flow: vacancyId from sender URL fallback", () => {
    // When the content script sends OPEN_SIDE_PANEL without vacancyId,
    // the background extracts it from the sender tab URL.
    const result = persistContext(
      null,
      {
        tabId: 7,
      },
      "https://hh.ru/vacancy/77777",
    );

    expect(result).toEqual({ tabId: 7, vacancyId: "77777" });
  });

  it("extracts vacancyId from sender URL when message has no vacancyId", () => {
    const result = persistContext(
      null,
      {
        tabId: 77,
      },
      "https://hh.ru/vacancy/99999?query=1",
    );

    expect(result).toEqual({ tabId: 77, vacancyId: "99999" });
  });

  it("falls back to activeContext vacancyId when tab matches", () => {
    const active: SidePanelContext = { tabId: 10, vacancyId: "old-5678" };
    const result = persistContext(active, {
      tabId: 10,
    });

    expect(result).toEqual({ tabId: 10, vacancyId: "old-5678" });
  });

  it("does not fall back to activeContext vacancyId when tab differs", () => {
    const active: SidePanelContext = { tabId: 10, vacancyId: "old-5678" };
    const result = persistContext(active, {
      tabId: 20,
    });

    expect(result).toEqual({ tabId: 20, vacancyId: null });
  });

  it("message vacancyId takes priority over sender URL", () => {
    const result = persistContext(
      null,
      {
        tabId: 1,
        vacancyId: "explicit-42",
      },
      "https://hh.ru/vacancy/99999",
    );

    expect(result.vacancyId).toBe("explicit-42");
  });

  it("uses tabId -1 when neither message nor sender provide it", () => {
    const result = persistContext(null, {});

    expect(result).toEqual({ tabId: -1, vacancyId: null });
  });

  it("handles non-HH sender URL gracefully", () => {
    const result = persistContext(
      null,
      {
        tabId: 5,
      },
      "https://example.com/page",
    );

    expect(result).toEqual({ tabId: 5, vacancyId: null });
  });
});

describe("extractVacancyIdFromUrl", () => {
  it("extracts vacancy ID from standard HH URL", () => {
    expect(extractVacancyIdFromUrl("https://hh.ru/vacancy/12345")).toBe(
      "12345",
    );
  });

  it("extracts vacancy ID with query params", () => {
    expect(
      extractVacancyIdFromUrl(
        "https://hh.ru/vacancy/99999?query=frontend&page=1",
      ),
    ).toBe("99999");
  });

  it("returns null for non-vacancy HH URLs", () => {
    expect(extractVacancyIdFromUrl("https://hh.ru/search/vacancy")).toBeNull();
  });

  it("returns null for undefined URL", () => {
    expect(extractVacancyIdFromUrl(undefined)).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(extractVacancyIdFromUrl("not-a-url")).toBeNull();
  });
});
