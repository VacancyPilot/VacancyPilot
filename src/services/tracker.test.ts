import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job, JobStatus } from "@/models/job";
import type { EventLog } from "@/models/event-log";
import type { RawVacancyDTO } from "@/adapters/hh/types";
import { createStatusChange, STATUS_ORDER } from "./status-transitions";
import { createEventLogEntry } from "./event-log-helper";
import { parseExperienceMinYears } from "./tracker";

// ---- Status transitions (pure) ----

describe("STATUS_ORDER", () => {
  it("contains all 12 defined statuses", () => {
    expect(STATUS_ORDER).toHaveLength(12);
  });

  it("starts with new and ends with blacklist", () => {
    expect(STATUS_ORDER[0]).toBe("new");
    expect(STATUS_ORDER[STATUS_ORDER.length - 1]).toBe("blacklist");
  });
});

describe("createStatusChange", () => {
  it("creates a change record with correct shape", () => {
    const change = createStatusChange("saved", "applied", "user", "sent CV");
    expect(change.from).toBe("saved");
    expect(change.to).toBe("applied");
    expect(change.source).toBe("user");
    expect(change.note).toBe("sent CV");
    expect(change.at).toBeTruthy();
    expect(new Date(change.at).getTime()).not.toBeNaN();
  });

  it("defaults source to user", () => {
    const change = createStatusChange(undefined, "viewed");
    expect(change.source).toBe("user");
  });

  it("allows from to be undefined (initial status)", () => {
    const change = createStatusChange(undefined, "new", "system");
    expect(change.from).toBeUndefined();
    expect(change.to).toBe("new");
    expect(change.source).toBe("system");
  });

  it("produces ISO-8601 timestamps", () => {
    const change = createStatusChange("viewed", "saved");
    expect(change.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ---- Event log helper (pure) ----

describe("createEventLogEntry", () => {
  it("creates a job_saved event with correct shape", () => {
    const entry = createEventLogEntry(
      "job_saved",
      { title: "Dev" },
      { jobId: "hh_1" },
    );

    expect(entry.type).toBe("job_saved");
    expect(entry.jobId).toBe("hh_1");
    expect(entry.applicationId).toBeUndefined();
    expect(entry.payloadPreview).toEqual({ title: "Dev" });
    expect(entry.sentToN8n).toBe(false);
    expect(entry.n8nStatus).toBeUndefined();
    expect(entry.n8nError).toBeUndefined();
    expect(entry.createdAt).toBeTruthy();
  });

  it("generates unique IDs", () => {
    const a = createEventLogEntry("job_saved", {});
    const b = createEventLogEntry("job_saved", {});
    expect(a.id).not.toBe(b.id);
  });

  it("accepts applicationId", () => {
    const entry = createEventLogEntry(
      "application_status_saved",
      {},
      { jobId: "hh_1", applicationId: "app_1" },
    );
    expect(entry.applicationId).toBe("app_1");
  });
});

// ---- Experience parser (pure) ----

describe("parseExperienceMinYears", () => {
  it("returns undefined for null/undefined/empty", () => {
    expect(parseExperienceMinYears(null)).toBeUndefined();
    expect(parseExperienceMinYears(undefined)).toBeUndefined();
    expect(parseExperienceMinYears("")).toBeUndefined();
    expect(parseExperienceMinYears("   ")).toBeUndefined();
  });

  it("returns undefined for unparseable strings", () => {
    expect(parseExperienceMinYears("some random text")).toBeUndefined();
    expect(parseExperienceMinYears("unknown")).toBeUndefined();
  });

  // ── RU range patterns ──

  it('parses RU range "1–3 года" → 1', () => {
    expect(parseExperienceMinYears("1–3 года")).toBe(1);
  });

  it('parses RU range "3–6 лет" → 3', () => {
    expect(parseExperienceMinYears("3–6 лет")).toBe(3);
  });

  it('parses RU range with hyphen "1-3 года" → 1', () => {
    expect(parseExperienceMinYears("1-3 года")).toBe(1);
  });

  it('parses RU range with em-dash "3—6 лет" → 3', () => {
    expect(parseExperienceMinYears("3—6 лет")).toBe(3);
  });

  // ── RU minimum patterns ──

  it('parses "более 6 лет" → 6', () => {
    expect(parseExperienceMinYears("более 6 лет")).toBe(6);
  });

  it('parses "более 5 лет" → 5', () => {
    expect(parseExperienceMinYears("более 5 лет")).toBe(5);
  });

  it('parses "от 1 года" → 1', () => {
    expect(parseExperienceMinYears("от 1 года")).toBe(1);
  });

  it('parses "от 3 лет" → 3', () => {
    expect(parseExperienceMinYears("от 3 лет")).toBe(3);
  });

  it('parses "6+ лет" → 6', () => {
    expect(parseExperienceMinYears("6+ лет")).toBe(6);
  });

  // ── RU no experience ──

  it('parses "не требуется" → 0', () => {
    expect(parseExperienceMinYears("не требуется")).toBe(0);
  });

  it('parses "нет опыта" → 0', () => {
    expect(parseExperienceMinYears("нет опыта")).toBe(0);
  });

  it('parses "без опыта" → 0', () => {
    expect(parseExperienceMinYears("без опыта")).toBe(0);
  });

  // ── EN patterns ──

  it('parses EN range "1–3 years" → 1', () => {
    expect(parseExperienceMinYears("1–3 years")).toBe(1);
  });

  it('parses EN range "3–6 years" → 3', () => {
    expect(parseExperienceMinYears("3–6 years")).toBe(3);
  });

  it('parses "5+ years" → 5', () => {
    expect(parseExperienceMinYears("5+ years")).toBe(5);
  });

  it('parses "more than 5 years" → 5', () => {
    expect(parseExperienceMinYears("more than 5 years")).toBe(5);
  });

  it('parses "more than 10 years" → 10', () => {
    expect(parseExperienceMinYears("more than 10 years")).toBe(10);
  });

  it('parses "no experience" → 0', () => {
    expect(parseExperienceMinYears("no experience")).toBe(0);
  });

  it('parses "not required" → 0', () => {
    expect(parseExperienceMinYears("not required")).toBe(0);
  });

  // ── Edge cases ──

  it("handles leading/trailing whitespace", () => {
    expect(parseExperienceMinYears("  3–6 лет  ")).toBe(3);
  });

  it("handles mixed case", () => {
    expect(parseExperienceMinYears("No Experience")).toBe(0);
    expect(parseExperienceMinYears("More Than 5 Years")).toBe(5);
  });

  it('parses single number RU "3 года" → 3', () => {
    expect(parseExperienceMinYears("3 года")).toBe(3);
  });

  it('parses single number RU "5 лет" → 5', () => {
    expect(parseExperienceMinYears("5 лет")).toBe(5);
  });
});

// ---- Tracker service (with mocked DB) ----

const mockJobStore = new Map<string, Job>();
const mockEventStore = new Map<string, EventLog>();

function resetMockStores() {
  mockJobStore.clear();
  mockEventStore.clear();
}

// Mock database module (only events.put is used directly by the tracker)
vi.mock("@/db/database", () => ({
  db: {
    events: {
      put: async (entry: EventLog) => {
        mockEventStore.set(entry.id, entry);
      },
    },
  },
}));

vi.mock("@/db/repositories", () => ({
  jobRepo: {
    getById: async (id: string) => mockJobStore.get(id) ?? undefined,
    save: async (job: Job) => {
      mockJobStore.set(job.id, job);
    },
    findBySourceVacancy: async (source: string, sourceVacancyId: string) => {
      for (const job of mockJobStore.values()) {
        if (job.source === source && job.sourceVacancyId === sourceVacancyId) {
          return job;
        }
      }
      return undefined;
    },
  },
}));

import { tracker } from "./tracker";

function makeDTO(overrides?: Partial<RawVacancyDTO>): RawVacancyDTO {
  return {
    sourceVacancyId: "12345",
    sourceUrl: "https://hh.ru/vacancy/12345",
    title: "Frontend Developer",
    companyName: "Acme Corp",
    salaryRaw: "100 000 – 150 000 ₽",
    salaryMin: 100000,
    salaryMax: 150000,
    salaryCurrency: "RUB",
    city: "Москва",
    workMode: "remote",
    experienceRaw: "1–3 года",
    employmentType: null,
    schedule: null,
    descriptionHtml: "<p>We need a React developer</p>",
    descriptionText: "We need a React developer",
    skills: ["React", "TypeScript"],
    sourceCompanyId: null,
    extractedAt: new Date().toISOString(),
    selectorVersion: "1.0.0",
    warnings: [],
    ...overrides,
  };
}

describe("tracker.saveFromDTO", () => {
  beforeEach(() => {
    resetMockStores();
  });

  it("creates a new job on first save", async () => {
    const dto = makeDTO();
    const job = await tracker.saveFromDTO(dto);

    expect(job.id).toBe("hh_12345");
    expect(job.source).toBe("hh");
    expect(job.sourceVacancyId).toBe("12345");
    expect(job.title).toBe("Frontend Developer");
    expect(job.companyName).toBe("Acme Corp");
    expect(job.status).toBe("saved");
    expect(job.statusHistory).toHaveLength(1);
    expect(job.statusHistory[0].to).toBe("saved");
    expect(job.statusHistory[0].source).toBe("system");
  });

  it("persists the job to the store", async () => {
    const dto = makeDTO();
    await tracker.saveFromDTO(dto);

    expect(mockJobStore.has("hh_12345")).toBe(true);
  });

  it("logs a job_saved event on create", async () => {
    const dto = makeDTO();
    await tracker.saveFromDTO(dto);

    const events = Array.from(mockEventStore.values());
    expect(events.length).toBeGreaterThanOrEqual(1);
    const savedEvent = events.find((e) => e.type === "job_saved");
    expect(savedEvent).toBeDefined();
    expect(savedEvent!.jobId).toBe("hh_12345");
    expect(savedEvent!.payloadPreview).toHaveProperty("action", "created");
  });

  it("updates existing job on second save", async () => {
    const dto1 = makeDTO({ title: "Old Title" });
    await tracker.saveFromDTO(dto1);

    const dto2 = makeDTO({ title: "New Title", salaryMin: 200000 });
    const updated = await tracker.saveFromDTO(dto2);

    expect(updated.id).toBe("hh_12345");
    expect(updated.title).toBe("New Title");
    expect(updated.salaryMin).toBe(200000);
    // Status should be preserved
    expect(updated.status).toBe("saved");
  });

  it("preserves stronger status on update (applied not downgraded)", async () => {
    const dto = makeDTO();
    const created = await tracker.saveFromDTO(dto);

    // Manually change status to a post-save status
    mockJobStore.set(created.id, {
      ...created,
      status: "applied" as JobStatus,
    });

    const dto2 = makeDTO();
    const updated = await tracker.saveFromDTO(dto2);
    expect(updated.status).toBe("applied");
  });

  it("preserves existing description when an update omits descriptionText", async () => {
    const created = await tracker.saveFromDTO(makeDTO());
    const updated = await tracker.saveFromDTO(
      makeDTO({ title: "Updated Title", descriptionText: null }),
    );

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Updated Title");
    expect(updated.descriptionClean).toBe(created.descriptionClean);
    expect(updated.descriptionHash).toBe(created.descriptionHash);
  });

  it("rejects missing sourceVacancyId", async () => {
    const dto = makeDTO({ sourceVacancyId: null });
    await expect(tracker.saveFromDTO(dto)).rejects.toThrow(
      "Cannot save vacancy: sourceVacancyId is missing",
    );
  });

  it("rejects empty sourceVacancyId", async () => {
    const dto = makeDTO({ sourceVacancyId: "" });
    await expect(tracker.saveFromDTO(dto)).rejects.toThrow(
      "Cannot save vacancy: sourceVacancyId is missing",
    );
  });

  it("rejects whitespace-only sourceVacancyId", async () => {
    const dto = makeDTO({ sourceVacancyId: "   " });
    await expect(tracker.saveFromDTO(dto)).rejects.toThrow(
      "Cannot save vacancy: sourceVacancyId is missing",
    );
  });

  it("handles null description gracefully", async () => {
    const dto = makeDTO({ descriptionText: null });
    const job = await tracker.saveFromDTO(dto);

    expect(job.descriptionClean).toBe("");
    expect(job.descriptionHash).toBe("0");
  });

  it("sets default workMode to unknown if null", async () => {
    const dto = makeDTO({ workMode: null });
    const job = await tracker.saveFromDTO(dto);

    expect(job.workMode).toBe("unknown");
  });
});

describe("tracker.updateStatus", () => {
  beforeEach(() => {
    resetMockStores();
  });

  async function seedJob(status: JobStatus = "viewed"): Promise<Job> {
    const job: Job = {
      id: "hh_999",
      source: "hh",
      sourceVacancyId: "999",
      sourceUrl: "https://hh.ru/vacancy/999",
      title: "Test Job",
      companyId: "hh_co_test",
      companyName: "Test Inc",
      descriptionClean: "desc",
      descriptionHash: "abc",
      skills: [],
      status,
      statusHistory: [createStatusChange(undefined, status, "system")],
      workMode: "remote",
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockJobStore.set(job.id, job);
    return job;
  }

  it("updates status and appends history", async () => {
    await seedJob("viewed");
    const updated = await tracker.updateStatus(
      "hh_999",
      "applied",
      "Откликнулся",
    );

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("applied");
    expect(updated!.statusHistory).toHaveLength(2);
    expect(updated!.statusHistory[1].from).toBe("viewed");
    expect(updated!.statusHistory[1].to).toBe("applied");
    expect(updated!.statusHistory[1].source).toBe("user");
    expect(updated!.statusHistory[1].note).toBe("Откликнулся");
  });

  it("logs a status_changed event", async () => {
    await seedJob("viewed");
    await tracker.updateStatus("hh_999", "saved");

    const events = Array.from(mockEventStore.values());
    const statusEvent = events.find((e) => e.type === "status_changed");
    expect(statusEvent).toBeDefined();
    expect(statusEvent!.payloadPreview).toMatchObject({
      from: "viewed",
      to: "saved",
    });
  });

  it("returns null for non-existent job", async () => {
    const result = await tracker.updateStatus("hh_nonexistent", "saved");
    expect(result).toBeNull();
  });

  it("allows transition to rejected_by_me", async () => {
    await seedJob("saved");
    const updated = await tracker.updateStatus("hh_999", "rejected_by_me");
    expect(updated!.status).toBe("rejected_by_me");
  });
});
