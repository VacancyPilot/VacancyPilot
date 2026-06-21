import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenAILLMProvider, estimateCost } from "./ai-provider-openai";
import type { VacancyAnalysisInput, CoverLetterInput } from "@/models/ai";

// ── Mock getApiKey from api-key-bridge ────────────────────────────────────

const mockApiKeys = new Map<string, string | undefined>();

vi.mock("@/db/api-key-bridge", () => ({
  getApiKey: async (provider: string) => mockApiKeys.get(provider),
  saveApiKey: async () => {},
  deleteApiKey: async () => {},
  hasApiKey: async () => false,
  deleteAllApiKeys: async () => {},
  maskApiKey: (key: string) =>
    key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : "***",
}));

// ── Mock global fetch ─────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockApiKeys.clear();
  mockFetch.mockReset();
});

// ── Test fixtures ─────────────────────────────────────────────────────────

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
      skills: ["TypeScript", "React", "Node.js", "CSS"],
      descriptionClean: "Looking for a Senior Frontend Developer...",
    },
    profile: {
      summary: "Frontend developer with 5 years experience.",
      targetTitles: ["Senior Frontend Developer"],
      mustHaveSkills: ["TypeScript", "React", "Node.js"],
      niceToHaveSkills: ["GraphQL"],
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
    resumeHighlights: "Led team of 5 developers.",
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

function makeSuccessResponse(
  content: string,
  usage?: { prompt_tokens: number; completion_tokens: number },
): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "chatcmpl-123",
      object: "chat.completion",
      created: Date.now(),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: usage ?? {
        prompt_tokens: 500,
        completion_tokens: 200,
        total_tokens: 700,
      },
    }),
  } as unknown as Response;
}

function makeErrorResponse(status: number, errorMessage: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({
      error: { message: errorMessage, type: "api_error" },
    }),
  } as unknown as Response;
}

