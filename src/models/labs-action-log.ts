export type LabsActionType =
  | 'guided_apply_started'
  | 'guided_apply_step'
  | 'guided_apply_completed'
  | 'guided_apply_aborted'
  | 'resume_recommended'
  | 'field_highlighted';

export interface LabsActionLog {
  id: string;
  type: LabsActionType;
  tabId?: number;
  vacancyUrl?: string;
  jobId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}
