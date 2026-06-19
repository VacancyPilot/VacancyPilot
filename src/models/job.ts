// --- Job status and lifecycle types ---

export type JobStatus =
  | 'new'
  | 'viewed'
  | 'saved'
  | 'rejected_by_me'
  | 'letter_ready'
  | 'applied'
  | 'hr_replied'
  | 'interview'
  | 'test_task'
  | 'rejected_by_company'
  | 'offer'
  | 'blacklist';

export interface StatusChange {
  from?: JobStatus;
  to: JobStatus;
  at: string;
  source: 'user' | 'passive_hh_sync' | 'import' | 'system';
  note?: string;
}

export interface PassiveHHStatus {
  detectedApplied?: boolean;
  detectedViewedByEmployer?: boolean;
  detectedInvitation?: boolean;
  detectedRejected?: boolean;
  rawLabel?: string;
  detectedAt: string;
}

// --- Domain models referenced by Job ---
import type { ScoreResult } from './scoring';
import type { AIAnalysis } from './ai';

export interface Job {
  id: string; // "hh_123456"
  source: 'hh';
  sourceVacancyId: string;
  sourceUrl: string;
  canonicalUrl?: string;

  title: string;
  companyId: string;
  companyName: string;

  salaryRaw?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryGross?: boolean;

  city?: string;
  workMode: 'remote' | 'hybrid' | 'office' | 'unknown';
  experienceRaw?: string;
  experienceMinYears?: number;
  employmentType?: string;
  schedule?: string;

  descriptionClean: string;
  descriptionHash: string;
  skills: string[];

  status: JobStatus;
  statusHistory: StatusChange[];

  ruleScore?: ScoreResult;
  aiAnalysis?: AIAnalysis;

  recommendedProfileIds?: string[];
  selectedProfileId?: string;
  selectedResumeId?: string;
  coverLetterId?: string;

  passiveHHStatus?: PassiveHHStatus;

  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;

  debugHtmlRedacted?: string;
}