/** Build a valid analysis JSON response with all required fields. */
function analysisJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    confidence: "medium",
    fitScore: 70,
    recommendation: "consider",
    fitReasons: ["Reasonable match"],
    riskFlags: [],
    missingSkills: [],
    questionsForHR: [],
    ...overrides,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("OpenAILLMProvider", () => {
  describe("id", () => {
    it("has openai provider id", () => {
      const provider = new OpenAILLMProvider();
      expect(provider.id).toBe("openai");
    });

    it("accepts custom model in constructor", () => {
      const provider = new OpenAILLMProvider("gpt-4o-mini");
      expect(provider.id).toBe("openai");
    });
  });

  describe("analyzeVacancy", () => {
    it("throws when no API key is configured", async () => {
      const provider = new OpenAILLMProvider();
      await expect(provider.analyzeVacancy(makeVacancyInput())).rejects.toThrow(
        "API key not configured",
      );
    });

    it("calls OpenAI API with correct parameters", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse(
          analysisJson({
            fitScore: 78,
            recommendation: "consider",
            fitReasons: ["Good match on skills"],
            missingSkills: ["GraphQL"],
            questionsForHR: ["Какой уровень зарплаты?"],
          }),
        ),
      );

      const provider = new OpenAILLMProvider();
      const result = await provider.analyzeVacancy(makeVacancyInput());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(fetchCall[0]).toBe("https://api.openai.com/v1/chat/completions");

      const body = JSON.parse(fetchCall[1].body as string);
      expect(body.model).toBe("gpt-4o");
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[1].role).toBe("user");

      const headers = fetchCall[1].headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer sk-test-key");

      expect(result.fitScore).toBe(78);
      expect(result.recommendation).toBe("consider");
      expect(result.provider).toBe("openai");
      expect(result.model).toBe("gpt-4o");
    });

    it("returns valid analysis for apply recommendation", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse(
          analysisJson({
            fitScore: 88,
            recommendation: "apply",
            fitReasons: ["Skills match requirements", "5 years experience"],
          }),
        ),
      );

      const provider = new OpenAILLMProvider();
      const result = await provider.analyzeVacancy(makeVacancyInput());

      expect(result.fitScore).toBe(88);
      expect(result.recommendation).toBe("apply");
      expect(result.fitReasons.length).toBeGreaterThanOrEqual(2);
      expect(result.confidence).toBeDefined();
    });

    it("attaches token usage from API response", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse(
          analysisJson({ fitScore: 65, recommendation: "consider" }),
          { prompt_tokens: 800, completion_tokens: 300 },
        ),
      );

      const provider = new OpenAILLMProvider();
      const result = await provider.analyzeVacancy(makeVacancyInput());

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage!.inputTokens).toBe(800);
      expect(result.tokenUsage!.outputTokens).toBe(300);
      expect(result.tokenUsage!.estimatedCostUsd).toBeGreaterThan(0);
    });

    it("handles 401 unauthorized error", async () => {
      mockApiKeys.set("openai", "sk-invalid-key");
      mockFetch.mockResolvedValueOnce(
        makeErrorResponse(401, "Incorrect API key provided"),
      );

      const provider = new OpenAILLMProvider();
      await expect(provider.analyzeVacancy(makeVacancyInput())).rejects.toThrow(
        "Invalid API key",
      );
    });

    it("handles 429 rate limit error", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeErrorResponse(429, "Rate limit exceeded"),
      );

      const provider = new OpenAILLMProvider();
      await expect(provider.analyzeVacancy(makeVacancyInput())).rejects.toThrow(
        "Rate limit exceeded",
      );
    });

    it("handles 402 insufficient credits error", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeErrorResponse(402, "Insufficient credits"),
      );

      const provider = new OpenAILLMProvider();
      await expect(provider.analyzeVacancy(makeVacancyInput())).rejects.toThrow(
        "Insufficient credits",
      );
    });

    it("handles non-JSON response by falling back gracefully", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse("This is not JSON, just some text."),
      );

      const provider = new OpenAILLMProvider();
      const result = await provider.analyzeVacancy(makeVacancyInput());
      expect(result).toBeDefined();
      expect(result.provider).toBe("openai");
      // Fallback has low score
      expect(result.fitScore).toBeLessThanOrEqual(20);
    });

    it("includes strict privacy info in prompt", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse(analysisJson({ fitScore: 50 })),
      );

      const provider = new OpenAILLMProvider();
      const input = makeVacancyInput({ strictPrivacy: true });
      await provider.analyzeVacancy(input);

      const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(fetchCall[1].body as string);
      expect(body.messages[1].content).toContain("strict");
    });
  });

  describe("generateCoverLetter", () => {
    it("throws when no API key is configured", async () => {
      const provider = new OpenAILLMProvider();
      await expect(
        provider.generateCoverLetter(makeCoverLetterInput()),
      ).rejects.toThrow("API key not configured");
    });

    it("calls OpenAI API and returns letter text", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      const letterText =
        "Здравствуйте,\n\nМеня заинтересовала вакансия Senior Frontend Developer в компании Tech Corp.";
      mockFetch.mockResolvedValueOnce(makeSuccessResponse(letterText));

      const provider = new OpenAILLMProvider();
      const result = await provider.generateCoverLetter(makeCoverLetterInput());

      expect(result).toContain("Здравствуйте");
      expect(result).toContain("Senior Frontend Developer");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(fetchCall[1].body as string);
      expect(body.messages).toHaveLength(2);
    });

    it("post-processes letter to enforce constraints", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse(
          "**Здравствуйте!** 🎉\n\nЯ *очень* хочу работать у вас.",
        ),
      );

      const provider = new OpenAILLMProvider();
      const input = makeCoverLetterInput({
        constraints: {
          noEmoji: true,
          noMarkdown: true,
          noSpecialChars: false,
          maxChars: 500,
        },
      });

      const result = await provider.generateCoverLetter(input);

      expect(result).not.toContain("🎉");
      expect(result).not.toContain("**");
      expect(result).not.toContain("*");
    });

    it("truncates letter exceeding maxChars", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      const longText = "A".repeat(2000);
      mockFetch.mockResolvedValueOnce(makeSuccessResponse(longText));

      const provider = new OpenAILLMProvider();
      const input = makeCoverLetterInput({
        constraints: {
          noEmoji: false,
          noMarkdown: false,
          noSpecialChars: false,
          maxChars: 500,
        },
      });

      const result = await provider.generateCoverLetter(input);
      expect(result.length).toBeLessThanOrEqual(510);
    });

    it("includes language preference in prompt", async () => {
      mockApiKeys.set("openai", "sk-test-key");
      mockFetch.mockResolvedValueOnce(
        makeSuccessResponse("Dear Hiring Manager, I am interested..."),
      );

      const provider = new OpenAILLMProvider();
      const input = makeCoverLetterInput({ language: "en" });
      await provider.generateCoverLetter(input);

      const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(fetchCall[1].body as string);
      expect(body.messages[1].content).toContain("английский");
    });
  });
});

// ── estimateCost ──────────────────────────────────────────────────────────

describe("estimateCost", () => {
  it("returns cost for gpt-4o", () => {
    const cost = estimateCost("gpt-4o", 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.1);
  });

  it("returns cost for gpt-4o-mini", () => {
    const cost = estimateCost("gpt-4o-mini", 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.01);
  });

  it("returns 0 for unknown model", () => {
    expect(estimateCost("unknown-model", 1000, 500)).toBe(0);
  });

  it("returns 0 for zero tokens", () => {
    expect(estimateCost("gpt-4o", 0, 0)).toBe(0);
  });

  it("gpt-4o-mini is cheaper than gpt-4o", () => {
    const cost4o = estimateCost("gpt-4o", 10000, 5000);
    const costMini = estimateCost("gpt-4o-mini", 10000, 5000);
    expect(costMini).toBeLessThan(cost4o);
  });

  it("returns non-zero cost for gpt-4-turbo", () => {
    const cost = estimateCost("gpt-4-turbo", 5000, 2000);
    expect(cost).toBeGreaterThan(0);
  });

  it("returns non-zero cost for gpt-4", () => {
    const cost = estimateCost("gpt-4", 5000, 2000);
    expect(cost).toBeGreaterThan(0);
  });

  it("returns non-zero cost for gpt-3.5-turbo", () => {
    const cost = estimateCost("gpt-3.5-turbo", 5000, 2000);
    expect(cost).toBeGreaterThan(0);
  });
});
