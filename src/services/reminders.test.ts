import { describe, it, expect } from "vitest";
import { checkReminder, getReminders, getDailySummary } from "./reminders";
import type { Job } from "@/models/job";

/**
 * Tests for reminder eligibility and daily summary aggregation logic.
 *
 * All functions are pure — no DB, no chrome API, no side effects.
 */

// ── Helpers ──

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "hh_12345",
    source: "hh",
    sourceVacancyId: "12345",
    sourceUrl: "https://hh.ru/vacancy/12345",
    title: "Senior Developer",
    companyId: "hh_co_test",
    companyName: "Test Corp",
    salaryRaw: "100 000 – 150 000 ₽",
    city: "Москва",
    workMode: "hybrid",
    descriptionClean: "Test description",
    descriptionHash: "abc123",
    skills: ["TypeScript"],
    status: "saved",
    statusHistory: [],
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ── checkReminder ──

describe("checkReminder", () => {
  it("returns null for recently saved job", () => {
    const job = makeJob({ status: "saved", updatedAt: isoDaysAgo(1) });
    expect(checkReminder(job)).toBeNull();
  });

  it("returns stale_saved for saved job older than 7 days", () => {
    const job = makeJob({ status: "saved", updatedAt: isoDaysAgo(8) });
    const r = checkReminder(job);
    expect(r).not.toBeNull();
    expect(r!.reason).toBe("stale_saved");
    expect(r!.daysSince).toBeGreaterThanOrEqual(8);
  });

  it("returns stale_saved for letter_ready job older than 7 days", () => {
    const job = makeJob({
      status: "letter_ready",
      updatedAt: isoDaysAgo(10),
    });
    const r = checkReminder(job);
    expect(r).not.toBeNull();
    expect(r!.reason).toBe("stale_saved");
  });

  it("returns null for applied job less than 14 days", () => {
    const job = makeJob({ status: "applied", updatedAt: isoDaysAgo(10) });
    expect(checkReminder(job)).toBeNull();
  });

  it("returns no_response for applied job older than 14 days", () => {
    const job = makeJob({ status: "applied", updatedAt: isoDaysAgo(15) });
    const r = checkReminder(job);
    expect(r).not.toBeNull();
    expect(r!.reason).toBe("no_response");
  });

  it("returns interview_pending for any interview job", () => {
    const job = makeJob({ status: "interview", updatedAt: isoDaysAgo(1) });
    const r = checkReminder(job);
    expect(r).not.toBeNull();
    expect(r!.reason).toBe("interview_pending");
  });

  it("returns test_task_due for any test_task job", () => {
    const job = makeJob({ status: "test_task", updatedAt: isoDaysAgo(0) });
    const r = checkReminder(job);
    expect(r).not.toBeNull();
    expect(r!.reason).toBe("test_task_due");
  });

  it("returns null for recent offer", () => {
    const job = makeJob({ status: "offer", updatedAt: isoDaysAgo(3) });
    expect(checkReminder(job)).toBeNull();
  });

  it("returns offer_expiring for offer older than 7 days", () => {
    const job = makeJob({ status: "offer", updatedAt: isoDaysAgo(8) });
    const r = checkReminder(job);
    expect(r).not.toBeNull();
    expect(r!.reason).toBe("offer_expiring");
  });

  it("returns null for rejected jobs", () => {
    const job = makeJob({
      status: "rejected_by_me",
      updatedAt: isoDaysAgo(20),
    });
    expect(checkReminder(job)).toBeNull();
  });

  it("returns null for blacklisted jobs", () => {
    const job = makeJob({ status: "blacklist", updatedAt: isoDaysAgo(30) });
    expect(checkReminder(job)).toBeNull();
  });

  it("includes title and companyName in result", () => {
    const job = makeJob({
      title: "CTO",
      companyName: "MegaCorp",
      status: "interview",
    });
    const r = checkReminder(job);
    expect(r!.title).toBe("CTO");
    expect(r!.companyName).toBe("MegaCorp");
    expect(r!.sourceUrl).toBe("https://hh.ru/vacancy/12345");
  });
});

// ── getReminders ──

