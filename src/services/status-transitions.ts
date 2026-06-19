import type { JobStatus, StatusChange } from '@/models/job';

/**
 * Ordered statuses — used for display ordering, not as a strict FSM.
 * The tracker allows any status transition; this list is for UI sorting.
 */
export const STATUS_ORDER: readonly JobStatus[] = [
  'new',
  'viewed',
  'saved',
  'letter_ready',
  'applied',
  'hr_replied',
  'interview',
  'test_task',
  'offer',
  'rejected_by_me',
  'rejected_by_company',
  'blacklist',
];

/**
 * Create a StatusChange entry for status history.
 * Pure function — no side effects, no timers except Date.now().
 */
export function createStatusChange(
  from: JobStatus | undefined,
  to: JobStatus,
  source: StatusChange['source'] = 'user',
  note?: string,
): StatusChange {
  return {
    from,
    to,
    at: new Date().toISOString(),
    source,
    note,
  };
}
