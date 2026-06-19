/**
 * Payload preview — show the user exactly what will (and won't) be sent to AI.
 *
 * Section 12.4: before every AI request, display a summary of included/excluded fields.
 */

import type { VacancyAnalysisInput, CoverLetterInput } from '@/models/ai';

// ── Types ─────────────────────────────────────────────────────────────

export interface PayloadPreview {
  /** Which privacy mode is active. */
  mode: 'standard' | 'strict';
  /** Human-readable list of fields that WILL be sent. */
  includedFields: IncludedField[];
  /** Human-readable list of field names that will NOT be sent. */
  excludedFields: string[];
  /** Approximate character count of the payload. */
  totalChars: number;
}

export interface IncludedField {
  /** Field label (e.g., "title", "Навыки"). */
  label: string;
  /** Short description of the included value. */
  summary: string;
}

// ── Vacancy Analysis preview ──────────────────────────────────────────

/** Labels for Russian UI. English fallback uses the field key directly. */
const ANALYSIS_FIELD_LABELS: Record<string, string> = {
  title: 'Название вакансии',
  company: 'Компания',
  salaryRaw: 'Зарплата',
  city: 'Город',
  workMode: 'Формат работы',
  experienceRaw: 'Опыт',
  skills: 'Навыки',
  descriptionClean: 'Описание вакансии',
  profileSummary: 'Профиль — Summary',
  profileTargetTitles: 'Профиль — целевые должности',
  profileMustHaveSkills: 'Профиль — must-have навыки',
  profileNiceToHaveSkills: 'Профиль — nice-to-have навыки',
  resumeHighlights: 'Резюме — highlights',
};

/**
 * Generate a payload preview for a VacancyAnalysisInput.
 */
export function generateVacancyAnalysisPreview(
  input: VacancyAnalysisInput,
): PayloadPreview {
  const mode = input.strictPrivacy ? 'strict' : 'standard';
  const included: IncludedField[] = [];
  const excluded: string[] = [];
  let totalChars = 0;

  // ── Always-included structured fields ──────────────────────────────
  appendStructured(included, 'title', input.job.title);
  totalChars += input.job.title.length;

  appendStructured(included, 'company', input.job.company);
  totalChars += input.job.company.length;

  if (input.job.salaryRaw) {
    appendStructured(included, 'salaryRaw', input.job.salaryRaw);
    totalChars += input.job.salaryRaw.length;
  }

  if (input.job.city) {
    appendStructured(included, 'city', input.job.city);
    totalChars += input.job.city.length;
  }

  appendStructured(included, 'workMode', input.job.workMode);
  totalChars += input.job.workMode.length;

  if (input.job.experienceRaw) {
    appendStructured(included, 'experienceRaw', input.job.experienceRaw);
    totalChars += input.job.experienceRaw.length;
  }

  appendArrayField(included, 'skills', input.job.skills);
  totalChars += input.job.skills.join(', ').length;

  // ── Description — included only if non-empty ────────────────────────
  if (input.job.descriptionClean.length > 0) {
    appendStructured(included, 'descriptionClean', summarizeText(input.job.descriptionClean));
    totalChars += input.job.descriptionClean.length;
  } else {
    excluded.push(label('descriptionClean'));
  }

  // ── Profile fields (always included) ────────────────────────────────
  appendStructured(included, 'profileSummary', summarizeText(input.profile.summary));
  totalChars += input.profile.summary.length;

  appendArrayField(included, 'profileTargetTitles', input.profile.targetTitles);
  totalChars += input.profile.targetTitles.join(', ').length;

  appendArrayField(included, 'profileMustHaveSkills', input.profile.mustHaveSkills);
  totalChars += input.profile.mustHaveSkills.join(', ').length;

  appendArrayField(included, 'profileNiceToHaveSkills', input.profile.niceToHaveSkills);
  totalChars += input.profile.niceToHaveSkills.join(', ').length;

  // ── Resume highlights — optional ───────────────────────────────────
  if (input.resumeHighlights && input.resumeHighlights.length > 0) {
    appendStructured(included, 'resumeHighlights', summarizeText(input.resumeHighlights));
    totalChars += input.resumeHighlights.length;
  } else {
    excluded.push(label('resumeHighlights'));
  }

  // ── Static exclusions (never sent) ──────────────────────────────────
  excluded.push('Полный HTML', 'Cookies', 'Личные заметки', 'Вся база вакансий', 'История переписки');

  return { mode, includedFields: included, excludedFields: excluded, totalChars };
}

// ── Cover Letter preview ─────────────────────────────────────────────

const COVER_LETTER_LABELS: Record<string, string> = {
  title: 'Название вакансии',
  company: 'Компания',
  topRequirements: 'Ключевые требования',
  skills: 'Навыки',
  profileSummary: 'Профиль — Summary',
  resumeHighlights: 'Резюме — highlights',
  mode: 'Режим письма',
  language: 'Язык',
};

/**
 * Generate a payload preview for a CoverLetterInput.
 */
export function generateCoverLetterPreview(
  input: CoverLetterInput,
): PayloadPreview {
  const included: IncludedField[] = [];
  let totalChars = 0;

  appendStructured(included, 'title', input.job.title, COVER_LETTER_LABELS);
  totalChars += input.job.title.length;

  appendStructured(included, 'company', input.job.company, COVER_LETTER_LABELS);
  totalChars += input.job.company.length;

  appendStructured(included, 'topRequirements', input.job.topRequirements, COVER_LETTER_LABELS);
  totalChars += input.job.topRequirements.length;

  appendArrayField(included, 'skills', input.job.skills, COVER_LETTER_LABELS);
  totalChars += input.job.skills.join(', ').length;

  appendStructured(included, 'profileSummary', summarizeText(input.profile.summary), COVER_LETTER_LABELS);
  totalChars += input.profile.summary.length;

  if (input.resumeHighlights.length > 0) {
    appendStructured(included, 'resumeHighlights', summarizeText(input.resumeHighlights), COVER_LETTER_LABELS);
    totalChars += input.resumeHighlights.length;
  }

  appendStructured(included, 'mode', input.mode, COVER_LETTER_LABELS);
  totalChars += input.mode.length;

  appendStructured(included, 'language', input.language, COVER_LETTER_LABELS);
  totalChars += input.language.length;

  return {
    mode: 'standard',
    includedFields: included,
    excludedFields: ['Полный HTML', 'Cookies', 'Личные заметки', 'Вся база вакансий', 'История переписки'],
    totalChars,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

function label(key: string, dict: Record<string, string> = ANALYSIS_FIELD_LABELS): string {
  return dict[key] ?? key;
}

function summarizeText(text: string, maxLen = 60): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}… (${text.length} симв.)`;
}

function appendStructured(
  target: IncludedField[],
  key: string,
  value: string,
  dict?: Record<string, string>,
): void {
  target.push({
    label: label(key, dict),
    summary: value,
  });
}

function appendArrayField(
  target: IncludedField[],
  key: string,
  values: string[],
  dict?: Record<string, string>,
): void {
  target.push({
    label: label(key, dict),
    summary: values.length > 0 ? `${values.length} шт.: ${values.slice(0, 5).join(', ')}` : '—',
  });
}
