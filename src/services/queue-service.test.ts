/**
 * Queue service tests — ITER-037.
 */

import { describe, it, expect } from "vitest";
import type { Job } from "@/models/job";
import type { QueueTask } from "@/models/queue";
import { createStatusChange } from "./status-transitions";
import {
  jobToQueueTask,
  buildQueueTasks,
  groupByStage,
  filterQueueTasks,
  sortQueueTasks,
  computeQueueStats,
  type QueueFilter,
  type QueueSort,
} from "./queue-service";

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
    ruleScore: {
      total: 65,
      recommendation: "consider",
      breakdown: {
        titleMatch: 15,
        mustHaveSkills: 20,
        niceToHaveSkills: 5,
        experienceFit: 10,
        workModeLocation: 5,
        salaryFit: 5,
        companyPreference: 3,
        languageScheduleMisc: 2,
      },
      fitReasons: ["Good match"],
      riskFlags: [],
    },
    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ── jobToQueueTask ───────────────────────────────────────────────────────────

describe("jobToQueueTask", () => {
  it("converts a saved job to a task with correct stage", () => {
    const job = makeJob({ status: "saved" });
    const task = jobToQueueTask(job);

    expect(task.jobId).toBe(job.id);
    expect(task.stage).toBe("in_progress");
    expect(task.priority).toBe("medium"); // score 65 → medium (40-69)
    expect(task.nextAction).toBe("Write cover letter");
    expect(task.job).toBe(job);
  });

  it("maps viewed status to todo stage", () => {
    const job = makeJob({ status: "viewed" });
    const task = jobToQueueTask(job);
    expect(task.stage).toBe("todo");
    expect(task.nextAction).toBe("Review and decide");
  });

  it("maps applied status to waiting stage", () => {
    const job = makeJob({ status: "applied" });
    const task = jobToQueueTask(job);
    expect(task.stage).toBe("waiting");
    expect(task.nextAction).toBe("Wait for response");
  });

  it("maps offer status to done stage", () => {
    const job = makeJob({ status: "offer" });
    const task = jobToQueueTask(job);
    expect(task.stage).toBe("done");
  });

  it("maps blacklist status to archived stage", () => {
    const job = makeJob({ status: "blacklist" });
    const task = jobToQueueTask(job);
    expect(task.stage).toBe("archived");
  });

  it("prioritizes high score as high priority", () => {
    const job = makeJob({
      ruleScore: {
        total: 85,
        recommendation: "apply",
        breakdown: {
          titleMatch: 18,
          mustHaveSkills: 25,
          niceToHaveSkills: 10,
          experienceFit: 12,
          workModeLocation: 8,
          salaryFit: 7,
          companyPreference: 3,
          languageScheduleMisc: 2,
        },
        fitReasons: [],
        riskFlags: [],
      },
    });
    const task = jobToQueueTask(job);
    expect(task.priority).toBe("high");
  });

  it("prioritizes low score as low priority", () => {
    const job = makeJob({
      ruleScore: {
        total: 20,
        recommendation: "skip",
        breakdown: {
          titleMatch: 5,
          mustHaveSkills: 5,
          niceToHaveSkills: 0,
          experienceFit: 0,
          workModeLocation: 5,
          salaryFit: 3,
          companyPreference: 1,
          languageScheduleMisc: 1,
        },
        fitReasons: [],
        riskFlags: [],
      },
    });
    const task = jobToQueueTask(job);
    expect(task.priority).toBe("low");
  });

  it("marks cover letter and profile flags", () => {
    const job = makeJob({
      coverLetterId: "letter_1",
      selectedProfileId: "profile_1",
    });
    const task = jobToQueueTask(job);
    expect(task.hasCoverLetter).toBe(true);
    expect(task.hasProfile).toBe(true);
  });

  it("computes daysSinceUpdate", () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const job = makeJob({ updatedAt: threeDaysAgo.toISOString() });
    const task = jobToQueueTask(job);
    expect(task.daysSinceUpdate).toBeGreaterThanOrEqual(2);
    expect(task.daysSinceUpdate).toBeLessThanOrEqual(4);
  });
});

// ── buildQueueTasks ──────────────────────────────────────────────────────────

