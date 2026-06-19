import type { JobStatus, StatusChange } from './job';

export interface Application {
  id: string;
  jobId: string;
  profileId?: string;
  resumeId?: string;
  coverLetterId?: string;

  channel: 'manual' | 'guided';
  appliedAt?: string;

  status: JobStatus;
  statusHistory: StatusChange[];

  followUpAt?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}
