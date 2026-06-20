import type { Job, JobStatus } from "@/models/job";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReminderReason =
  | "stale_saved"
  | "no_response"
  | "interview_pending"
  | "test_task_due"
  | "offer_expiring";

export interface ReminderItem {
  jobId: string;
  title: string;
  companyName: string;
  status: JobStatus;
  reason: ReminderReason;
  label: string;
  daysSince: number;
  sourceUrl: string;
}

export interface DailySummary {
  generatedAt: string;
  totalTracked: number;
  byStatus: Partial<Record<JobStatus, number>>;
  newThisWeek: number;
  appliedThisWeek: number;
  activeCount: number;
  needsFollowUp: number;
  recentActivity: ActivityEvent[];
}

export interface ActivityEvent {
  jobId: string;
  title: string;
  companyName: string;
  status: JobStatus;
  changedAt: string;
  daysAgo: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STALE_SAVED_DAYS = 7;
const NO_RESPONSE_DAYS = 14;
const OFFER_EXPIRING_DAYS = 7;

const REASON_LABELS: Record<ReminderReason, string> = {
  stale_saved: "No action in over a week",
  no_response: "No response from employer",
  interview_pending: "Interview stage — prepare",
  test_task_due: "Test task pending",
  offer_expiring: "Offer — decide soon",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function daysBetween(iso1: string, iso2: string): number {
  const d1 = new Date(iso1).getTime();
  const d2 = new Date(iso2).getTime();
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function daysAgo(iso: string): number {
  return daysBetween(iso, new Date().toISOString());
}

function startOfWeekISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start of week
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// ── Service ────────────────────────────────────────────────────────────────

/** Active pipeline statuses — jobs "in flight". */
const ACTIVE_STATUSES: JobStatus[] = [
  "applied",
  "hr_replied",
  "interview",
  "test_task",
];

/**
 * Determine if a job needs a follow-up reminder.
 * Pure function — no side effects, no DB access, no timers.
 * Returns a ReminderItem if the job qualifies, or null otherwise.
 */
export function checkReminder(job: Job): ReminderItem | null {
  const now = new Date().toISOString();
  const daysSinceUpdate = daysBetween(job.updatedAt, now);

  let reason: ReminderReason | null = null;

  // 1. Stale saved — no action on saved/letter_ready jobs for > 7 days
  if (
    (job.status === "saved" || job.status === "letter_ready") &&
    daysSinceUpdate > STALE_SAVED_DAYS
  ) {
    reason = "stale_saved";
  }

  // 2. No response — applied > 14 days, no employer reaction
  if (job.status === "applied" && daysSinceUpdate > NO_RESPONSE_DAYS) {
    reason = "no_response";
  }

  // 3. Interview pending — always needs attention
  if (job.status === "interview") {
    reason = "interview_pending";
  }

  // 4. Test task due — always needs attention
  if (job.status === "test_task") {
    reason = "test_task_due";
  }

  // 5. Offer expiring — offer received > 7 days ago, prompt decision
  if (job.status === "offer" && daysSinceUpdate > OFFER_EXPIRING_DAYS) {
    reason = "offer_expiring";
  }

  if (!reason) return null;

  return {
    jobId: job.id,
    title: job.title,
    companyName: job.companyName,
    status: job.status,
    reason,
    label: REASON_LABELS[reason],
    daysSince: daysSinceUpdate,
    sourceUrl: job.sourceUrl,
  };
}

/**
 * Get all follow-up reminders from a list of jobs.
 * Sorted by urgency (most stale first, then by reason priority).
 */
export function getReminders(jobs: Job[]): ReminderItem[] {
  const reasonPriority: Record<ReminderReason, number> = {
    offer_expiring: 0,
    test_task_due: 1,
    interview_pending: 2,
    no_response: 3,
    stale_saved: 4,
  };

  return jobs
    .map(checkReminder)
    .filter((r): r is ReminderItem => r !== null)
    .sort((a, b) => {
      const pa = reasonPriority[a.reason] ?? 5;
      const pb = reasonPriority[b.reason] ?? 5;
      if (pa !== pb) return pa - pb;
      return b.daysSince - a.daysSince;
    });
}

/**
 * Build a daily summary from the local job list.
 * Pure computation — no side effects.
 */
export function getDailySummary(jobs: Job[]): DailySummary {
  const weekStart = startOfWeekISO();
  const now = new Date().toISOString();

  // By status counts
  const byStatus: Partial<Record<JobStatus, number>> = {};
  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
  }

  // New this week
  let newThisWeek = 0;
  let appliedThisWeek = 0;

  for (const job of jobs) {
    if (job.firstSeenAt >= weekStart) newThisWeek++;

    // Check status history for "applied" transitions this week
    const appliedChange = job.statusHistory.find(
      (c) => c.to === "applied" && c.at >= weekStart,
    );
    if (appliedChange) appliedThisWeek++;
  }

  // Active count
  const activeCount = jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length;

  // Needs follow-up
  const needsFollowUp = getReminders(jobs).length;

  // Recent activity (last 10 status changes across all jobs, newest first)
  const allChanges: ActivityEvent[] = [];
  for (const job of jobs) {
    for (const change of job.statusHistory) {
      allChanges.push({
        jobId: job.id,
        title: job.title,
        companyName: job.companyName,
        status: change.to,
        changedAt: change.at,
        daysAgo: daysAgo(change.at),
      });
    }
  }
  allChanges.sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  const recentActivity = allChanges.slice(0, 10);

  return {
    generatedAt: now,
    totalTracked: jobs.length,
    byStatus,
    newThisWeek,
    appliedThisWeek,
    activeCount,
    needsFollowUp,
    recentActivity,
  };
}
