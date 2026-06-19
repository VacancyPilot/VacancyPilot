// --- HH parser types ---

export type ParserSeverity = 'info' | 'warn';

export interface ParserWarning {
  field: string;
  message: string;
  severity: ParserSeverity;
}

/**
 * Raw vacancy data extracted from an HH.ru vacancy page.
 * Every field is nullable — the parser must not crash on missing data.
 */
export interface RawVacancyDTO {
  sourceVacancyId: string | null;
  sourceUrl: string;
  title: string | null;
  companyName: string | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  city: string | null;
  workMode: 'remote' | 'hybrid' | 'office' | 'unknown' | null;
  experienceRaw: string | null;
  employmentType: string | null;
  schedule: string | null;
  descriptionHtml: string | null;
  descriptionText: string | null;
  skills: string[] | null;
  extractedAt: string;
  selectorVersion: string;
  warnings: ParserWarning[];
}
