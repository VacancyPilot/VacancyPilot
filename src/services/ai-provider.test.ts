import { describe, it, expect } from "vitest";
import { MockLLMProvider } from "./ai-provider";
import type {
  VacancyAnalysisInput,
  CoverLetterInput,
} from "@/models/ai";

// ── Test fixtures ──────────────────────────────────────────────────────

function makeVacancyInput(
  overrides?: Partial<VacancyAnalysisInput>,
): VacancyAnalysisInput {
  return {
    job: {
      title: "Senior Frontend Developer",
      company: "Tech Corp",
      salaryRaw: "200000 руб.",
      city: "Москва",
      workMode: "remote",
      experienceRaw: "3-6 лет",
      skills: ["TypeScript", "React", "Node.js", "CSS", "Git"],
      descriptionClean: "We are looking for a Senior Frontend Developer...",
    },
    profile: {
      summary: "Frontend developer with 5 years experience.",
      targetTitles: ["Senior Frontend Developer", "Lead Frontend"],
      mustHaveSkills: ["TypeScript", "React", "Node.js"],
      niceToHaveSkills: ["GraphQL", "Docker"],
    },
    strictPrivacy: false,
    ...overrides,
  };
}

function makeCoverLetterInput(
  overrides?: Partial<CoverLetterInput>,
): CoverLetterInput {
  return {
    job: {
      title: "Senior Frontend Developer",
      company: "Tech Corp",
      topRequirements: "TypeScript, React, Node.js",
      skills: ["TypeScript", "React", "Node.js", "CSS"],
    },
    profile: {
      summary: "Frontend developer with 5 years experience.",
    },
    resumeHighlights: "Led team of 5 developers. Built design system.",
    mode: "hh_standard",
    constraints: {
      noEmoji: true,
      noMarkdown: true,
      noSpecialChars: false,
      maxChars: 1000,
    },
    language: "ru",
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("MockLLMProvider", () => {
  const provider = new MockLLMProvider();

  describe("id", () => {
    it("has mock provider id", () => {
      expect(provider.id).toBe("mock");
    });
  });

  describe("analyzeVacancy", () => {
    it("returns a valid AIAnalysis object", async () => {
      const input = makeVacancyInput();
      const result = await provider.analyzeVacancy(input);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^ai_analysis_/);
      expect(result.provider).toBe("mock");
      expect(result.model).toBe("mock-gpt-4o");
      expect(result.promptVersion).toBe("1.0.0");
      expect(typeof result.fitScore).toBe("number");
      expect(result.fitScore).toBeGreaterThanOrEqual(0);
      expect(result.fitScore).toBeLessThanOrEqual(100);
      expect(["apply", "consider", "skip"]).toContain(result.recommendation);
      expect(["low", "medium", "high"]).toContain(result.confidence);
      expect(Array.isArray(result.fitReasons)).toBe(true);
      expect(result.fitReasons.length).toBeGreaterThan(0);
      expect(Array.isArray(result.riskFlags)).toBe(true);
      expect(Array.isArray(result.missingSkills)).toBe(true);
      expect(Array.isArray(result.questionsForHR)).toBe(true);
      expect(result.createdAt).toBeDefined();
      expect(result.tokenUsage).toBeDefined();
    });

    it('returns "apply" recommendation for high skill match', async () => {
      const input = makeVacancyInput();
      input.job.skills = ["TypeScript", "React", "Node.js", "CSS"];
      input.profile.mustHaveSkills = ["TypeScript", "React", "Node.js"];

      const result = await provider.analyzeVacancy(input);
      expect(result.recommendation).toBe("apply");
      expect(result.fitScore).toBeGreaterThanOrEqual(55);
    });

    it('returns "skip" recommendation for low skill match', async () => {
      const input = makeVacancyInput();
      input.job.skills = ["Python", "Django", "PostgreSQL"];
      input.profile.mustHaveSkills = ["TypeScript", "React", "Node.js"];

      const result = await provider.analyzeVacancy(input);
      expect(result.recommendation).toBe("skip");
      expect(result.fitScore).toBeLessThanOrEqual(30);
    });

    it('returns "consider" recommendation for medium skill match', async () => {
      const input = makeVacancyInput();
      input.job.skills = ["TypeScript", "React", "Django", "PostgreSQL"];
      input.profile.mustHaveSkills = ["TypeScript", "React", "Node.js"];

      const result = await provider.analyzeVacancy(input);
      expect(result.recommendation).toBe("consider");
    });

    it("identifies missing skills", async () => {
      const input = makeVacancyInput();
      input.job.skills = ["TypeScript", "CSS"];
      input.profile.mustHaveSkills = ["TypeScript", "React", "Node.js"];

      const result = await provider.analyzeVacancy(input);
      expect(result.missingSkills).toContain("React");
      expect(result.missingSkills).toContain("Node.js");
    });

    it("generates salary question when salary is missing", async () => {
      const input = makeVacancyInput();
      input.job.salaryRaw = undefined;

      const result = await provider.analyzeVacancy(input);
      expect(
        result.questionsForHR.some((q) => q.includes("заработной платы")),
      ).toBe(true);
    });

    it("generates questions for missing skills", async () => {
      const input = makeVacancyInput();
      input.job.skills = ["TypeScript"];
      input.profile.mustHaveSkills = ["TypeScript", "React", "Node.js"];

      const result = await provider.analyzeVacancy(input);
      expect(result.questionsForHR.length).toBeGreaterThan(0);
    });

    it("adds salary_unknown risk flag when salary is missing", async () => {
      const input = makeVacancyInput();
      input.job.salaryRaw = undefined;

      const result = await provider.analyzeVacancy(input);
      expect(result.riskFlags.some((f) => f.code === "salary_unknown")).toBe(
        true,
      );
    });

    it("does not add salary_unknown flag when salary is present", async () => {
      const input = makeVacancyInput();

      const result = await provider.analyzeVacancy(input);
      expect(result.riskFlags.some((f) => f.code === "salary_unknown")).toBe(
        false,
      );
    });

    it("adds missing_core_skill flag when 3+ skills missing", async () => {
      const input = makeVacancyInput();
      input.job.skills = ["Git"];
      input.profile.mustHaveSkills = [
        "TypeScript",
        "React",
        "Node.js",
        "GraphQL",
      ];

      const result = await provider.analyzeVacancy(input);
      expect(
        result.riskFlags.some((f) => f.code === "missing_core_skill"),
      ).toBe(true);
    });

    it("reduces score in strict privacy mode", async () => {
      const standardInput = makeVacancyInput();
      standardInput.strictPrivacy = false;

      const strictInput = makeVacancyInput();
      strictInput.strictPrivacy = true;

      const standardResult = await provider.analyzeVacancy(standardInput);
      const strictResult = await provider.analyzeVacancy(strictInput);

      // Strict should be equal or lower (but not negative)
      expect(strictResult.fitScore).toBeLessThanOrEqual(
        standardResult.fitScore,
      );
      expect(strictResult.fitScore).toBeGreaterThan(0);
    });

    it("returns deterministic results for same input", async () => {
      const input = makeVacancyInput();

      const result1 = await provider.analyzeVacancy(input);
      const result2 = await provider.analyzeVacancy(input);

      expect(result1.fitScore).toBe(result2.fitScore);
      expect(result1.recommendation).toBe(result2.recommendation);
    });

    it("handles empty job skills gracefully", async () => {
      const input = makeVacancyInput();
      input.job.skills = [];

      const result = await provider.analyzeVacancy(input);
      expect(result.fitScore).toBeDefined();
      expect(result.fitScore).toBeLessThanOrEqual(25);
    });

    it("handles empty profile must-have skills gracefully", async () => {
      const input = makeVacancyInput();
      input.profile.mustHaveSkills = [];

      const result = await provider.analyzeVacancy(input);
      expect(result.fitScore).toBeDefined();
      expect(result.missingSkills).toEqual([]);
    });

    it("includes token usage estimates", async () => {
      const input = makeVacancyInput();
      const result = await provider.analyzeVacancy(input);

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage!.inputTokens).toBeGreaterThan(0);
      expect(result.tokenUsage!.outputTokens).toBeGreaterThan(0);
      expect(result.tokenUsage!.estimatedCostUsd).toBe(0); // mock is free
    });
  });

  describe("generateCoverLetter", () => {
    it("returns a non-empty string", async () => {
      const input = makeCoverLetterInput();
      const result = await provider.generateCoverLetter(input);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns letter in Russian by default", async () => {
      const input = makeCoverLetterInput();
      input.language = "ru";

      const result = await provider.generateCoverLetter(input);
      expect(result).toContain("Здравствуйте");
      expect(result).toContain("вакансия");
    });

    it("returns letter in English when specified", async () => {
      const input = makeCoverLetterInput();
      input.language = "en";

      const result = await provider.generateCoverLetter(input);
      expect(result).toContain("Dear Hiring Manager");
      expect(result).toContain("position at");
    });

    it("returns letter in Romanian when specified", async () => {
      const input = makeCoverLetterInput();
      input.language = "ro";

      const result = await provider.generateCoverLetter(input);
      expect(result).toContain("Stimate domnule");
      expect(result).toContain("poziția de");
    });

    it("respects maxChars constraint", async () => {
      const input = makeCoverLetterInput();
      input.constraints = {
        noEmoji: true,
        noMarkdown: true,
        noSpecialChars: false,
        maxChars: 500,
      };

      const result = await provider.generateCoverLetter(input);
      expect(result.length).toBeLessThanOrEqual(510); // Allow few chars for ellipsis
    });

    it("respects noEmoji constraint", async () => {
      const input = makeCoverLetterInput();
      input.constraints = {
        noEmoji: true,
        noMarkdown: false,
        noSpecialChars: false,
      };

      const result = await provider.generateCoverLetter(input);
      // No emoji characters in result
      const emojiRe = /[\u{1F600}-\u{1F64F}]/u;
      expect(emojiRe.test(result)).toBe(false);
    });

    it("respects noMarkdown constraint", async () => {
      const input = makeCoverLetterInput();
      input.constraints = {
        noEmoji: false,
        noMarkdown: true,
        noSpecialChars: false,
      };

      const result = await provider.generateCoverLetter(input);
      expect(result).not.toMatch(/[*_~`#]/);
    });

    it("respects noSpecialChars constraint", async () => {
      const input = makeCoverLetterInput();
      input.constraints = {
        noEmoji: false,
        noMarkdown: false,
        noSpecialChars: true,
      };

      const result = await provider.generateCoverLetter(input);
      // Should only contain letters, digits, basic punctuation
      expect(result).not.toMatch(/[^\p{L}\p{N}\s.,!?;:()\-"'«»/%№@+=]/u);
    });

    it("produces shorter letter for tg_short mode", async () => {
      const standardInput = makeCoverLetterInput();
      standardInput.mode = "hh_standard";

      const shortInput = makeCoverLetterInput();
      shortInput.mode = "tg_short";

      const standardResult = await provider.generateCoverLetter(standardInput);
      const shortResult = await provider.generateCoverLetter(shortInput);

      // Short mode should produce a shorter or equal letter
      expect(shortResult.length).toBeLessThanOrEqual(standardResult.length);
    });

    it("produces shorter letter for very_short mode", async () => {
      const input = makeCoverLetterInput();
      input.mode = "very_short";

      const result = await provider.generateCoverLetter(input);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(600); // Should be fairly short
    });

    it("includes job title in the letter", async () => {
      const input = makeCoverLetterInput();
      const result = await provider.generateCoverLetter(input);

      expect(result).toContain("Senior Frontend Developer");
    });

    it("includes company name in the letter", async () => {
      const input = makeCoverLetterInput();
      const result = await provider.generateCoverLetter(input);

      expect(result).toContain("Tech Corp");
    });

    it("handles empty resume highlights gracefully", async () => {
      const input = makeCoverLetterInput();
      input.resumeHighlights = "";

      const result = await provider.generateCoverLetter(input);
      expect(result.length).toBeGreaterThan(0);
    });

    it("handles empty profile summary gracefully", async () => {
      const input = makeCoverLetterInput();
      input.profile.summary = "";

      const result = await provider.generateCoverLetter(input);
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns deterministic results for same input", async () => {
      const input = makeCoverLetterInput();

      const result1 = await provider.generateCoverLetter(input);
      const result2 = await provider.generateCoverLetter(input);

      expect(result1).toBe(result2);
    });

    it("produces different results for different languages", async () => {
      const ruInput = makeCoverLetterInput();
      ruInput.language = "ru";

      const enInput = makeCoverLetterInput();
      enInput.language = "en";

      const ruResult = await provider.generateCoverLetter(ruInput);
      const enResult = await provider.generateCoverLetter(enInput);

      expect(ruResult).not.toBe(enResult);
    });
  });
});
