/**
 * AI input hash — compute stable fingerprints for cache keys.
 *
 * Section 12.8: перед анализом вакансии считать inputHash.
 * Хеш должен стабильно меняться при изменении описания вакансии, профиля,
 * резюме, prompt version, provider/model или privacy mode.
 */

import type { VacancyAnalysisInput, CoverLetterInput } from '@/models/ai';

/**
 * Simple 32-bit string hash (djb2 variant).
 * Matches the hash function used in tracker.ts for descriptionHash.
 */
function djb2(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Deterministic JSON serialization with sorted keys.
 * Ensures stable hashes regardless of property insertion order.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => stableStringify(k) + ':' + stableStringify((value as Record<string, unknown>)[k])).join(',') + '}';
  }

  return String(value);
}

/**
 * Compute an input hash for a VacancyAnalysisInput.
 *
 * Hash includes all fields that affect the AI output:
 * - job fields (title, company, salary, city, workMode, experience, skills, description)
 * - profile fields (summary, targetTitles, mustHaveSkills, niceToHaveSkills)
 * - resumeHighlights (if present)
 * - strictPrivacy flag
 */
export function computeAnalysisInputHash(input: VacancyAnalysisInput): string {
  const canonical = stableStringify(input);
  return djb2(canonical);
}

/**
 * Compute an input hash for a CoverLetterInput.
 *
 * Hash includes:
 * - job fields (title, company, topRequirements, skills)
 * - profile summary
 * - resumeHighlights
 * - mode, constraints, language
 */
export function computeCoverLetterInputHash(input: CoverLetterInput): string {
  const canonical = stableStringify(input);
  return djb2(canonical);
}
