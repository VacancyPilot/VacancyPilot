/**
 * Duplicate detection service tests — ITER-037.
 */

import { describe, it, expect } from "vitest";
import { titleSimilarity, detectDuplicates } from "./duplicate-detection";
import type { Job } from "@/models/job";
import { createStatusChange } from "./status-transitions";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString();
  return {
    id: "hh_1",
    source: "hh",
    sourceVacancyId: "1",
    sourceUrl: "https://hh.ru/vacancy/1",
    title: "Frontend Developer",
    companyId: "hh_co_acme",
    companyName: "Acme Corp",
    descriptionClean: "Build React apps",
    descriptionHash: "abc123",
    skills: ["React"],
    status: "saved",
    statusHistory: [createStatusChange(undefined, "saved", "system")],
    workMode: "remote",
    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ── titleSimilarity tests ────────────────────────────────────────────────────

describe("titleSimilarity", () => {
  it("returns 1 for identical titles", () => {
    expect(titleSimilarity("Frontend Developer", "Frontend Developer")).toBe(1);
  });

  it("returns 1 for identical titles with different case", () => {
    expect(titleSimilarity("Frontend Developer", "frontend developer")).toBe(1);
  });

  it("returns 0 for completely different titles", () => {
    expect(titleSimilarity("Frontend Developer", "DevOps Engineer")).toBe(0);
  });

  it("handles partial word overlap", () => {
    const sim = titleSimilarity(
      "Senior Frontend Developer",
      "Middle Frontend Developer",
    );
    // "frontend" + "developer" overlap out of 4 total tokens
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it("handles same tokens different order", () => {
    const sim = titleSimilarity("Developer Frontend", "Frontend Developer");
    expect(sim).toBe(1);
  });

  it("handles punctuation", () => {
    const sim = titleSimilarity(
      "Frontend Developer (React)",
      "Frontend Developer React",
    );
    // After punctuation removal: "frontend developer react" vs "frontend developer react"
    expect(sim).toBe(1);
  });

  it("handles empty strings", () => {
    expect(titleSimilarity("", "")).toBe(1);
  });

  it("handles one empty title", () => {
    expect(titleSimilarity("Frontend", "")).toBe(0);
  });

  it("handles Russian titles", () => {
    const sim = titleSimilarity(
      "Старший фронтенд разработчик",
      "Младший фронтенд разработчик",
    );
    // "фронтенд" + "разработчик" overlap out of 4 tokens
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it("handles extra whitespace", () => {
    expect(
      titleSimilarity("  Frontend   Developer  ", "Frontend Developer"),
    ).toBe(1);
  });
});

// ── detectDuplicates tests ───────────────────────────────────────────────────

describe("detectDuplicates", () => {
  it("returns empty array for single job", () => {
    const jobs = [makeJob()];
    expect(detectDuplicates(jobs)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(detectDuplicates([])).toEqual([]);
  });

  it("detects duplicate by same description hash", () => {
    const jobA = makeJob({
      id: "hh_1",
      sourceVacancyId: "1",
      sourceUrl: "https://hh.ru/vacancy/1",
      descriptionHash: "SAME_HASH",
      title: "Frontend Developer",
      firstSeenAt: "2025-01-01T00:00:00.000Z",
    });
    const jobB = makeJob({
      id: "hh_2",
      sourceVacancyId: "2",
      sourceUrl: "https://hh.ru/vacancy/2",
      descriptionHash: "SAME_HASH",
      title: "Frontend Developer (updated)",
      firstSeenAt: "2025-02-01T00:00:00.000Z",
    });

    const result = detectDuplicates([jobA, jobB]);
    expect(result).toHaveLength(1);
    expect(result[0].sameDescriptionHash).toBe(true);
    expect(result[0].confidence).toBeGreaterThanOrEqual(0.9);
    // jobA should be first (earlier firstSeenAt)
    expect(result[0].jobA.id).toBe("hh_1");
    expect(result[0].jobB.id).toBe("hh_2");
  });

  it("detects duplicate by same company + similar title", () => {
    const jobA = makeJob({
      id: "hh_1",
      sourceVacancyId: "1",
      companyId: "hh_co_acme",
      title: "Senior Frontend Developer React",
      firstSeenAt: "2025-01-01T00:00:00.000Z",
    });
    const jobB = makeJob({
      id: "hh_2",
      sourceVacancyId: "2",
      companyId: "hh_co_acme",
      title: "Middle Frontend Developer React",
      firstSeenAt: "2025-02-01T00:00:00.000Z",
    });

    const result = detectDuplicates([jobA, jobB]);
    expect(result).toHaveLength(1);
    expect(result[0].sameCompany).toBe(true);
    expect(result[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("detects duplicate by very similar title alone", () => {
    const jobA = makeJob({
      id: "hh_1",
      companyId: "hh_co_acme",
      title: "Frontend Developer React TypeScript",
      descriptionHash: "hash_a",
      firstSeenAt: "2025-01-01T00:00:00.000Z",
    });
    const jobB = makeJob({
      id: "hh_2",
      companyId: "hh_co_other",
      title: "Frontend Developer React",
      descriptionHash: "hash_b",
      firstSeenAt: "2025-02-01T00:00:00.000Z",
    });

    const result = detectDuplicates([jobA, jobB]);
    // 3 of 4 tokens overlap = 0.75 Jaccard > 0.65 threshold
    // Cross-company with moderate title similarity -> confidence ~0.52
    expect(result).toHaveLength(1);
    expect(result[0].sameCompany).toBe(false);
    expect(result[0].confidence).toBeLessThan(0.7);
  });

  it("does not flag completely different jobs", () => {
    const jobA = makeJob({
      id: "hh_1",
      title: "Frontend Developer",
      companyId: "hh_co_acme",
      descriptionHash: "hash_a",
    });
    const jobB = makeJob({
      id: "hh_2",
      title: "DevOps Engineer",
      companyId: "hh_co_other",
      descriptionHash: "hash_b",
    });

    const result = detectDuplicates([jobA, jobB]);
    expect(result).toEqual([]);
  });

  it("excludes blacklisted jobs from duplicate detection", () => {
    const jobA = makeJob({
      id: "hh_1",
      title: "Frontend Developer",
      descriptionHash: "SAME",
    });
    const jobB = makeJob({
      id: "hh_2",
      title: "Frontend Developer",
      descriptionHash: "SAME",
      status: "blacklist",
    });

    const result = detectDuplicates([jobA, jobB]);
    expect(result).toEqual([]);
  });

  it("excludes rejected_by_me jobs from duplicate detection", () => {
    const jobA = makeJob({
      id: "hh_1",
      title: "Frontend Developer",
      descriptionHash: "SAME",
    });
    const jobB = makeJob({
      id: "hh_2",
      title: "Frontend Developer",
      descriptionHash: "SAME",
      status: "rejected_by_me",
    });

    const result = detectDuplicates([jobA, jobB]);
    expect(result).toEqual([]);
  });

  it("detects duplicate by same canonical URL", () => {
    const jobA = makeJob({
      id: "hh_1",
      canonicalUrl: "https://hh.ru/vacancy/100?from=search",
      title: "Frontend Developer",
      firstSeenAt: "2025-01-01T00:00:00.000Z",
    });
    const jobB = makeJob({
      id: "hh_2",
      canonicalUrl: "https://hh.ru/vacancy/100?from=search",
      title: "Frontend Developer (Reposted)",
      firstSeenAt: "2025-02-01T00:00:00.000Z",
    });

    const result = detectDuplicates([jobA, jobB]);
    expect(result).toHaveLength(1);
    expect(result[0].sameUrl).toBe(true);
    expect(result[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("sorts results by confidence descending", () => {
    const jobA = makeJob({
      id: "hh_1",
      title: "Frontend Developer React",
      companyId: "hh_co_acme",
      descriptionHash: "hash_a",
    });
    const jobB = makeJob({
      id: "hh_2",
      title: "Frontend Developer React",
      companyId: "hh_co_acme",
      descriptionHash: "hash_b",
    });
    const jobC = makeJob({
      id: "hh_3",
      title: "Frontend Developer",
      companyId: "hh_co_other",
      descriptionHash: "hash_c",
    });

    // jobA vs jobB → same company + very similar → high confidence
    // jobA vs jobC → similar title + different company → moderate
    // jobB vs jobC → similar title + different company → moderate
    const result = detectDuplicates([jobA, jobB, jobC]);

    // Should be sorted by confidence
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].confidence).toBeLessThanOrEqual(
        result[i - 1].confidence,
      );
    }
  });

  it("handles three jobs with same description hash (all duplicates)", () => {
    const jobA = makeJob({
      id: "hh_1",
      title: "Dev A",
      descriptionHash: "SAME",
      firstSeenAt: "2025-01-01T00:00:00.000Z",
    });
    const jobB = makeJob({
      id: "hh_2",
      title: "Dev B",
      descriptionHash: "SAME",
      firstSeenAt: "2025-02-01T00:00:00.000Z",
    });
    const jobC = makeJob({
      id: "hh_3",
      title: "Dev C",
      descriptionHash: "SAME",
      firstSeenAt: "2025-03-01T00:00:00.000Z",
    });

    const result = detectDuplicates([jobA, jobB, jobC]);
    // 3 pairs: A-B, A-C, B-C
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.sameDescriptionHash)).toBe(true);
  });
});
