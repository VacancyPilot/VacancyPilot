import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  VacancyAnalysisInput,
  CoverLetterInput,
  AIAnalysis,
  AIRequestCache,
} from "@/models/ai";

// ── Mock the database module ───────────────────────────────────────────

const mockAiCacheStore = new Map<string, AIRequestCache[]>();
const mockMetaStore = new Map<string, unknown>();

// Reset stores before each test
beforeEach(() => {
  mockAiCacheStore.clear();
  mockMetaStore.clear();
});

// Mock the db module with in-memory stores
vi.mock("@/db/database", () => {
  // Simple Dexie-like query builder mock
  function createWhereClause(field: string) {
    return {
      equals: (v: string) => ({
        toArray: async () => {
          const records = mockAiCacheStore.get("aiCache") ?? [];
          return records.filter(
            (r) => (r as unknown as Record<string, unknown>)[field] === v,
          );
        },
        delete: async () => {
          const records = mockAiCacheStore.get("aiCache") ?? [];
          const filtered = records.filter(
            (r) => (r as unknown as Record<string, unknown>)[field] !== v,
          );
          mockAiCacheStore.set("aiCache", filtered);
        },
      }),
      above: () => ({ toArray: async () => [] }),
    };
  }

  function createTable(name: string) {
    return {
      put: async (record: unknown) => {
        if (name === "meta") {
          const metaRecord = record as { key: string; value: unknown };
          mockMetaStore.set(metaRecord.key, metaRecord.value);
          return;
        }
        const records = mockAiCacheStore.get(name) ?? [];
        const idx = records.findIndex(
          (r) => r.id === (record as AIRequestCache).id,
        );
        if (idx >= 0) records[idx] = record as AIRequestCache;
        else records.push(record as AIRequestCache);
        mockAiCacheStore.set(name, records);
      },
      get: async (key: string) => {
        if (name === "meta") {
          const val = mockMetaStore.get(key);
          return val !== undefined ? { key, value: val } : undefined;
        }
        const records = mockAiCacheStore.get(name) ?? [];
        return records.find((r) => r.id === key) ?? undefined;
      },
      toArray: async () => mockAiCacheStore.get(name) ?? [],
      clear: async () => mockAiCacheStore.set(name, []),
      delete: async (id: string) => {
        const records = mockAiCacheStore.get(name) ?? [];
        mockAiCacheStore.set(
          name,
          records.filter((r) => r.id !== id),
        );
      },
      bulkDelete: async (keys: string[]) => {
        if (name === "meta") {
          for (const key of keys) mockMetaStore.delete(key);
          return;
        }
        const records = mockAiCacheStore.get(name) ?? [];
        mockAiCacheStore.set(
          name,
          records.filter((r) => !keys.includes(r.id)),
        );
      },
      where: (arg: string | Record<string, string>) => {
        if (typeof arg === "object") {
          // Compound index query: where({ inputHash, kind })
          const filters = arg;
          return {
            toArray: async () => {
              const records = mockAiCacheStore.get(name) ?? [];
              return records.filter((r) =>
                Object.entries(filters).every(
                  ([k, v]) => (r as unknown as Record<string, unknown>)[k] === v,
                ),
              );
            },
          };
        }
        return createWhereClause(arg);
      },
      orderBy: () => ({
        reverse: () => ({
          toArray: async () => {
            const records = mockAiCacheStore.get(name) ?? [];
            return [...records].reverse();
          },
        }),
      }),
    };
  }

  return {
    db: {
      aiCache: createTable("aiCache"),
      meta: createTable("meta"),
    },
  };
});

// ── Now import the cache service (after mock is set up) ────────────────

import {
  checkAnalysisCache,
  checkCoverLetterCache,
  storeAnalysisCache,
  storeCoverLetterCache,
  invalidateCache,
  listCacheEntries,
  getCachedAnalysis,
  getCachedCoverLetter,
} from "./ai-cache";

// ── Test fixtures ──────────────────────────────────────────────────────

function makeAnalysisInput(
  overrides?: Partial<VacancyAnalysisInput>,
): VacancyAnalysisInput {
  return {
    job: {
      title: "Senior Developer",
      company: "Tech Corp",
      salaryRaw: "200000 руб.",
      city: "Москва",
      workMode: "remote",
      experienceRaw: "3-6 лет",
      skills: ["TypeScript", "React"],
      descriptionClean: "A great job opportunity.",
    },
    profile: {
      summary: "Experienced developer.",
      targetTitles: ["Developer"],
      mustHaveSkills: ["TypeScript"],
      niceToHaveSkills: ["GraphQL"],
    },
    strictPrivacy: false,
    ...overrides,
  };
}

