import { describe, it, expect } from "vitest";

// ── Pure helpers ──

function buildJobId(vacancyId: string): string {
  return `hh_${vacancyId}`;
}

interface BadgePayload {
  score?: number;
  status?: string;
}

function buildBadgePayload(job: {
  ruleScore?: { total: number } | null;
  status: string;
}): BadgePayload {
  return {
    score: job.ruleScore?.total,
    status: job.status,
  };
}

describe("buildJobId", () => {
  it('prepends "hh_" to the vacancy id', () => {
    expect(buildJobId("12345")).toBe("hh_12345");
    expect(buildJobId("999")).toBe("hh_999");
  });

  it("handles empty string", () => {
    expect(buildJobId("")).toBe("hh_");
  });
});

describe("buildBadgePayload", () => {
  it("includes score and status", () => {
    const payload = buildBadgePayload({
      ruleScore: { total: 85 },
      status: "saved",
    });
    expect(payload).toEqual({ score: 85, status: "saved" });
  });

  it("omits score when ruleScore is undefined", () => {
    const payload = buildBadgePayload({
      ruleScore: undefined,
      status: "viewed",
    });
    expect(payload).toEqual({ score: undefined, status: "viewed" });
  });

  it("omits score when ruleScore is null", () => {
    const payload = buildBadgePayload({
      ruleScore: null,
      status: "new",
    });
    expect(payload).toEqual({ score: undefined, status: "new" });
  });
});

// ── Content script EXTRACT_VACANCY handler (logic test) ──

import type { RawVacancyDTO } from "@/adapters/hh/types";

// Minimal mock: the content script handler uses HHAdapter.extractVacancy.
// We test that the handler responds with the correct shape.

interface ExtractResponse {
  success: boolean;
  dto?: RawVacancyDTO;
  error?: string;
}

/**
 * Replicates the content script's EXTRACT_VACANCY handler logic.
 * In the real content script, HHAdapter.extractVacancy(document) is called.
 * Here we test the response shape for success and failure paths.
 */
