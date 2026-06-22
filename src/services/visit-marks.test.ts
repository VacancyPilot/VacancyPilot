import { describe, it, expect, beforeEach, vi } from "vitest";
import type { VisitMark } from "@/models/visit-mark";

const mockVisitMarkStore = new Map<string, VisitMark>();

vi.mock("@/db/repositories", () => ({
  visitMarkRepo: {
    findBySourceId: async (sourceId: string) =>
      Array.from(mockVisitMarkStore.values()).find(
        (mark) => mark.source === "hh" && mark.sourceId === sourceId,
      ),
    save: async (mark: VisitMark) => {
      mockVisitMarkStore.set(mark.id, mark);
    },
  },
}));

import { recordVacancyVisit } from "./visit-marks";

beforeEach(() => {
  mockVisitMarkStore.clear();
});

describe("recordVacancyVisit", () => {
  it("creates a new visit mark on first view", async () => {
    const mark = await recordVacancyVisit({
      sourceId: "12345",
      sourceUrl: "https://hh.ru/vacancy/12345",
      title: "Frontend Developer",
      companyName: "Acme",
      companyId: "hh_co_acme",
    });

    expect(mark.id).toBe("hh_vacancy_12345");
    expect(mark.source).toBe("hh");
    expect(mark.sourceType).toBe("vacancy");
    expect(mark.sourceId).toBe("12345");
    expect(mark.firstSeenAt).toBe(mark.lastSeenAt);
    expect(mark.viewCount).toBe(1);
    expect(mark.title).toBe("Frontend Developer");
    expect(mockVisitMarkStore.get(mark.id)).toEqual(mark);
  });

  it("updates lastSeenAt and increments viewCount without changing firstSeenAt", async () => {
    const first = await recordVacancyVisit({
      sourceId: "12345",
      sourceUrl: "https://hh.ru/vacancy/12345",
      title: "Frontend Developer",
      companyName: "Acme",
    });

    const second = await recordVacancyVisit({
      sourceId: "12345",
      sourceUrl: "https://hh.ru/vacancy/12345?from=search",
      companyName: "Acme LLC",
    });

    expect(second.id).toBe(first.id);
    expect(second.firstSeenAt).toBe(first.firstSeenAt);
    expect(second.viewCount).toBe(2);
    expect(second.companyName).toBe("Acme LLC");
    expect(second.updatedAt).toBe(second.lastSeenAt);
  });

  it("rejects empty source ids", async () => {
    await expect(
      recordVacancyVisit({ sourceId: "   " }),
    ).rejects.toThrow("sourceId is missing");
  });
});