describe("buildQueueTasks", () => {
  it("excludes blacklisted jobs by default", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "saved" }),
      makeJob({ id: "hh_2", status: "blacklist" }),
    ];
    const tasks = buildQueueTasks(jobs);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].jobId).toBe("hh_1");
  });

  it("includes blacklisted jobs when includeArchived is true", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "saved" }),
      makeJob({ id: "hh_2", status: "blacklist" }),
    ];
    const tasks = buildQueueTasks(jobs, { includeArchived: true });
    expect(tasks).toHaveLength(2);
  });

  it("enriches tasks with company status from companyMap", () => {
    const jobs = [
      makeJob({ id: "hh_1", companyId: "hh_co_a" }),
      makeJob({ id: "hh_2", companyId: "hh_co_b" }),
      makeJob({ id: "hh_3", companyId: "hh_co_c" }),
    ];
    const companyMap = new Map([
      ["hh_co_a", { status: "greylist" as const }],
      ["hh_co_b", { status: "blacklist" as const }],
    ]);
    const tasks = buildQueueTasks(jobs, { companyMap });
    expect(tasks).toHaveLength(3);
    expect(tasks[0].companyStatus).toBe("greylist");
    expect(tasks[1].companyStatus).toBe("blacklist");
    expect(tasks[2].companyStatus).toBeUndefined();
  });
});

// ── groupByStage ─────────────────────────────────────────────────────────────

describe("groupByStage", () => {
  it("groups tasks by stage in correct order", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "viewed" }), // todo
      makeJob({ id: "hh_2", status: "saved" }), // in_progress
      makeJob({ id: "hh_3", status: "applied" }), // waiting
    ];
    const tasks = buildQueueTasks(jobs);
    const groups = groupByStage(tasks);

    expect(groups).toHaveLength(3);
    expect(groups[0].stage).toBe("todo");
    expect(groups[1].stage).toBe("in_progress");
    expect(groups[2].stage).toBe("waiting");
  });

  it("excludes empty stages", () => {
    const jobs = [makeJob({ id: "hh_1", status: "saved" })];
    const tasks = buildQueueTasks(jobs);
    const groups = groupByStage(tasks);

    expect(groups).toHaveLength(1);
    expect(groups[0].stage).toBe("in_progress");
  });

  it("returns empty for empty input", () => {
    expect(groupByStage([])).toEqual([]);
  });
});

// ── filterQueueTasks ─────────────────────────────────────────────────────────