function makeAnalysis(overrides?: Partial<AIAnalysis>): AIAnalysis {
  return {
    id: "ai_test_001",
    jobId: "hh_123456",
    profileId: "prof_1",
    provider: "openai",
    model: "gpt-4o",
    promptVersion: "1.0.0",
    inputHash: "abc123",
    fitScore: 75,
    recommendation: "apply",
    confidence: "medium",
    fitReasons: ["Good match"],
    riskFlags: [],
    missingSkills: [],
    questionsForHR: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCoverLetterInput(
  overrides?: Partial<CoverLetterInput>,
): CoverLetterInput {
  return {
    job: {
      title: "Senior Developer",
      company: "Tech Corp",
      topRequirements: "TypeScript, React",
      skills: ["TypeScript", "React"],
    },
    profile: {
      summary: "Experienced developer.",
    },
    resumeHighlights: "Led frontend platform work.",
    mode: "hh_standard",
    constraints: {
      noEmoji: true,
      noMarkdown: true,
      noSpecialChars: false,
      maxChars: 1000,
    },
    language: "ru",
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("checkAnalysisCache", () => {
  it("returns no hit when cache is disabled", async () => {
    const input = makeAnalysisInput();
    const result = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      false,
    );

    expect(result.hit).toBe(false);
    expect(result.analysis).toBeNull();
    expect(result.entry).toBeNull();
    expect(result.inputHash.length).toBeGreaterThan(0);
  });

  it("returns no hit when cache is empty", async () => {
    const input = makeAnalysisInput();
    const result = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    expect(result.hit).toBe(false);
    expect(result.analysis).toBeNull();
    expect(result.entry).toBeNull();
  });

  it("returns cache hit after storing", async () => {
    const input = makeAnalysisInput();
    const analysis = makeAnalysis();
    const cacheResult = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    // Store
    await storeAnalysisCache({
      inputHash: cacheResult.inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    // Check again
    const result = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    expect(result.hit).toBe(true);
    expect(result.analysis).not.toBeNull();
    expect(result.analysis!.id).toBe(analysis.id);
    expect(result.analysis!.fitScore).toBe(analysis.fitScore);
    expect(result.entry).not.toBeNull();
    expect(result.entry!.inputHash).toBe(cacheResult.inputHash);
  });

  it("returns no hit when provider differs", async () => {
    const input = makeAnalysisInput();
    const analysis = makeAnalysis();
    const cacheResult = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    await storeAnalysisCache({
      inputHash: cacheResult.inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    // Check with different provider
    const result = await checkAnalysisCache(
      input,
      "deepseek",
      "gpt-4o",
      "1.0.0",
      true,
    );

    expect(result.hit).toBe(false);
  });

  it("returns no hit when model differs", async () => {
    const input = makeAnalysisInput();
    const analysis = makeAnalysis();
    const cacheResult = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    await storeAnalysisCache({
      inputHash: cacheResult.inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    // Check with different model
    const result = await checkAnalysisCache(
      input,
      "openai",
      "gpt-3.5-turbo",
      "1.0.0",
      true,
    );

    expect(result.hit).toBe(false);
  });

  it("returns no hit when prompt version differs", async () => {
    const input = makeAnalysisInput();
    const analysis = makeAnalysis();
    const cacheResult = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    await storeAnalysisCache({
      inputHash: cacheResult.inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    // Check with different prompt version
    const result = await checkAnalysisCache(
      input,
      "openai",
      "gpt-4o",
      "2.0.0",
      true,
    );

    expect(result.hit).toBe(false);
  });

  it("returns no hit when input changes", async () => {
    const input1 = makeAnalysisInput();
    const analysis = makeAnalysis();
    const cacheResult = await checkAnalysisCache(
      input1,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    await storeAnalysisCache({
      inputHash: cacheResult.inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    // Different input → different hash → no hit
    const input2 = makeAnalysisInput();
    input2.job.title = "Different Title";
    const result = await checkAnalysisCache(
      input2,
      "openai",
      "gpt-4o",
      "1.0.0",
      true,
    );

    expect(result.hit).toBe(false);
    expect(result.inputHash).not.toBe(cacheResult.inputHash);
  });
});

describe("storeAnalysisCache", () => {
  it("stores analysis and creates cache entry", async () => {
    const analysis = makeAnalysis();
    const inputHash = "test_hash_123";

    await storeAnalysisCache({
      inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    // Verify we can retrieve it
    const retrieved = await getCachedAnalysis(analysis.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(analysis.id);
    expect(retrieved!.fitScore).toBe(analysis.fitScore);
  });
});

describe("checkCoverLetterCache", () => {
  it("returns no hit when cache is disabled", async () => {
    const input = makeCoverLetterInput();
    const result = await checkCoverLetterCache(
      input,
      "mock",
      "mock-gpt-4o",
      "1.0.0",
      false,
    );

    expect(result.hit).toBe(false);
    expect(result.letter).toBeNull();
    expect(result.entry).toBeNull();
  });

  it("returns cache hit after storing a letter", async () => {
    const input = makeCoverLetterInput();
    const firstCheck = await checkCoverLetterCache(
      input,
      "mock",
      "mock-gpt-4o",
      "1.0.0",
      true,
    );

    const storedRefId = await storeCoverLetterCache({
      inputHash: firstCheck.inputHash,
      kind: "cover_letter",
      provider: "mock",
      model: "mock-gpt-4o",
      promptVersion: "1.0.0",
      letter: "Здравствуйте! Меня заинтересовала вакансия.",
    });

    const result = await checkCoverLetterCache(
      input,
      "mock",
      "mock-gpt-4o",
      "1.0.0",
      true,
    );

    expect(result.hit).toBe(true);
    expect(result.letter).toBe("Здравствуйте! Меня заинтересовала вакансия.");
    expect(result.entry).not.toBeNull();
    expect(result.entry!.kind).toBe("cover_letter");
    expect(await getCachedCoverLetter(storedRefId)).toBe(
      "Здравствуйте! Меня заинтересовала вакансия.",
    );
  });

  it("returns no hit when prompt version differs", async () => {
    const input = makeCoverLetterInput();
    const firstCheck = await checkCoverLetterCache(
      input,
      "mock",
      "mock-gpt-4o",
      "1.0.0",
      true,
    );

    await storeCoverLetterCache({
      inputHash: firstCheck.inputHash,
      kind: "cover_letter",
      provider: "mock",
      model: "mock-gpt-4o",
      promptVersion: "1.0.0",
      letter: "Черновик письма",
    });

    const result = await checkCoverLetterCache(
      input,
      "mock",
      "mock-gpt-4o",
      "2.0.0",
      true,
    );

    expect(result.hit).toBe(false);
    expect(result.letter).toBeNull();
  });
});

describe("invalidateCache", () => {
  it("clears specific cache entry by inputHash", async () => {
    const analysis = makeAnalysis();
    const inputHash = "test_hash_clear";

    await storeAnalysisCache({
      inputHash,
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    const cleared = await invalidateCache(inputHash);
    expect(cleared).toBe(1);

    // Verify analysis is also cleaned up
    const retrieved = await getCachedAnalysis(analysis.id);
    expect(retrieved).toBeNull();
  });

  it("clears all cache when no inputHash provided", async () => {
    const analysis1 = makeAnalysis({ id: "ai_1" });
    const analysis2 = makeAnalysis({ id: "ai_2" });

    await storeAnalysisCache({
      inputHash: "hash1",
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis: analysis1,
    });

    await storeAnalysisCache({
      inputHash: "hash2",
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis: analysis2,
    });

    const cleared = await invalidateCache();
    expect(cleared).toBe(2);

    expect(await getCachedAnalysis("ai_1")).toBeNull();
    expect(await getCachedAnalysis("ai_2")).toBeNull();
  });

  it("returns 0 when clearing non-existent hash", async () => {
    const cleared = await invalidateCache("nonexistent");
    expect(cleared).toBe(0);
  });
});

describe("listCacheEntries", () => {
  it("returns empty array when cache is empty", async () => {
    const entries = await listCacheEntries();
    expect(entries).toEqual([]);
  });

  it("returns stored entries", async () => {
    const analysis = makeAnalysis();

    await storeAnalysisCache({
      inputHash: "hash1",
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    const entries = await listCacheEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].kind).toBe("vacancy_analysis");
    expect(entries[0].resultRefId).toBe(analysis.id);
  });
});

describe("getCachedAnalysis", () => {
  it("returns null for non-existent analysis", async () => {
    const result = await getCachedAnalysis("nonexistent_id");
    expect(result).toBeNull();
  });

  it("returns stored analysis", async () => {
    const analysis = makeAnalysis();

    await storeAnalysisCache({
      inputHash: "hash_test",
      kind: "vacancy_analysis" as const,
      provider: "openai",
      model: "gpt-4o",
      promptVersion: "1.0.0",
      analysis,
    });

    const result = await getCachedAnalysis(analysis.id);
    expect(result).not.toBeNull();
    expect(result!.fitScore).toBe(75);
    expect(result!.recommendation).toBe("apply");
  });
});
