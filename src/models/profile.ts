import type { CoverLetterMode } from './cover-letter';
import type { ScoringWeights } from './scoring';

export interface CoverLetterConstraints {
  noEmoji: boolean;
  noMarkdown: boolean;
  noSpecialChars: boolean;
  maxChars?: 500 | 1000;
}

export interface LetterPrefs {
  defaultMode: CoverLetterMode;
  defaultConstraints: CoverLetterConstraints;
}

export interface Profile {
  id: string;
  name: string;
  summary: string;

  targetTitles: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  avoidKeywords: string[];

  preferredWorkModes: ('remote' | 'hybrid' | 'office')[];
  preferredCities?: string[];

  salaryExpectationMin?: number;
  salaryCurrency?: string;

  defaultResumeId?: string;
  letterPrefs: LetterPrefs;

  scoringWeights?: Partial<ScoringWeights>;

  createdAt: string;
  updatedAt: string;
}
