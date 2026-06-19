/**
 * Mock LLM Provider — deterministic, network-free implementation of LLMProvider.
 *
 * Used for:
 * - Tests
 * - Development without API keys
 * - Validating the AI pipeline end-to-end
 *
 * Section 12.1: mock provider first, production providers later.
 * Never makes network calls. Never reads API keys.
 */

import type {
  LLMProvider,
  AIAnalysis,
  VacancyAnalysisInput,
  CoverLetterInput,
} from "@/models/ai";
import type { CoverLetterConstraints } from "@/models/cover-letter";

// ── ID generation ──────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Count how many job skills match profile must-have skills.
 */
function countSkillMatches(
  jobSkills: string[],
  profileMustHave: string[],
): number {
  const mustHaveLower = profileMustHave.map((s) => s.toLowerCase());
  return jobSkills.filter((s) => mustHaveLower.includes(s.toLowerCase()))
    .length;
}

/**
 * Identify which must-have skills are missing from the job.
 */
function findMissingSkills(
  jobSkills: string[],
  profileMustHave: string[],
): string[] {
  const jobLower = new Set(jobSkills.map((s) => s.toLowerCase()));
  return profileMustHave.filter((s) => !jobLower.has(s.toLowerCase()));
}

/**
 * Generate plausible questions for HR based on what's missing.
 */
function generateQuestions(
  missingSkills: string[],
  job: VacancyAnalysisInput["job"],
): string[] {
  const questions: string[] = [];

  if (!job.salaryRaw) {
    questions.push(
      "Какой уровень заработной платы предполагается для этой позиции?",
    );
  }

  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 2).join(", ");
    questions.push(`Насколько критично знание ${top} для этой роли?`);
  }

  if (!job.experienceRaw) {
    questions.push("Какой опыт работы ожидается от кандидата?");
  }

  if (job.workMode === "office" || job.workMode === "hybrid") {
    questions.push("Возможен ли полностью удалённый формат работы?");
  }

  return questions.length > 0
    ? questions
    : ["Расскажите подробнее о рабочих процессах в команде."];
}

/**
 * Build fit reasons from skill overlap analysis.
 */
function buildFitReasons(
  matchCount: number,
  totalJob: number,
  missingSkills: string[],
  jobTitle: string,
): string[] {
  const reasons: string[] = [];

  if (matchCount > 0) {
    reasons.push(
      `Совпадает ${matchCount} из ${totalJob} ключевых навыков вакансии.`,
    );
  }

  if (missingSkills.length > 0) {
    reasons.push(
      `Не хватает навыков: ${missingSkills.slice(0, 3).join(", ")}.`,
    );
  }

  reasons.push(`Позиция "${jobTitle}" соответствует профилю.`);
  return reasons;
}

// ── Mock Provider ──────────────────────────────────────────────────────

export class MockLLMProvider implements LLMProvider {
  readonly id = "mock" as const;

  /**
   * Analyze a vacancy against a profile.
   *
   * Returns a deterministic AIAnalysis based on skill overlap.
   * No network calls, no API keys, no side effects.
   */
  async analyzeVacancy(input: VacancyAnalysisInput): Promise<AIAnalysis> {
    const { job, profile, strictPrivacy } = input;

    const matchCount = countSkillMatches(job.skills, profile.mustHaveSkills);
    const totalJob = job.skills.length;
    const matchRatio = totalJob > 0 ? matchCount / totalJob : 0;
    const missingSkills = findMissingSkills(job.skills, profile.mustHaveSkills);

    // Score calculation
    let fitScore: number;
    let recommendation: "apply" | "consider" | "skip";

    if (matchRatio >= 0.7) {
      fitScore = Math.min(90, 55 + Math.round(matchRatio * 45));
      recommendation = "apply";
    } else if (matchRatio >= 0.35) {
      fitScore = Math.min(70, 35 + Math.round(matchRatio * 45));
      recommendation = "consider";
    } else {
      fitScore = Math.max(15, 5 + Math.round(matchRatio * 45));
      recommendation = "skip";
    }

    // Slightly reduce score in strict privacy (less context = more uncertainty)
    if (strictPrivacy) {
      fitScore = Math.max(10, fitScore - 5);
    }

    const riskFlags: AIAnalysis["riskFlags"] = [];
    if (!job.salaryRaw) {
      riskFlags.push({
        code: "salary_unknown",
        severity: "low",
        message: "Зарплата не указана в вакансии.",
      });
    }
    if (missingSkills.length >= 3) {
      riskFlags.push({
        code: "missing_core_skill",
        severity: "medium",
        message: `Отсутствует ${missingSkills.length} ключевых навыка(ов).`,
      });
    }

    const now = new Date().toISOString();

    return {
      id: generateId("ai_analysis"),
      jobId: "",
      profileId: "",

      provider: "mock",
      model: "mock-gpt-4o",
      promptVersion: "1.0.0",
      inputHash: "",

      fitScore,
      recommendation,
      confidence: matchRatio >= 0.5 ? "medium" : "low",

      fitReasons: buildFitReasons(
        matchCount,
        totalJob,
        missingSkills,
        job.title,
      ),
      riskFlags,
      missingSkills: missingSkills.length > 0 ? missingSkills : [],
      questionsForHR: generateQuestions(missingSkills, job),

      suggestedProfileId: undefined,
      suggestedResumeId: undefined,

      tokenUsage: {
        inputTokens: Math.round(
          200 + job.descriptionClean.length / 4 + profile.summary.length / 4,
        ),
        outputTokens: 150 + riskFlags.length * 20 + missingSkills.length * 10,
        estimatedCostUsd: 0,
      },

      createdAt: now,
    };
  }

