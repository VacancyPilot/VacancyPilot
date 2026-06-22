import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "@/models/job";
import type { AppSettings } from "@/models/settings";
import type { VisitMark } from "@/models/visit-mark";

const mockJobs: Job[] = [];
const mockVisitMarks: VisitMark[] = [];

const mockSettings: AppSettings = {
  schemaVersion: 1,
  onboardingCompleted: false,
  general: {
    defaultProfileId: undefined,
    language: "ru" as const,
    theme: "system" as const,
    showPageBadge: true,
    trackVisitMarks: true,
    rejectedSearchCardBehavior: "dim",
    autosaveViewedJobs: true,
    toolbarClickBehavior: "popup" as const,
    closePopupAfterOpeningSidePanel: true,
  },
  privacy: {
    aiEnabled: false,
    n8nEnabled: false,
    strictPrivacyMode: true,
    showPayloadPreviewAlways: true,
    allowResumeHighlightsToAI: false,
    allowFullDescriptionToAI: false,
    redactContacts: true,
    debugHtmlMode: false,
  },
  ai: {
    provider: undefined,
    dailyRequestLimit: 10,
    maxInputChars: 3000,
    enableStreaming: false,
    enableCache: true,
  },
  n8n: {
    enabled: false,
    hmacSecretSet: false,
    enabledEvents: [],
    dailyEventLimit: 10,
  },
  labs: {
    enabled: false,
    guidedApplyEnabled: false,
    killSwitchEnabled: false,
    dailyActionLimit: 5,
  },
};

vi.mock("@/db/repositories", () => ({
  jobRepo: {
    list: async () => mockJobs,
  },
  visitMarkRepo: {
    list: async () => mockVisitMarks,
  },
}));

vi.mock("@/db/settings-bridge", () => ({
  loadSettings: async () => mockSettings,
}));

import { getSearchHighlightStates } from "./search-highlights";

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "hh_123",
    source: "hh",
    sourceVacancyId: "123",
    sourceUrl: "https://hh.ru/vacancy/123",
    title: "Frontend Developer",
    companyId: "hh_co_1",
    companyName: "Acme",
    descriptionClean: "Clean description",
    descriptionHash: "hash",
    skills: [],
    status: "saved",
    statusHistory: [],
    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now,
    workMode: "remote",
    ...overrides,
  };
}

function makeVisitMark(overrides: Partial<VisitMark> = {}): VisitMark {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "hh_vacancy_123",
    source: "hh",
    sourceType: "vacancy",
    sourceId: "123",
    firstSeenAt: now,
    lastSeenAt: now,
    viewCount: 1,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  mockJobs.length = 0;
  mockVisitMarks.length = 0;
  mockSettings.general.rejectedSearchCardBehavior = "dim";
});

describe("getSearchHighlightStates", () => {
  it("dedupes ids and returns viewed state for visit marks", async () => {
    mockVisitMarks.push(makeVisitMark());

    const states = await getSearchHighlightStates(["123", "123", ""]);

    expect(Object.keys(states)).toEqual(["123"]);
    expect(states["123"]?.status).toBe("viewed");
  });

  it("prefers job status and score over visit marks", async () => {
    mockJobs.push(
      makeJob({
        status: "saved",
        ruleScore: { total: 87 } as Job["ruleScore"],
      }),
    );
    mockVisitMarks.push(makeVisitMark());

    const states = await getSearchHighlightStates(["123"]);

    expect(states["123"]?.status).toBe("saved");
    expect(states["123"]?.score).toBe(87);
    expect(states["123"]?.dimmed).toBeUndefined();
  });

  it("dims rejected cards by default", async () => {
    mockJobs.push(makeJob({ status: "rejected_by_me" }));

    const states = await getSearchHighlightStates(["123"]);

    expect(states["123"]?.status).toBe("rejected_by_me");
    expect(states["123"]?.dimmed).toBe(true);
    expect(states["123"]?.hidden).toBeUndefined();
  });

  it("hides rejected cards when configured", async () => {
    mockSettings.general.rejectedSearchCardBehavior = "hide";
    mockJobs.push(makeJob({ status: "rejected_by_me" }));

    const states = await getSearchHighlightStates(["123"]);

    expect(states["123"]?.status).toBe("rejected_by_me");
    expect(states["123"]?.hidden).toBe(true);
    expect(states["123"]?.dimmed).toBeUndefined();
  });
});