describe("getReminders", () => {
  it("returns empty array for no jobs", () => {
    expect(getReminders([])).toEqual([]);
  });

  it("returns empty array when no jobs qualify", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "saved", updatedAt: isoDaysAgo(1) }),
      makeJob({ id: "hh_2", status: "applied", updatedAt: isoDaysAgo(5) }),
    ];
    expect(getReminders(jobs)).toEqual([]);
  });

  it("returns reminders sorted by priority", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "saved", updatedAt: isoDaysAgo(10) }),
      makeJob({ id: "hh_2", status: "offer", updatedAt: isoDaysAgo(8) }),
      makeJob({ id: "hh_3", status: "interview", updatedAt: isoDaysAgo(1) }),
    ];
    const reminders = getReminders(jobs);
    expect(reminders).toHaveLength(3);
    // offer_expiring > interview_pending > stale_saved
    expect(reminders[0].reason).toBe("offer_expiring");
    expect(reminders[1].reason).toBe("interview_pending");
    expect(reminders[2].reason).toBe("stale_saved");
  });

  it("within same reason, sorts by days since desc", () => {
    const jobs = [
      makeJob({ id: "hh_a", status: "saved", updatedAt: isoDaysAgo(20) }),
      makeJob({ id: "hh_b", status: "saved", updatedAt: isoDaysAgo(10) }),
    ];
    const reminders = getReminders(jobs);
    expect(reminders).toHaveLength(2);
    expect(reminders[0].daysSince).toBeGreaterThanOrEqual(
      reminders[1].daysSince,
    );
  });
});

// ── getDailySummary ──

describe("getDailySummary", () => {
  it("returns empty summary for no jobs", () => {
    const summary = getDailySummary([]);
    expect(summary.totalTracked).toBe(0);
    expect(summary.needsFollowUp).toBe(0);
    expect(summary.recentActivity).toEqual([]);
  });

  it("counts jobs by status", () => {
    const jobs = [
      makeJob({ id: "hh_a", status: "saved" }),
      makeJob({ id: "hh_b", status: "saved" }),
      makeJob({ id: "hh_c", status: "applied" }),
    ];
    const summary = getDailySummary(jobs);
    expect(summary.totalTracked).toBe(3);
    expect(summary.byStatus.saved).toBe(2);
    expect(summary.byStatus.applied).toBe(1);
  });

  it("counts active jobs (applied, hr_replied, interview, test_task)", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "applied" }),
      makeJob({ id: "hh_2", status: "interview" }),
      makeJob({ id: "hh_3", status: "test_task" }),
      makeJob({ id: "hh_4", status: "saved" }),
    ];
    const summary = getDailySummary(jobs);
    expect(summary.activeCount).toBe(3);
  });

  it("counts new jobs this week", () => {
    const jobs = [
      makeJob({
        id: "hh_1",
        firstSeenAt: new Date().toISOString(),
      }),
      makeJob({
        id: "hh_2",
        firstSeenAt: isoDaysAgo(10),
      }),
    ];
    const summary = getDailySummary(jobs);
    expect(summary.newThisWeek).toBe(1);
  });

  it("counts applied this week from status history", () => {
    const jobs = [
      makeJob({
        id: "hh_1",
        status: "applied",
        statusHistory: [
          {
            from: "saved",
            to: "applied",
            at: new Date().toISOString(),
            source: "user" as const,
          },
        ],
      }),
      makeJob({
        id: "hh_2",
        status: "applied",
        statusHistory: [
          {
            from: "saved",
            to: "applied",
            at: isoDaysAgo(10),
            source: "user" as const,
          },
        ],
      }),
    ];
    const summary = getDailySummary(jobs);
    expect(summary.appliedThisWeek).toBe(1);
  });

  it("counts needsFollowUp from reminders", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "interview", updatedAt: isoDaysAgo(1) }),
      makeJob({ id: "hh_2", status: "test_task", updatedAt: isoDaysAgo(2) }),
      makeJob({ id: "hh_3", status: "saved", updatedAt: isoDaysAgo(1) }),
    ];
    const summary = getDailySummary(jobs);
    // interview + test_task = 2 reminders, saved < 7 days = no reminder
    expect(summary.needsFollowUp).toBe(2);
  });

  it("includes recent activity from status history", () => {
    const jobs = [
      makeJob({
        id: "hh_1",
        status: "applied",
        statusHistory: [
          {
            from: "saved",
            to: "applied",
            at: new Date().toISOString(),
            source: "user" as const,
          },
        ],
      }),
    ];
    const summary = getDailySummary(jobs);
    expect(summary.recentActivity).toHaveLength(1);
    expect(summary.recentActivity[0].status).toBe("applied");
    expect(summary.recentActivity[0].title).toBe("Senior Developer");
  });

  it("limits recent activity to 10 entries", () => {
    const job = makeJob({ id: "hh_1", status: "saved" });
    for (let i = 0; i < 15; i++) {
      job.statusHistory.push({
        from: "saved",
        to: "applied",
        at: isoDaysAgo(i),
        source: "user",
      });
    }
    const summary = getDailySummary([job]);
    expect(summary.recentActivity.length).toBeLessThanOrEqual(10);
  });

  it("includes generatedAt timestamp", () => {
    const summary = getDailySummary([]);
    expect(summary.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
