/**
 * Queue task-list service — ITER-037.
 *
 * Builds queue tasks from jobs, supports grouping/filtering/sorting.
 * The queue is a read-only view on top of the jobs table — no separate
 * persistence for queue state.
 *
 * All logic is local and synchronous; DB access happens in callers.
 */

import type { Job } from "@/models/job";
import type { QueueTask, QueueStage, TaskPriority } from "@/models/queue";
import {
  statusToStage,
  statusNextAction,
  scoreToPriority,
  STAGE_LABELS,
} from "@/models/queue";

// ── Build queue tasks ────────────────────────────────────────────────────────

/**
 * Convert a job into a queue task with derived fields.
 */
export function jobToQueueTask(
  job: Job,
  companyStatus?: "normal" | "greylist" | "blacklist",
): QueueTask {
  const now = Date.now();
  const updatedAt = new Date(job.updatedAt).getTime();
  const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));

  return {
    jobId: job.id,
    job,
    stage: statusToStage(job.status),
    priority: scoreToPriority(job.ruleScore?.total),
    nextAction: statusNextAction(job.status),
    daysSinceUpdate,
    hasCoverLetter: job.coverLetterId !== undefined,
    hasProfile: job.selectedProfileId !== undefined,
    companyStatus,
  };
}

/**
 * Build queue tasks from an array of jobs.
 * Excludes blacklisted jobs by default.
 *
 * @param jobs     - Array of Job domain objects.
 * @param options  - includeArchived: include blacklisted jobs.
 *                   companyMap: Map of companyId to Company for status enrichment.
 */
export function buildQueueTasks(
  jobs: Job[],
  options?: {
    includeArchived?: boolean;
    companyMap?: Map<string, { status: "normal" | "greylist" | "blacklist" }>;
  },
): QueueTask[] {
  const filtered = options?.includeArchived
    ? jobs
    : jobs.filter((j) => j.status !== "blacklist");

  return filtered.map((job) => {
    const companyStatus = options?.companyMap?.get(job.companyId)?.status;
    return jobToQueueTask(job, companyStatus);
  });
}

// ── Grouping ─────────────────────────────────────────────────────────────────

/** A group of tasks by stage. */
export interface TaskGroup {
  stage: QueueStage;
  label: string;
  tasks: QueueTask[];
  count: number;
}

/**
 * Group queue tasks by their workflow stage.
 * Order: todo → in_progress → waiting → done → archived.
 */
export function groupByStage(tasks: QueueTask[]): TaskGroup[] {
  const stageOrder: QueueStage[] = [
    "todo",
    "in_progress",
    "waiting",
    "done",
    "archived",
  ];

  const groups = new Map<QueueStage, QueueTask[]>();
  for (const stage of stageOrder) {
    groups.set(stage, []);
  }

  for (const task of tasks) {
    groups.get(task.stage)?.push(task);
  }

  return stageOrder
    .filter((stage) => {
      const group = groups.get(stage);
      return group && group.length > 0;
    })
    .map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      tasks: groups.get(stage)!,
      count: groups.get(stage)!.length,
    }));
}

// ── Filtering ────────────────────────────────────────────────────────────────

export interface QueueFilter {
  /** Only show tasks with this priority level. */
  priority?: TaskPriority;
  /** Only show tasks at this stage. */
  stage?: QueueStage;
  /** Only show tasks for this company (by name substring match). */
  companySearch?: string;
  /** Only show tasks with title matching this substring. */
  titleSearch?: string;
  /** Only show tasks that need the user's attention (next action pending). */
  actionableOnly?: boolean;
  /** Only show tasks for companies with this status (greylist/blacklist/normal). */
  companyStatus?: "greylist" | "blacklist" | "normal";
}

/**
 * Apply filters to queue tasks.
 */
export function filterQueueTasks(
  tasks: QueueTask[],
  filter: QueueFilter,
): QueueTask[] {
  let result = tasks;

  if (filter.priority) {
    result = result.filter((t) => t.priority === filter.priority);
  }

  if (filter.stage) {
    result = result.filter((t) => t.stage === filter.stage);
  }

  if (filter.companySearch) {
    const q = filter.companySearch.toLowerCase();
    result = result.filter((t) => t.job.companyName.toLowerCase().includes(q));
  }

  if (filter.titleSearch) {
    const q = filter.titleSearch.toLowerCase();
    result = result.filter((t) => t.job.title.toLowerCase().includes(q));
  }

  if (filter.actionableOnly) {
    result = result.filter(
      (t) => t.stage === "todo" || t.stage === "in_progress",
    );
  }

  if (filter.companyStatus) {
    result = result.filter((t) => t.companyStatus === filter.companyStatus);
  }

  return result;
}

// ── Sorting ──────────────────────────────────────────────────────────────────

export type QueueSortField =
  | "priority"
  | "score"
  | "updatedAt"
  | "title"
  | "company";
export type SortDirection = "asc" | "desc";

export interface QueueSort {
  field: QueueSortField;
  direction: SortDirection;
}

/**
 * Sort queue tasks by the given criteria.
 */
export function sortQueueTasks(
  tasks: QueueTask[],
  sort: QueueSort,
): QueueTask[] {
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    let cmp = 0;

    switch (sort.field) {
      case "priority": {
        const order = { high: 0, medium: 1, low: 2 };
        cmp = order[a.priority] - order[b.priority];
        break;
      }
      case "score": {
        const scoreA = a.job.ruleScore?.total ?? -1;
        const scoreB = b.job.ruleScore?.total ?? -1;
        cmp = scoreA - scoreB; // ascending by raw value, direction handles order
        break;
      }
      case "updatedAt": {
        cmp = a.job.updatedAt.localeCompare(b.job.updatedAt);
        break;
      }
      case "title": {
        cmp = a.job.title.localeCompare(b.job.title, undefined, {
          sensitivity: "base",
        });
        break;
      }
      case "company": {
        cmp = a.job.companyName.localeCompare(b.job.companyName, undefined, {
          sensitivity: "base",
        });
        break;
      }
    }

    return sort.direction === "desc" ? -cmp : cmp;
  });

  return sorted;
}

// ── Statistics ───────────────────────────────────────────────────────────────

export interface QueueStats {
  totalTasks: number;
  actionableCount: number;
  highPriorityCount: number;
  byStage: Record<QueueStage, number>;
}

/**
 * Compute summary statistics for a set of queue tasks.
 */
export function computeQueueStats(tasks: QueueTask[]): QueueStats {
  const byStage: Record<QueueStage, number> = {
    todo: 0,
    in_progress: 0,
    waiting: 0,
    done: 0,
    archived: 0,
  };

  let actionableCount = 0;
  let highPriorityCount = 0;

  for (const task of tasks) {
    byStage[task.stage]++;
    if (task.stage === "todo" || task.stage === "in_progress") {
      actionableCount++;
    }
    if (task.priority === "high") {
      highPriorityCount++;
    }
  }

  return {
    totalTasks: tasks.length,
    actionableCount,
    highPriorityCount,
    byStage,
  };
}