describe("filterQueueTasks", () => {
  function makeTask(
    id: string,
    overrides: {
      status?: string;
      score?: number;
      company?: string;
      title?: string;
      companyStatus?: "normal" | "greylist" | "blacklist";
    } = {},
  ): QueueTask {
    const job = makeJob({
      id,
      ...(overrides.status
        ? { status: overrides.status as Job["status"] }
        : {}),
      ...(overrides.score !== undefined
        ? {
            ruleScore: {
              total: overrides.score,
              recommendation: "consider",
              breakdown: {
                titleMatch: 0,
                mustHaveSkills: 0,
                niceToHaveSkills: 0,
                experienceFit: 0,
                workModeLocation: 0,
                salaryFit: 0,
                companyPreference: 0,
                languageScheduleMisc: 0,
              },
              fitReasons: [],
              riskFlags: [],
            },
          }
        : {}),
      ...(overrides.company ? { companyName: overrides.company } : {}),
      ...(overrides.title ? { title: overrides.title } : {}),
    });
    return jobToQueueTask(job, overrides.companyStatus);
  }

  it("filters by priority", () => {
    const tasks = [
      makeTask("hh_1", { score: 85 }), // high
      makeTask("hh_2", { score: 50 }), // medium
      makeTask("hh_3", { score: 20 }), // low
    ];

    const filter: QueueFilter = { priority: "high" };
    const result = filterQueueTasks(tasks, filter);

    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe("hh_1");
  });

  it("filters by stage", () => {
    const tasks = [
      makeTask("hh_1", { status: "viewed" }), // todo
      makeTask("hh_2", { status: "saved" }), // in_progress
    ];

    const filter: QueueFilter = { stage: "todo" };
    const result = filterQueueTasks(tasks, filter);

    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe("hh_1");
  });

  it("filters by company search", () => {
    const tasks = [
      makeTask("hh_1", { company: "Acme Corp" }),
      makeTask("hh_2", { company: "Beta Inc" }),
    ];

    const filter: QueueFilter = { companySearch: "acme" };
    const result = filterQueueTasks(tasks, filter);

    expect(result).toHaveLength(1);
    expect(result[0].job.companyName).toBe("Acme Corp");
  });

  it("filters by title search", () => {
    const tasks = [
      makeTask("hh_1", { title: "Frontend Developer" }),
      makeTask("hh_2", { title: "DevOps Engineer" }),
    ];

    const filter: QueueFilter = { titleSearch: "frontend" };
    const result = filterQueueTasks(tasks, filter);

    expect(result).toHaveLength(1);
    expect(result[0].job.title).toBe("Frontend Developer");
  });

  it("filters actionable only", () => {
    const tasks = [
      makeTask("hh_1", { status: "viewed" }), // todo
      makeTask("hh_2", { status: "saved" }), // in_progress
      makeTask("hh_3", { status: "applied" }), // waiting
      makeTask("hh_4", { status: "offer" }), // done
    ];

    const filter: QueueFilter = { actionableOnly: true };
    const result = filterQueueTasks(tasks, filter);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.jobId).sort()).toEqual(["hh_1", "hh_2"]);
  });

  it("combines multiple filters", () => {
    const tasks = [
      makeTask("hh_1", { status: "saved", score: 85, company: "Acme" }),
      makeTask("hh_2", { status: "saved", score: 40, company: "Acme" }),
      makeTask("hh_3", { status: "saved", score: 85, company: "Beta" }),
    ];

    const filter: QueueFilter = {
      stage: "in_progress",
      priority: "high",
      companySearch: "acme",
    };
    const result = filterQueueTasks(tasks, filter);

    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe("hh_1");
  });

  it("returns all tasks with empty filter", () => {
    const tasks = [makeTask("hh_1"), makeTask("hh_2")];

    const result = filterQueueTasks(tasks, {});
    expect(result).toHaveLength(2);
  });

  it("filters by company status", () => {
    const tasks = [
      makeTask("hh_1", { companyStatus: "greylist" }),
      makeTask("hh_2", { companyStatus: "normal" }),
      makeTask("hh_3", { companyStatus: "blacklist" }),
      makeTask("hh_4", { companyStatus: undefined }),
    ];

    const greylisted = filterQueueTasks(tasks, { companyStatus: "greylist" });
    expect(greylisted).toHaveLength(1);
    expect(greylisted[0].jobId).toBe("hh_1");

    const blacklisted = filterQueueTasks(tasks, { companyStatus: "blacklist" });
    expect(blacklisted).toHaveLength(1);
    expect(blacklisted[0].jobId).toBe("hh_3");
  });
});

// ── sortQueueTasks ───────────────────────────────────────────────────────────

