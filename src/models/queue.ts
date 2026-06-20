// --- Queue task-list model ---

import type { Job, JobStatus } from "./job";

/** Workflow stage derived from job status. */
export type QueueStage =
  | "todo"
  | "in_progress"
  | "waiting"
  | "done"
  | "archived";

/** Task priority derived from scoring. */
export type TaskPriority = "high" | "medium" | "low";

/**
 * A queue task is a view-model wrapping a Job with derived queue-specific
 * fields. No separate persistence — the queue is a filtered and annotated
 * view of the jobs table.
 */
export interface QueueTask {
  /** The underlying job id (hh_123456). */
  jobId: string;

  /** The job snapshot. */
  job: Job;

  /** Derived workflow stage from job.status. */
  stage: QueueStage;

  /** Derived priority from ruleScore or fallback heuristics. */
  priority: TaskPriority;

  /** Suggested next user action, derived from current status. */
  nextAction: string;

  /** Days since the job was last seen or updated. */
  daysSinceUpdate: number;

  /** Whether this job has a cover letter ready. */
  hasCoverLetter: boolean;

  /** Whether the user has selected a profile for this job. */
  hasProfile: boolean;

  /** Company status if known (from company repo). */
  companyStatus?: "normal" | "greylist" | "blacklist";
}

/** Map JobStatus to QueueStage. */
export function statusToStage(status: JobStatus): QueueStage {
  switch (status) {
    case "new":
    case "viewed":
      return "todo";
    case "saved":
    case "letter_ready":
      return "in_progress";
    case "applied":
    case "hr_replied":
    case "interview":
    case "test_task":
      return "waiting";
    case "offer":
    case "rejected_by_me":
    case "rejected_by_company":
      return "done";
    case "blacklist":
      return "archived";
  }
}

/** User-facing labels for each stage. */
export const STAGE_LABELS: Record<QueueStage, string> = {
  todo: "To Decide",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
  archived: "Archived",
};

/** Next-action descriptions by status. */
export function statusNextAction(status: JobStatus): string {
  switch (status) {
    case "new":
    case "viewed":
      return "Review and decide";
    case "saved":
      return "Write cover letter";
    case "letter_ready":
      return "Apply to vacancy";
    case "applied":
      return "Wait for response";
    case "hr_replied":
      return "Reply to HR";
    case "interview":
      return "Prepare for interview";
    case "test_task":
      return "Complete test task";
    case "offer":
      return "Review offer";
    case "rejected_by_me":
      return "Archived — you rejected";
    case "rejected_by_company":
      return "Archived — company rejected";
    case "blacklist":
      return "Blacklisted";
  }
}

/** Derive priority from ruleScore total. */
export function scoreToPriority(total: number | undefined): TaskPriority {
  if (total === undefined) return "medium";
  if (total >= 70) return "high";
  if (total >= 40) return "medium";
  return "low";
}
