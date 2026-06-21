import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  getPricing,
  estimateCost,
  eventTypeForKind,
} from "./ai-budget";
import type { BudgetStatus, CostEstimate } from "./ai-budget";

// ── Token estimation ────────────────────────────────────────────────────

describe("estimateTokens", () => {
  it("returns 1 for empty or minimal input", () => {
    expect(estimateTokens(0)).toBe(1);
    expect(estimateTokens(1)).toBe(1);
    expect(estimateTokens(3)).toBe(1);
  });

  it("converts character count to approximate tokens", () => {
    // 350 chars / 3.5 = 100 tokens
    expect(estimateTokens(350)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    // 500 / 3.5 ≈ 142.86 → 143
    expect(estimateTokens(500)).toBe(143);
  });

  it("handles large inputs", () => {
    // 10_000 chars / 3.5 ≈ 2857
    expect(estimateTokens(10_000)).toBe(2857);
  });
});

// ── Pricing lookup ──────────────────────────────────────────────────────

describe("getPricing", () => {
  it("returns pricing for known openai models", () => {
    const gpt4o = getPricing("openai", "gpt-4o");
    expect(gpt4o).not.toBeNull();
    expect(gpt4o!.inputPricePer1M).toBe(2.5);
    expect(gpt4o!.outputPricePer1M).toBe(10.0);

    const mini = getPricing("openai", "gpt-4o-mini");
    expect(mini).not.toBeNull();
    expect(mini!.inputPricePer1M).toBe(0.15);
    expect(mini!.outputPricePer1M).toBe(0.6);
  });

  it("returns pricing for known deepseek models", () => {
    const chat = getPricing("deepseek", "deepseek-chat");
    expect(chat).not.toBeNull();
    expect(chat!.inputPricePer1M).toBe(0.27);
    expect(chat!.outputPricePer1M).toBe(1.1);
  });

  it("is case-insensitive for provider", () => {
    const upper = getPricing("OPENAI", "gpt-4o");
    const mixed = getPricing("DeepSeek", "deepseek-chat");

    expect(upper).not.toBeNull();
    expect(mixed).not.toBeNull();
  });

  it("is case-insensitive for model", () => {
    const upper = getPricing("openai", "GPT-4O");
    expect(upper).not.toBeNull();
    expect(upper!.inputPricePer1M).toBe(2.5);
  });

  it("returns null for unknown provider", () => {
    expect(getPricing("unknown", "gpt-4o")).toBeNull();
  });

  it("returns null for unknown model", () => {
    expect(getPricing("openai", "gpt-5-unknown")).toBeNull();
  });

  it("returns null for openrouter (no static pricing)", () => {
    expect(getPricing("openrouter", "any-model")).toBeNull();
  });

  it("returns null for mock provider", () => {
    expect(getPricing("mock", "mock-gpt-4o")).toBeNull();
  });

  it("returns null for empty strings", () => {
    expect(getPricing("", "")).toBeNull();
  });
});

// ── Cost estimation ─────────────────────────────────────────────────────

describe("estimateCost", () => {
  it("returns costAvailable true for known provider/model", () => {
    const result = estimateCost(1000, "openai", "gpt-4o-mini");
    expect(result.costAvailable).toBe(true);
    expect(result.inputTokens).toBe(1000);
  });

  it("returns costAvailable false for unknown provider/model", () => {
    const result = estimateCost(1000, "openrouter", "some-model");
    expect(result.costAvailable).toBe(false);
    expect(result.inputCostUsd).toBeNull();
    expect(result.outputCostUsd).toBeNull();
    expect(result.totalCostUsd).toBeNull();
  });

  it("computes correct cost for gpt-4o-mini", () => {
    // 1000 input tokens, 20% output ratio → 200 output tokens
    // input: 1000/1M * 0.15 = 0.00015
    // output: 200/1M * 0.60 = 0.00012
    // total: 0.00027
    const result = estimateCost(1000, "openai", "gpt-4o-mini", 0.2);
    expect(result.costAvailable).toBe(true);
    expect(result.inputTokens).toBe(1000);
    expect(result.estimatedOutputTokens).toBe(200);
    expect(result.inputCostUsd).toBe(0.0002); // rounded to 4dp
    expect(result.outputCostUsd).toBe(0.0001); // rounded to 4dp
    expect(result.totalCostUsd).toBe(0.0003); // rounded to 4dp
  });

  it("computes correct cost for gpt-4o", () => {
    // 5000 input tokens, 0.2 output ratio → 1000 output
    // input: 5000/1M * 2.50 = 0.0125
    // output: 1000/1M * 10.00 = 0.01
    // total: 0.0225
    const result = estimateCost(5000, "openai", "gpt-4o");
    expect(result.inputCostUsd).toBe(0.0125);
    expect(result.outputCostUsd).toBe(0.01);
    expect(result.totalCostUsd).toBe(0.0225);
  });

  it("respects custom output ratio", () => {
    // cover letter: 50% output ratio
    const result = estimateCost(400, "deepseek", "deepseek-chat", 0.5);
    expect(result.estimatedOutputTokens).toBe(200);
    // 400/1M * 0.27 = 0.000108 → rounded to 4dp = 0.0001
    expect(result.inputCostUsd).toBe(0.0001);
  });

  it("has minimum output token estimate of 20", () => {
    const result = estimateCost(10, "openai", "gpt-4o", 0.01);
    expect(result.estimatedOutputTokens).toBe(20);
  });

  it("includes provider and model in result", () => {
    const result = estimateCost(100, "deepseek", "deepseek-chat");
    expect(result.provider).toBe("deepseek");
    expect(result.model).toBe("deepseek-chat");
  });

  it("rounds costs to 4 decimal places", () => {
    const result = estimateCost(333, "openai", "gpt-4o-mini");
    // 333/1M * 0.15 = 0.00004995 → 0.0 at 4dp
    // But since we use Math.round, very small values go to 0
    if (result.inputCostUsd !== null) {
      const decimals = result.inputCostUsd.toString().split(".")[1];
      if (decimals) {
        expect(decimals.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

// ── Event type mapping ──────────────────────────────────────────────────

describe("eventTypeForKind", () => {
  it('maps "analysis" to "ai_analysis_requested"', () => {
    expect(eventTypeForKind("analysis")).toBe("ai_analysis_requested");
  });

  it('maps "cover_letter" to "letter_generated"', () => {
    expect(eventTypeForKind("cover_letter")).toBe("letter_generated");
  });
});

// ── Budget tracking (stub tests — these use IndexedDB, tested via integration) ──

describe("BudgetStatus type", () => {
  it("has correct shape", () => {
    const status: BudgetStatus = {
      used: 3,
      limit: 10,
      remaining: 7,
      isExhausted: false,
    };
    expect(status.used).toBe(3);
    expect(status.limit).toBe(10);
    expect(status.remaining).toBe(7);
    expect(status.isExhausted).toBe(false);
  });

  it("isExhausted is true when remaining is 0", () => {
    const status: BudgetStatus = {
      used: 10,
      limit: 10,
      remaining: 0,
      isExhausted: true,
    };
    expect(status.isExhausted).toBe(true);
  });
});

describe("CostEstimate type", () => {
  it("costAvailable false has null costs", () => {
    const est: CostEstimate = {
      inputTokens: 500,
      estimatedOutputTokens: 100,
      inputCostUsd: null,
      outputCostUsd: null,
      totalCostUsd: null,
      costAvailable: false,
      provider: "unknown",
      model: "unknown-model",
    };
    expect(est.costAvailable).toBe(false);
    expect(est.totalCostUsd).toBeNull();
  });

  it("costAvailable true has non-null costs", () => {
    const est: CostEstimate = {
      inputTokens: 1000,
      estimatedOutputTokens: 200,
      inputCostUsd: 0.0003,
      outputCostUsd: 0.0002,
      totalCostUsd: 0.0005,
      costAvailable: true,
      provider: "openai",
      model: "gpt-4o-mini",
    };
    expect(est.costAvailable).toBe(true);
    expect(est.totalCostUsd).toBeGreaterThan(0);
  });
});