  /**
   * Generate a cover letter from job and profile data.
   *
   * Returns a deterministic letter that respects constraints.
   * No network calls, no API keys.
   */
  async generateCoverLetter(input: CoverLetterInput): Promise<string> {
    const { job, profile, resumeHighlights, mode, constraints, language } =
      input;

    const letter = buildMockLetter(
      job,
      profile,
      resumeHighlights,
      mode,
      language,
    );
    return applyConstraints(letter, constraints);
  }
}

// ── Letter generation ──────────────────────────────────────────────────

function buildMockLetter(
  job: CoverLetterInput["job"],
  profile: CoverLetterInput["profile"],
  resumeHighlights: string,
  mode: string,
  language: string,
): string {
  const greeting =
    language === "en"
      ? "Dear Hiring Manager,"
      : language === "ro"
        ? "Stimate domnule/doamnă,"
        : "Здравствуйте,";
  const intro =
    language === "en"
      ? `I am writing to express my interest in the ${job.title} position at ${job.company}.`
      : language === "ro"
        ? `Vă scriu pentru a-mi exprima interesul pentru poziția de ${job.title} la ${job.company}.`
        : `Меня заинтересовала вакансия "${job.title}" в компании ${job.company}.`;

  const skillsMention =
    job.skills.length > 0
      ? language === "en"
        ? `My experience with ${job.skills.slice(0, 3).join(", ")} aligns well with the requirements.`
        : language === "ro"
          ? `Experiența mea cu ${job.skills.slice(0, 3).join(", ")} se aliniază bine cu cerințele.`
          : `Мой опыт работы с ${job.skills.slice(0, 3).join(", ")} соответствует требованиям вакансии.`
      : "";

  const profileMention =
    profile.summary.length > 0
      ? language === "en"
        ? `My background: ${profile.summary.slice(0, 150)}.`
        : language === "ro"
          ? `Experiența mea: ${profile.summary.slice(0, 150)}.`
          : `Мой профиль: ${profile.summary.slice(0, 150)}.`
      : "";

  const highlightsMention =
    resumeHighlights.length > 0
      ? language === "en"
        ? `Key achievements: ${resumeHighlights.slice(0, 200)}.`
        : language === "ro"
          ? `Realizări cheie: ${resumeHighlights.slice(0, 200)}.`
          : `Ключевые достижения: ${resumeHighlights.slice(0, 200)}.`
      : "";

  const closing =
    language === "en"
      ? "I would appreciate the opportunity to discuss how I can contribute to your team. Thank you for your consideration."
      : language === "ro"
        ? "Aș aprecia oportunitatea de a discuta cum pot contribui la echipa dumneavoastră. Vă mulțumesc pentru considerație."
        : "Буду рад возможности обсудить, как я могу быть полезен вашей команде. Спасибо за рассмотрение моей кандидатуры.";

  // Mode affects length
  let body = [greeting, intro, skillsMention, profileMention, highlightsMention, closing]
    .filter(Boolean)
    .join("\n\n");

  if (mode === "tg_short" || mode === "very_short") {
    body = [greeting, intro, skillsMention, closing].filter(Boolean).join("\n\n");
  }

  return body;
}

/**
 * Apply cover letter constraints: strip emoji, markdown, special chars, truncate.
 */
function applyConstraints(
  text: string,
  constraints: CoverLetterConstraints,
): string {
  let result = text;

  if (constraints.noEmoji) {
    // Strip common emoji and emoticons
    result = result.replace(EMOJI_LIKE_RE, "");
  }

  if (constraints.noMarkdown) {
    // Strip markdown formatting
    result = result
      .replace(/[*_~`#]/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^[-*+]\s/gm, "")
      .replace(/^>\s/gm, "");
  }

  if (constraints.noSpecialChars) {
    result = stripDisallowedSpecialChars(result);
  }

  if (constraints.maxChars && result.length > constraints.maxChars) {
    // Truncate at last complete sentence or word
    const truncated = result.slice(0, constraints.maxChars);
    const lastPeriod = truncated.lastIndexOf(".");
    if (lastPeriod > constraints.maxChars * 0.6) {
      result = truncated.slice(0, lastPeriod + 1);
    } else {
      const lastSpace = truncated.lastIndexOf(" ");
      result =
        (lastSpace > constraints.maxChars * 0.8
          ? truncated.slice(0, lastSpace)
          : truncated) + "…";
    }
  }

  return result.trim();
}

const EMOJI_LIKE_RE = /\p{Extended_Pictographic}|\uFE0F|\u200D/gu;
const ALLOWED_EXTRA_SPECIAL_CHARS = new Set(["«", "»", "—", "№"]);
const ALLOWED_BASIC_PUNCTUATION = new Set([
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  "(",
  ")",
  "\"",
  "'",
  "/",
  "%",
  "@",
  "+",
  "=",
  "-",
]);

function stripDisallowedSpecialChars(text: string): string {
  return Array.from(text)
    .filter(
      (char) =>
        ALLOWED_EXTRA_SPECIAL_CHARS.has(char) ||
        isAllowedBasicChar(char),
    )
    .join("");
}

function isAllowedBasicChar(char: string): boolean {
  return (
    /^\p{L}$/u.test(char) ||
    /^\p{N}$/u.test(char) ||
    /^\s$/u.test(char) ||
    ALLOWED_BASIC_PUNCTUATION.has(char)
  );
}
