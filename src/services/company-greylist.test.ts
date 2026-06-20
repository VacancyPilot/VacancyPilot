/**
 * Company greylist service tests — ITER-038.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock companyRepo ───────────────────────────────────────────────────────

const mockStore = new Map<
  string,
  {
    id: string;
    source: string;
    sourceCompanyId?: string;
    name: string;
    status: "normal" | "greylist" | "blacklist";
    blacklistReason?: string;
    createdAt: string;
    updatedAt: string;
  }
>();

vi.mock("@/db/repositories", () => ({
  companyRepo: {
    list: vi.fn(async () =>
      [...mockStore.values()].sort((a, b) => a.name.localeCompare(b.name)),
    ),
    getById: vi.fn(async (id: string) => mockStore.get(id)),
    save: vi.fn(async (company: ReturnType<typeof mockStore.get>) => {
      if (company) {
        mockStore.set(
          company.id,
          company as typeof mockStore extends Map<string, infer V> ? V : never,
        );
      }
    }),
    delete: vi.fn(async (id: string) => {
      mockStore.delete(id);
    }),
    findBySourceCompanyId: vi.fn(
      async (source: string, sourceCompanyId: string) => {
        for (const c of mockStore.values()) {
          if (c.source === source && c.sourceCompanyId === sourceCompanyId)
            return c;
        }
        return undefined;
      },
    ),
    listByStatus: vi.fn(async (status: "normal" | "greylist" | "blacklist") =>
      [...mockStore.values()].filter((c) => c.status === status),
    ),
  },
  jobRepo: {}, // unused in greylist service tests
  profileRepo: {},
  resumeRepo: {},
  coverLetterRepo: {},
}));

import {
  lookupCompanyForJob,
  setCompanyStatus,
  clearCompanyStatus,
  listRestrictedCompanies,
  listAllCompanies,
  ensureCompanyRecord,
  bulkLookupCompanies,
} from "./company-greylist";
import type { Job } from "@/models/job";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString();
  return {
    id: "hh_123",
    source: "hh",
    sourceVacancyId: "123",
    sourceUrl: "https://hh.ru/vacancy/123",
    title: "Frontend Developer",
    companyId: "hh_co_acme",
    companyName: "Acme Corp",
    descriptionClean: "Build React apps",
    descriptionHash: "abc",
    skills: ["React"],
    status: "saved",
    statusHistory: [],
    workMode: "remote",
    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeCompany(
  id: string,
  name: string,
  status: "normal" | "greylist" | "blacklist" = "normal",
) {
  const now = new Date().toISOString();
  return {
    id,
    source: "hh" as const,
    name,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

beforeEach(() => {
  mockStore.clear();
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("setCompanyStatus", () => {
  it("creates a new company with normal status", async () => {
    const result = await setCompanyStatus("hh_co_new", "New Corp", "normal");
    expect(result.id).toBe("hh_co_new");
    expect(result.name).toBe("New Corp");
    expect(result.status).toBe("normal");
    expect(mockStore.has("hh_co_new")).toBe(true);
  });

  it("creates a new company with greylist status", async () => {
    const result = await setCompanyStatus(
      "hh_co_grey",
      "Grey Corp",
      "greylist",
    );
    expect(result.status).toBe("greylist");
  });

  it("creates a new company with blacklist status and reason", async () => {
    const result = await setCompanyStatus(
      "hh_co_black",
      "Black Corp",
      "blacklist",
      "Scam company",
    );
    expect(result.status).toBe("blacklist");
    expect(result.blacklistReason).toBe("Scam company");
  });

  it("updates an existing company status", async () => {
    await setCompanyStatus("hh_co_acme", "Acme Corp", "normal");
    const updated = await setCompanyStatus(
      "hh_co_acme",
      "Acme Corp",
      "greylist",
    );
    expect(updated.status).toBe("greylist");
    expect(mockStore.get("hh_co_acme")?.status).toBe("greylist");
  });

  it("preserves existing blacklistReason when status is not blacklist", async () => {
    await setCompanyStatus("hh_co_x", "X", "blacklist", "Bad");
    const updated = await setCompanyStatus("hh_co_x", "X", "greylist");
    expect(updated.status).toBe("greylist");
    expect(updated.blacklistReason).toBe("Bad"); // preserved
  });
});

describe("clearCompanyStatus", () => {
  it("resets a greylisted company to normal", async () => {
    await setCompanyStatus("hh_co_grey", "Grey Corp", "greylist");
    const cleared = await clearCompanyStatus("hh_co_grey");
    expect(cleared?.status).toBe("normal");
    expect(cleared?.blacklistReason).toBeUndefined();
  });

  it("resets a blacklisted company to normal", async () => {
    await setCompanyStatus("hh_co_black", "Black Corp", "blacklist", "Scam");
    const cleared = await clearCompanyStatus("hh_co_black");
    expect(cleared?.status).toBe("normal");
    expect(cleared?.blacklistReason).toBeUndefined();
  });

  it("returns undefined for non-existent company", async () => {
    const result = await clearCompanyStatus("hh_co_nonexistent");
    expect(result).toBeUndefined();
  });
});

describe("listRestrictedCompanies", () => {
  it("returns only greylisted and blacklisted companies", async () => {
    await setCompanyStatus("hh_co_a", "A", "normal");
    await setCompanyStatus("hh_co_b", "B", "greylist");
    await setCompanyStatus("hh_co_c", "C", "blacklist");
    await setCompanyStatus("hh_co_d", "D", "normal");

    const result = await listRestrictedCompanies();
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.status).sort()).toEqual([
      "blacklist",
      "greylist",
    ]);
  });

  it("returns empty array when no restricted companies exist", async () => {
    await setCompanyStatus("hh_co_a", "A", "normal");
    const result = await listRestrictedCompanies();
    expect(result).toEqual([]);
  });
});

describe("listAllCompanies", () => {
  it("returns all companies", async () => {
    await setCompanyStatus("hh_co_a", "AAA", "normal");
    await setCompanyStatus("hh_co_b", "BBB", "greylist");

    const result = await listAllCompanies();
    expect(result).toHaveLength(2);
  });
});

describe("ensureCompanyRecord", () => {
  it("creates a record when company does not exist", async () => {
    const result = await ensureCompanyRecord("hh_co_new", "New Corp");
    expect(result.status).toBe("normal");
    expect(result.name).toBe("New Corp");
  });

  it("does not override existing status", async () => {
    await setCompanyStatus("hh_co_acme", "Acme", "greylist");
    const result = await ensureCompanyRecord("hh_co_acme", "Acme");
    expect(result.status).toBe("greylist"); // preserved
  });
});

describe("lookupCompanyForJob", () => {
  it("finds company by direct companyId", async () => {
    await setCompanyStatus("hh_co_acme", "Acme Corp", "greylist");
    const job = makeJob({ companyId: "hh_co_acme" });
    const result = await lookupCompanyForJob(job);
    expect(result?.status).toBe("greylist");
  });

  it("finds company by sourceCompanyId extraction", async () => {
    const company = makeCompany("hh_co_emp_42", "Employer 42", "blacklist");
    (company as Record<string, unknown>).sourceCompanyId = "42";
    mockStore.set(
      "hh_co_emp_42",
      company as typeof mockStore extends Map<string, infer V> ? V : never,
    );

    const job = makeJob({ companyId: "hh_co_emp_42" });
    const result = await lookupCompanyForJob(job);
    expect(result?.id).toBe("hh_co_emp_42");
  });

  it("returns undefined for unknown company", async () => {
    const job = makeJob({ companyId: "hh_co_unknown" });
    const result = await lookupCompanyForJob(job);
    expect(result).toBeUndefined();
  });
});

describe("bulkLookupCompanies", () => {
  it("returns a map of companyId to Company for known companies", async () => {
    await setCompanyStatus("hh_co_a", "A Corp", "greylist");
    await setCompanyStatus("hh_co_b", "B Corp", "normal");

    const jobs = [
      makeJob({ companyId: "hh_co_a", id: "hh_1", sourceVacancyId: "1" }),
      makeJob({ companyId: "hh_co_b", id: "hh_2", sourceVacancyId: "2" }),
      makeJob({ companyId: "hh_co_unknown", id: "hh_3", sourceVacancyId: "3" }),
    ];

    const result = await bulkLookupCompanies(jobs);
    expect(result.size).toBe(2);
    expect(result.get("hh_co_a")?.status).toBe("greylist");
    expect(result.get("hh_co_b")?.status).toBe("normal");
    expect(result.has("hh_co_unknown")).toBe(false);
  });

  it("handles empty jobs array", async () => {
    const result = await bulkLookupCompanies([]);
    expect(result.size).toBe(0);
  });
});
