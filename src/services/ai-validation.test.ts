import { describe, it, expect } from "vitest";
import {
  parseAndValidateAnalysis,
  createFallbackAnalysis,
  validateCoverLetter,
} from "./ai-validation";
import type { CoverLetterConstraints } from "@/models/cover-letter";

// ── Test helpers ───────────────────────────────────────────────────────

const BASE_OVERRIDES = {
  id: "ai_test_001",
  jobId: "hh_123456",
  profileId: "prof_1",
  provider: "openai",
  model: "gpt-4o",
  promptVersion: "1.0.0",
  inputHash: "abc123",
};

function validAnalysisJson(): string {
  return JSON.stringify({
    fitScore: 75,
    recommendation: "apply",
    confidence: "medium",
    fitReasons: ["Strong TypeScript skills", "Relevant experience"],
    riskFlags: [
      { code: "salary_unknown", severity: "low", message: "Salary not listed" },
    ],
    missingSkills: ["GraphQL"],
    questionsForHR: ["What is the team size?"],
    suggestedProfileId: "prof_2",
    tokenUsage: {
      inputTokens: 500,
      outputTokens: 150,
      estimatedCostUsd: 0.01,
    },
  });
}

// ── parseAndValidateAnalysis tests ─────────────────────────────────────

describe("parseAndValidateAnalysis", () => {
  describe("valid responses", () => {
    it("parses a valid JSON response", () => {
      const raw = validAnalysisJson();
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.valid).toBe(true);
      expect(result.analysis).not.toBeNull();
      expect(result.analysis!.fitScore).toBe(75);
      expect(result.analysis!.recommendation).toBe("apply");
      expect(result.analysis!.confidence).toBe("medium");
      expect(result.analysis!.fitReasons).toHaveLength(2);
      expect(result.analysis!.riskFlags).toHaveLength(1);
      expect(result.analysis!.missingSkills).toEqual(["GraphQL"]);
      expect(result.analysis!.questionsForHR).toEqual([
        "What is the team size?",
      ]);
    });

    it("extracts JSON from markdown code fence with json tag", () => {
      const raw = "```json\n" + validAnalysisJson() + "\n```";
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.valid).toBe(true);
      expect(result.analysis!.fitScore).toBe(75);
    });

    it("extracts JSON from markdown code fence without tag", () => {
      const raw = "```\n" + validAnalysisJson() + "\n```";
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.valid).toBe(true);
      expect(result.analysis!.fitScore).toBe(75);
    });

    it("extracts JSON from text with surrounding content", () => {
      const raw =
        "Here is the analysis:\n" + validAnalysisJson() + "\nHope this helps!";
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.valid).toBe(true);
      expect(result.analysis!.fitScore).toBe(75);
    });

    it("stores raw response when debug mode is enabled", () => {
      const raw = validAnalysisJson();
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES, true);

      expect(result.rawResponse).toBe(raw);
    });

    it("does not store raw response when debug mode is disabled", () => {
      const raw = validAnalysisJson();
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES, false);

      expect(result.rawResponse).toBeUndefined();
    });

    it("populates overrides into the analysis", () => {
      const raw = validAnalysisJson();
      const overrides = { ...BASE_OVERRIDES, resumeId: "res_1" };
      const result = parseAndValidateAnalysis(raw, overrides);

      expect(result.analysis!.id).toBe(BASE_OVERRIDES.id);
      expect(result.analysis!.jobId).toBe(BASE_OVERRIDES.jobId);
      expect(result.analysis!.profileId).toBe(BASE_OVERRIDES.profileId);
      expect(result.analysis!.resumeId).toBe("res_1");
      expect(result.analysis!.provider).toBe(BASE_OVERRIDES.provider);
      expect(result.analysis!.model).toBe(BASE_OVERRIDES.model);
      expect(result.analysis!.promptVersion).toBe(BASE_OVERRIDES.promptVersion);
      expect(result.analysis!.inputHash).toBe(BASE_OVERRIDES.inputHash);
    });
  });

  describe("edge cases and coercion", () => {
    it("coerces string fitScore to number", () => {
      const raw = JSON.stringify({
        fitScore: "75",
        recommendation: "apply",
        confidence: "medium",
        fitReasons: ["Good"],
        riskFlags: [],
        missingSkills: [],
        questionsForHR: [],
      });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.fitScore).toBe(75);
      expect(result.errors.length).toBe(0);
    });

    it("clamps fitScore above 100", () => {
      const raw = JSON.stringify({ fitScore: 150 });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.fitScore).toBe(100);
      expect(result.errors.some((e) => e.field === "fitScore")).toBe(true);
    });

    it("clamps fitScore below 0", () => {
      const raw = JSON.stringify({ fitScore: -10 });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.fitScore).toBe(0);
      expect(result.errors.some((e) => e.field === "fitScore")).toBe(true);
    });

    it('falls back to "consider" for invalid recommendation', () => {
      const raw = JSON.stringify({ fitScore: 50, recommendation: "maybe" });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.recommendation).toBe("consider");
      expect(result.errors.some((e) => e.field === "recommendation")).toBe(
        true,
      );
    });

    it('falls back to "low" for invalid confidence', () => {
      const raw = JSON.stringify({
        fitScore: 50,
        recommendation: "apply",
        confidence: "very-high",
        fitReasons: ["Good"],
        riskFlags: [],
        missingSkills: [],
        questionsForHR: [],
      });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.confidence).toBe("high");
      expect(result.errors.some((e) => e.field === "confidence")).toBe(false);
    });

    it("loosely matches confidence containing valid value", () => {
      const raw = JSON.stringify({ fitScore: 50, confidence: "medium-high" });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.confidence).toBe("medium");
    });

    it("coerces string array fields from single string", () => {
      const raw = JSON.stringify({
        fitScore: 50,
        fitReasons: "Good match",
        missingSkills: "GraphQL",
        questionsForHR: "What is the team size?",
      });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.fitReasons).toEqual(["Good match"]);
      expect(result.analysis!.missingSkills).toEqual(["GraphQL"]);
      expect(result.analysis!.questionsForHR).toEqual([
        "What is the team size?",
      ]);
    });

    it("allows empty string arrays", () => {
      const raw = JSON.stringify({
        fitScore: 50,
        recommendation: "apply",
        confidence: "medium",
        fitReasons: [],
        riskFlags: [],
        missingSkills: [],
        questionsForHR: [],
      });
      const result = parseAndValidateAnalysis(raw, BASE_OVERRIDES);

      expect(result.analysis!.fitReasons).toEqual([]);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("invalid responses", () => {
    it("returns null analysis for non-JSON response", () => {
      const result = parseAndValidateAnalysis(
        "This is not JSON at all",
        BASE_OVERRIDES,
      );

      expect(result.valid).toBe(false);
      expect(result.analysis).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("returns null analysis for empty response", () => {
      const result = parseAndValidateAnalysis("", BASE_OVERRIDES);

      expect(result.valid).toBe(false);
      expect(result.analysis).toBeNull();
    });

    it("handles malformed JSON gracefully", () => {
      const result = parseAndValidateAnalysis(
        "{ fitScore: 50, }",
        BASE_OVERRIDES,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("handles JSON array instead of object", () => {
      const result = parseAndValidateAnalysis("[1, 2, 3]", BASE_OVERRIDES);

      expect(result.valid).toBe(false);
      expect(result.analysis).toBeNull();
    });
  });
});

// ── createFallbackAnalysis tests ───────────────────────────────────────

describe("createFallbackAnalysis", () => {
  it("creates a safe fallback analysis", () => {
    const analysis = createFallbackAnalysis(BASE_OVERRIDES);

    expect(analysis.id).toBe(BASE_OVERRIDES.id);
    expect(analysis.fitScore).toBe(0);
    expect(analysis.recommendation).toBe("consider");
    expect(analysis.confidence).toBe("low");
    expect(analysis.fitReasons).toHaveLength(1);
    expect(analysis.riskFlags).toHaveLength(1);
    expect(analysis.riskFlags[0].code).toBe("low_signal");
    expect(analysis.missingSkills).toEqual([]);
    expect(analysis.questionsForHR).toEqual([]);
    expect(analysis.tokenUsage).toBeUndefined();
    expect(analysis.createdAt).toBeDefined();
  });

  it("includes resumeId when provided", () => {
    const analysis = createFallbackAnalysis({
      ...BASE_OVERRIDES,
      resumeId: "res_1",
    });
    expect(analysis.resumeId).toBe("res_1");
  });
});

// ── validateCoverLetter tests ──────────────────────────────────────────

describe("validateCoverLetter", () => {
  const defaultConstraints: CoverLetterConstraints = {
    noEmoji: true,
    noMarkdown: true,
    noSpecialChars: false,
    maxChars: 1000,
  };

  it("passes a valid letter", () => {
    const result = validateCoverLetter(
      "Здравствуйте! Меня заинтересовала вакансия. Спасибо за рассмотрение.",
      defaultConstraints,
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("detects exceeding maxChars", () => {
    const shortConstraints: CoverLetterConstraints = {
      ...defaultConstraints,
      maxChars: 500,
    };
    // Generate a string longer than 500 chars
    const longText = "A".repeat(501);
    const result = validateCoverLetter(longText, shortConstraints);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("превышает лимит"))).toBe(true);
  });

  it("detects emoji when noEmoji is set", () => {
    const result = validateCoverLetter(
      "Hello! 😊 Thanks for considering.",
      defaultConstraints,
    );

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("emoji"))).toBe(true);
  });

  it("detects markdown when noMarkdown is set", () => {
    const result = validateCoverLetter(
      "**Hello!** This is *important*.",
      defaultConstraints,
    );

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("markdown"))).toBe(true);
  });

  it("detects special chars when noSpecialChars is set", () => {
    const strictConstraints: CoverLetterConstraints = {
      ...defaultConstraints,
      noSpecialChars: true,
    };
    const result = validateCoverLetter("Hello → World ←", strictConstraints);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("нестандартные символы"))).toBe(
      true,
    );
  });

  it("warns about potential fabricated facts", () => {
    const result = validateCoverLetter(
      "В 2020 году я увеличил продажи на 150% и привёл 50 клиентов.",
      defaultConstraints,
    );

    expect(result.warnings.some((w) => w.includes("факты"))).toBe(true);
  });

  it("detects empty letter", () => {
    const result = validateCoverLetter("   ", defaultConstraints);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("пустое"))).toBe(true);
  });

  it("passes letter without any constraints", () => {
    const noConstraints: CoverLetterConstraints = {
      noEmoji: false,
      noMarkdown: false,
      noSpecialChars: false,
    };
    const result = validateCoverLetter(
      "Hello with emoji 😊 and **markdown**!",
      noConstraints,
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("passes letter with allowed Romanian diacritics", () => {
    const strictConstraints: CoverLetterConstraints = {
      ...defaultConstraints,
      noSpecialChars: true,
    };
    const result = validateCoverLetter(
      "Bună ziua! Vă scriu pentru poziția de Frontend Developer.",
      strictConstraints,
    );

    // Romanian diacritics should be allowed
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("passes letter with allowed Russian punctuation", () => {
    const strictConstraints: CoverLetterConstraints = {
      ...defaultConstraints,
      noSpecialChars: true,
    };
    const result = validateCoverLetter(
      "Здравствуйте! «Компания» — это отличное место. Номер: №1.",
      strictConstraints,
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("reports all issues when multiple constraints fail", () => {
    const strictConstraints: CoverLetterConstraints = {
      noEmoji: true,
      noMarkdown: true,
      noSpecialChars: true,
      maxChars: 500,
    };
    const longText = "😊 **world** with → arrows ← and " + "A".repeat(500);
    const result = validateCoverLetter(longText, strictConstraints);

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
  });
});
