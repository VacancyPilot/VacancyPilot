import type { RiskFlag } from './risk';
import type { CoverLetterMode, CoverLetterConstraints } from './cover-letter';

export interface AIAnalysis {
  id: string;
  jobId: string;
  profileId: string;
  resumeId?: string;

  provider: 'openai' | 'deepseek' | 'openrouter' | 'mock';
  model: string;
  promptVersion: string;
  inputHash: string;

  fitScore: number;
  recommendation: 'apply' | 'consider' | 'skip';
  confidence: 'low' | 'medium' | 'high';

  fitReasons: string[];
  riskFlags: RiskFlag[];
  missingSkills: string[];
  questionsForHR: string[];
  suggestedProfileId?: string;
  suggestedResumeId?: string;

  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
  };

  createdAt: string;
}

export interface AIRequestCache {
  id: string;
  kind: 'vacancy_analysis' | 'cover_letter';
  inputHash: string;
  provider: string;
  model: string;
  promptVersion: string;
  resultRefId: string;
  createdAt: string;
  expiresAt?: string;
}

// --- AI provider input contracts ---

export interface VacancyAnalysisInput {
  job: {
    title: string;
    company: string;
    salaryRaw?: string;
    city?: string;
    workMode: string;
    experienceRaw?: string;
    skills: string[];
    descriptionClean: string;
  };
  profile: {
    summary: string;
    targetTitles: string[];
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
  };
  resumeHighlights?: string;
  strictPrivacy: boolean;
}

export interface CoverLetterInput {
  job: {
    title: string;
    company: string;
    topRequirements: string;
    skills: string[];
  };
  profile: {
    summary: string;
  };
  resumeHighlights: string;
  mode: CoverLetterMode;
  constraints: CoverLetterConstraints;
  language: 'ru' | 'en' | 'ro';
}

export interface LLMProvider {
  id: 'openai' | 'deepseek' | 'openrouter' | 'mock';
  analyzeVacancy(input: VacancyAnalysisInput): Promise<AIAnalysis>;
  generateCoverLetter(input: CoverLetterInput): Promise<string>;
}
