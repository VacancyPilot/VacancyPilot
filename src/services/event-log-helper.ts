import type { EventLog, EventLogType } from '@/models/event-log';

/**
 * Create a local EventLog entry.
 *
 * Payload preview is minimal — full event data belongs to other tables.
 * n8n fields default to false/undefined until the n8n module is integrated.
 */
export function createEventLogEntry(
  type: EventLogType,
  payload: Record<string, unknown>,
  opts?: { jobId?: string; applicationId?: string },
): EventLog {
  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    jobId: opts?.jobId,
    applicationId: opts?.applicationId,
    payloadPreview: payload,
    sentToN8n: false,
    createdAt: new Date().toISOString(),
  };
}