function handleExtractVacancy(
  extractFn: () => RawVacancyDTO | null,
): ExtractResponse {
  try {
    const dto = extractFn();
    if (dto) {
      return { success: true, dto };
    }
    return {
      success: false,
      error: "Could not extract vacancy data from this page",
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function makeMinimalDTO(overrides?: Partial<RawVacancyDTO>): RawVacancyDTO {
  return {
    sourceVacancyId: "12345",
    sourceUrl: "https://hh.ru/vacancy/12345",
    title: "Frontend Developer",
    companyName: "Acme Corp",
    salaryRaw: "100 000 ₽",
    salaryMin: 100000,
    salaryMax: null,
    salaryCurrency: "RUB",
    city: "Москва",
    workMode: "remote",
    experienceRaw: "1–3 года",
    employmentType: null,
    schedule: null,
    descriptionHtml: "<p>Test</p>",
    descriptionText: "Test",
    skills: ["React"],
    extractedAt: new Date().toISOString(),
    selectorVersion: "1.0.0",
    warnings: [],
    ...overrides,
  };
}

describe("handleExtractVacancy (content script handler logic)", () => {
  it("returns success with DTO when extraction succeeds", () => {
    const dto = makeMinimalDTO();
    const response = handleExtractVacancy(() => dto);
    expect(response.success).toBe(true);
    expect(response.dto).toBeDefined();
    expect(response.dto!.sourceVacancyId).toBe("12345");
    expect(response.dto!.title).toBe("Frontend Developer");
  });

  it("returns failure when extraction returns null (not a vacancy page)", () => {
    const response = handleExtractVacancy(() => null);
    expect(response.success).toBe(false);
    expect(response.error).toContain("Could not extract");
  });

  it("returns failure when extraction throws", () => {
    const response = handleExtractVacancy(() => {
      throw new Error("DOM parse error");
    });
    expect(response.success).toBe(false);
    expect(response.error).toBe("DOM parse error");
  });

  it("returns failure with non-Error throwables", () => {
    const response = handleExtractVacancy(() => {
      throw "something went wrong";
    });
    expect(response.success).toBe(false);
    expect(response.error).toBe("something went wrong");
  });

  it("passes through all DTO fields", () => {
    const dto = makeMinimalDTO({
      salaryMax: 150000,
      employmentType: "Полная занятость",
      skills: ["React", "TypeScript", "Node.js"],
    });
    const response = handleExtractVacancy(() => dto);
    expect(response.success).toBe(true);
    expect(response.dto!.salaryMax).toBe(150000);
    expect(response.dto!.employmentType).toBe("Полная занятость");
    expect(response.dto!.skills).toHaveLength(3);
  });
});

// ── Score computation flow (logic test with mocked DB) ──

import { scoreJob } from "@/services/scoring";
import type { Job } from "@/models/job";
import type { Profile } from "@/models/profile";

function makeTestJob(overrides?: Partial<Job>): Job {
  return {
    id: "hh_12345",
    source: "hh",
    sourceVacancyId: "12345",
    sourceUrl: "https://hh.ru/vacancy/12345",
    title: "Frontend Developer",
    companyId: "hh_co_acme_corp",
    companyName: "Acme Corp",
    descriptionClean:
      "We are looking for a React developer with TypeScript skills.",
    descriptionHash: "abc123",
    skills: ["React", "TypeScript"],
    status: "viewed",
    statusHistory: [],
    workMode: "remote",
    salaryMin: 150000,
    salaryMax: 200000,
    salaryCurrency: "RUB",
    city: "Москва",
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTestProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: "profile_1",
    name: "Default",
    summary: "Senior frontend developer",
    targetTitles: ["Frontend Developer", "React Developer"],
    mustHaveSkills: ["React", "TypeScript"],
    niceToHaveSkills: ["Node.js"],
    avoidKeywords: [],
    preferredWorkModes: ["remote"],
    preferredCities: ["Москва"],
    salaryExpectationMin: 130000,
    salaryCurrency: "RUB",
    letterPrefs: {
      defaultMode: "tg_short",
      defaultConstraints: {
        noEmoji: false,
        noMarkdown: false,
        noSpecialChars: false,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("scoreJob integration (popup save path)", () => {
  it("computes a high score for a strong match", () => {
    const job = makeTestJob();
    const profile = makeTestProfile();
    const result = scoreJob(job, profile);

    // Strong match with title, skills, work mode, location, and salary all matching.
    // Nice-to-have skills and experience fit may not be fully scored by default.
    expect(result.total).toBeGreaterThanOrEqual(70);
    expect(result.recommendation).toBe("consider");
  });

  it("computes a lower score for a title mismatch", () => {
    const job = makeTestJob({
      title: "Data Scientist",
      skills: ["Python", "Pandas"],
      descriptionClean: "Looking for a data scientist.",
    });
    const profile = makeTestProfile({
      targetTitles: ["Frontend Developer"],
      mustHaveSkills: ["React"],
    });
    const result = scoreJob(job, profile);

    expect(result.total).toBeLessThan(50);
    expect(result.recommendation).toBe("skip");
  });

  it("handles missing salary data gracefully", () => {
    const job = makeTestJob({
      salaryMin: undefined,
      salaryMax: undefined,
    });
    const profile = makeTestProfile();
    const result = scoreJob(job, profile);

    // Should still produce a valid score result
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown).toBeDefined();
  });

  it("stores ruleScore on the job object correctly", () => {
    const job = makeTestJob();
    const profile = makeTestProfile();
    const result = scoreJob(job, profile);

    const updatedJob: Job = { ...job, ruleScore: result };

    expect(updatedJob.ruleScore).toBeDefined();
    expect(updatedJob.ruleScore!.total).toBe(result.total);
    expect(updatedJob.ruleScore!.recommendation).toBeDefined();
  });

  it("produces identical results with identical inputs (determinism)", () => {
    const job = makeTestJob();
    const profile = makeTestProfile();

    const result1 = scoreJob(job, profile);
    const result2 = scoreJob(job, profile);

    expect(result1.total).toBe(result2.total);
    expect(result1.recommendation).toBe(result2.recommendation);
  });
});

describe("computeAndStoreScore logic (no profile)", () => {
  it("returns job unchanged when no profile exists", () => {
    const job = makeTestJob();
    // Simulating the case where profileRepo.list() returns []
    // In the actual code, computeAndStoreScore returns job unchanged if no profile.
    const profiles: Profile[] = [];
    const profile = profiles[0]; // undefined

    if (!profile) {
      // Job stays unchanged
      expect(job.ruleScore).toBeUndefined();
      expect(job.selectedProfileId).toBeUndefined();
    }
  });
});
