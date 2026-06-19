import { describe, it, expect } from 'vitest';
import { computeAnalysisInputHash, computeCoverLetterInputHash } from './ai-hash';
import type { VacancyAnalysisInput, CoverLetterInput } from '@/models/ai';

// ── Test fixtures ──────────────────────────────────────────────────────

function makeBaseAnalysisInput(): VacancyAnalysisInput {
  return {
    job: {
      title: 'Senior Developer',
      company: 'Tech Corp',
      salaryRaw: '200000 руб.',
      city: 'Москва',
      workMode: 'remote',
      experienceRaw: '3-6 лет',
      skills: ['TypeScript', 'React'],
      descriptionClean: 'A great job opportunity.',
    },
    profile: {
      summary: 'Experienced developer.',
      targetTitles: ['Developer'],
      mustHaveSkills: ['TypeScript'],
      niceToHaveSkills: ['GraphQL'],
    },
    resumeHighlights: 'Led a team.',
    strictPrivacy: false,
  };
}

function makeBaseLetterInput(): CoverLetterInput {
  return {
    job: {
      title: 'Developer',
      company: 'Tech Corp',
      topRequirements: 'TypeScript',
      skills: ['TypeScript', 'React'],
    },
    profile: {
      summary: 'Experienced developer.',
    },
    resumeHighlights: 'Led a team.',
    mode: 'hh_standard',
    constraints: { noEmoji: true, noMarkdown: true, noSpecialChars: false },
    language: 'ru',
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('computeAnalysisInputHash', () => {
  it('returns a non-empty string', () => {
    const input = makeBaseAnalysisInput();
    const hash = computeAnalysisInputHash(input);

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces same hash for identical inputs', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();

    expect(computeAnalysisInputHash(input1)).toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when job title changes', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.job.title = 'Junior Developer';

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when company changes', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.job.company = 'Other Corp';

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when salary changes', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.job.salaryRaw = '300000 руб.';

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when description changes', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.job.descriptionClean = 'A completely different description.';

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when skills change', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.job.skills = ['Python', 'Django'];

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when profile summary changes', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.profile.summary = 'A different profile summary.';

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when mustHaveSkills change', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.profile.mustHaveSkills = ['Python'];

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when resumeHighlights change', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.resumeHighlights = 'Different achievements.';

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces different hash when privacy mode changes', () => {
    const input1 = makeBaseAnalysisInput();
    const input2 = makeBaseAnalysisInput();
    input2.strictPrivacy = true;

    expect(computeAnalysisInputHash(input1)).not.toBe(computeAnalysisInputHash(input2));
  });

  it('produces same hash regardless of property key order', () => {
    // Build objects with different key order
    const input1: VacancyAnalysisInput = {
      job: {
        title: 'Developer',
        company: 'Tech Corp',
        skills: ['TypeScript'],
        workMode: 'remote',
        descriptionClean: 'A job.',
      },
      profile: {
        summary: 'Dev.',
        targetTitles: ['Dev'],
        mustHaveSkills: ['TS'],
        niceToHaveSkills: [],
      },
      strictPrivacy: false,
    };

    const input2: VacancyAnalysisInput = {
      strictPrivacy: false,
      profile: {
        niceToHaveSkills: [],
        mustHaveSkills: ['TS'],
        summary: 'Dev.',
        targetTitles: ['Dev'],
      },
      job: {
        descriptionClean: 'A job.',
        workMode: 'remote',
        company: 'Tech Corp',
        skills: ['TypeScript'],
        title: 'Developer',
      },
    };

    expect(computeAnalysisInputHash(input1)).toBe(computeAnalysisInputHash(input2));
  });

  it('handles undefined optional fields consistently', () => {
    const input1 = makeBaseAnalysisInput();
    input1.job.salaryRaw = undefined;
    input1.resumeHighlights = undefined;

    const input2 = makeBaseAnalysisInput();
    input2.job.salaryRaw = undefined;
    input2.resumeHighlights = undefined;

    expect(computeAnalysisInputHash(input1)).toBe(computeAnalysisInputHash(input2));
  });

  it('differentiates undefined from empty string', () => {
    const withUndefined = makeBaseAnalysisInput();
    withUndefined.resumeHighlights = undefined;

    const withEmpty = makeBaseAnalysisInput();
    withEmpty.resumeHighlights = '';

    // undefined → 'null', '' → '""' in stableStringify
    expect(computeAnalysisInputHash(withUndefined)).not.toBe(computeAnalysisInputHash(withEmpty));
  });
});

describe('computeCoverLetterInputHash', () => {
  it('returns a non-empty string', () => {
    const input = makeBaseLetterInput();
    const hash = computeCoverLetterInputHash(input);

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces same hash for identical inputs', () => {
    const input1 = makeBaseLetterInput();
    const input2 = makeBaseLetterInput();

    expect(computeCoverLetterInputHash(input1)).toBe(computeCoverLetterInputHash(input2));
  });

  it('produces different hash when mode changes', () => {
    const input1 = makeBaseLetterInput();
    const input2 = makeBaseLetterInput();
    input2.mode = 'tg_short';

    expect(computeCoverLetterInputHash(input1)).not.toBe(computeCoverLetterInputHash(input2));
  });

  it('produces different hash when language changes', () => {
    const input1 = makeBaseLetterInput();
    const input2 = makeBaseLetterInput();
    input2.language = 'en';

    expect(computeCoverLetterInputHash(input1)).not.toBe(computeCoverLetterInputHash(input2));
  });

  it('produces different hash when constraints change', () => {
    const input1 = makeBaseLetterInput();
    const input2 = makeBaseLetterInput();
    input2.constraints = { ...input2.constraints, maxChars: 500 };

    expect(computeCoverLetterInputHash(input1)).not.toBe(computeCoverLetterInputHash(input2));
  });

  it('analysis and letter hashes differ for comparable data', () => {
    const analysisInput = makeBaseAnalysisInput();
    const letterInput = makeBaseLetterInput();

    const analysisHash = computeAnalysisInputHash(analysisInput);
    const letterHash = computeCoverLetterInputHash(letterInput);

    // Different input shapes should produce different hashes
    expect(analysisHash).not.toBe(letterHash);
  });

  it('produces consistent hash regardless of property order', () => {
    const input1: CoverLetterInput = {
      job: { title: 'Dev', company: 'Corp', topRequirements: 'TS', skills: ['TS'] },
      profile: { summary: 'Dev' },
      resumeHighlights: '',
      mode: 'hh_standard' as const,
      constraints: { noEmoji: true, noMarkdown: true, noSpecialChars: false },
      language: 'ru',
    };

    const input2: CoverLetterInput = {
      language: 'ru',
      constraints: { noSpecialChars: false, noMarkdown: true, noEmoji: true },
      mode: 'hh_standard' as const,
      resumeHighlights: '',
      profile: { summary: 'Dev' },
      job: { skills: ['TS'], topRequirements: 'TS', company: 'Corp', title: 'Dev' },
    };

    expect(computeCoverLetterInputHash(input1)).toBe(computeCoverLetterInputHash(input2));
  });
});
