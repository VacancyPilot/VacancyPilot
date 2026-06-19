export type EventLogType =
  | 'job_saved'
  | 'status_changed'
  | 'letter_generated'
  | 'ai_analysis_requested'
  | 'ai_analysis_completed'
  | 'application_status_saved'
  | 'strong_job_found'
  | 'daily_summary'
  | 'hr_replied';

export interface EventLog {
  id: string;

  type: EventLogType;

  jobId?: string;
  applicationId?: string;

  payloadPreview: Record<string, unknown>;

  sentToN8n: boolean;
  n8nStatus?: 'pending' | 'sent' | 'failed';
  n8nError?: string;

  createdAt: string;
}