describe("sortQueueTasks", () => {
  function makeTask(
    id: string,
    overrides: {
      status?: string;
      score?: number;
      title?: string;
      company?: string;
      updatedAt?: string;
    } = {},
  ): QueueTask {
    const job = makeJob({
      id,
      ...(overrides.status
        ? { status: overrides.status as Job["status"] }
        : {}),
      ...(overrides.score !== undefined
        ? {
            ruleScore: {
              total: overrides.score,
              recommendation: "consider",
              breakdown: {
                titleMatch: 0,
                mustHaveSkills: 0,
                niceToHaveSkills: 0,
                experienceFit: 0,
                workModeLocation: 0,
                salaryFit: 0,
                companyPreference: 0,
                languageScheduleMisc: 0,
              },
              fitReasons: [],
              riskFlags: [],
            },
          }
        : {}),
      ...(overrides.title ? { title: overrides.title } : {}),
      ...(overrides.company ? { companyName: overrides.company } : {}),
      ...(overrides.updatedAt ? { updatedAt: overrides.updatedAt } : {}),
    });
    return jobToQueueTask(job);
  }

  it("sorts by priority ascending (high first)", () => {
    const tasks = [
      makeTask("hh_1", { score: 20 }), // low
      makeTask("hh_2", { score: 85 }), // high
      makeTask("hh_3", { score: 50 }), // medium
    ];

    const sort: QueueSort = { field: "priority", direction: "asc" };
    const result = sortQueueTasks(tasks, sort);

    expect(result[0].priority).toBe("high");
    expect(result[1].priority).toBe("medium");
    expect(result[2].priority).toBe("low");
  });

  it("sorts by score descending (high score first)", () => {
    const tasks = [
      makeTask("hh_1", { score: 20 }),
      makeTask("hh_2", { score: 85 }),
    ];

    const sort: QueueSort = { field: "score", direction: "desc" };
    const result = sortQueueTasks(tasks, sort);

    expect(result[0].job.ruleScore?.total).toBe(85);
    expect(result[1].job.ruleScore?.total).toBe(20);
  });

  it("sorts by title alphabetically", () => {
    const tasks = [
      makeTask("hh_1", { title: "Zebra Developer" }),
      makeTask("hh_2", { title: "Alpha Developer" }),
    ];

    const sort: QueueSort = { field: "title", direction: "asc" };
    const result = sortQueueTasks(tasks, sort);

    expect(result[0].job.title).toBe("Alpha Developer");
    expect(result[1].job.title).toBe("Zebra Developer");
  });

  it("sorts by company alphabetically", () => {
    const tasks = [
      makeTask("hh_1", { company: "Beta" }),
      makeTask("hh_2", { company: "Alpha" }),
    ];

    const sort: QueueSort = { field: "company", direction: "asc" };
    const result = sortQueueTasks(tasks, sort);

    expect(result[0].job.companyName).toBe("Alpha");
    expect(result[1].job.companyName).toBe("Beta");
  });

  it("sorts by updatedAt", () => {
    const tasks = [
      makeTask("hh_1", { updatedAt: "2025-01-01T00:00:00.000Z" }),
      makeTask("hh_2", { updatedAt: "2025-03-01T00:00:00.000Z" }),
    ];

    const sort: QueueSort = { field: "updatedAt", direction: "asc" };
    const result = sortQueueTasks(tasks, sort);

    expect(result[0].jobId).toBe("hh_1");
    expect(result[1].jobId).toBe("hh_2");
  });

  it("does not mutate original array", () => {
    const tasks = [makeTask("hh_1"), makeTask("hh_2")];
    const original = [...tasks];

    const sort: QueueSort = { field: "priority", direction: "desc" };
    sortQueueTasks(tasks, sort);

    expect(tasks).toEqual(original);
  });
});

// ── computeQueueStats ────────────────────────────────────────────────────────

describe("computeQueueStats", () => {
  it("computes stats for empty list", () => {
    const stats = computeQueueStats([]);
    expect(stats.totalTasks).toBe(0);
    expect(stats.actionableCount).toBe(0);
    expect(stats.highPriorityCount).toBe(0);
  });

  it("computes stats for mixed tasks", () => {
    const jobs = [
      makeJob({ id: "hh_1", status: "viewed" }), // todo, actionable
      makeJob({
        id: "hh_2",
        status: "saved",
        ruleScore: {
          total: 85,
          recommendation: "apply",
          breakdown: {
            titleMatch: 18,
            mustHaveSkills: 25,
            niceToHaveSkills: 10,
            experienceFit: 12,
            workModeLocation: 8,
            salaryFit: 7,
            companyPreference: 3,
            languageScheduleMisc: 2,
          },
          fitReasons: [],
          riskFlags: [],
        },
      }), // in_progress, actionable, high
      makeJob({ id: "hh_3", status: "applied" }), // waiting
    ];
    const tasks = buildQueueTasks(jobs);
    const stats = computeQueueStats(tasks);

    expect(stats.totalTasks).toBe(3);
    expect(stats.actionableCount).toBe(2); // viewed + saved
    expect(stats.highPriorityCount).toBe(1); // only score 85
    expect(stats.byStage.todo).toBe(1);
    expect(stats.byStage.in_progress).toBe(1);
    expect(stats.byStage.waiting).toBe(1);
    expect(stats.byStage.done).toBe(0);
  });
});
