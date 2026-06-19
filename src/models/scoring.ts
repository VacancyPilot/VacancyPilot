import type { RiskFlag } from './risk';

export interface ScoringWeights {
  titleMatch: number; // 20
  mustHaveSkills: number; // 25
  niceToHaveSkills: number; // 10
  experienceFit: number; // 15
  workModeLocation: number; // 10
  salaryFit: number; // 10
  companyPreference: number; // 5
  languageScheduleMisc: number; // 5
}

export interface ScoreCap {
  reason: string;
  maxScore: number;
}

export interface ScoreResult {
  total: number;
  recommendation: 'apply' | 'consider' | 'skip';

  breakdown: {
    titleMatch: number;
    mustHaveSkills: number;
    niceToHaveSkills: number;
    experienceFit: number;
    workModeLocation: number;
    salaryFit: number;
    companyPreference: number;
    languageScheduleMisc: number;
  };

  fitReasons: string[];
  riskFlags: RiskFlag[];
  capsApplied?: ScoreCap[];
}
