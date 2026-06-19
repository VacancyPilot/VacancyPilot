/**
 * AI output validation — schema check, JSON parse, fallback for AI responses.
 *
 * Section 12.7:
 * - JSON parse for AIAnalysis
 * - Schema validation
 * - Fallback on error
 * - Raw response saved only in debug mode
 * - Manual retry, not automatic infinite retry
 *
 * For cover letters:
 * - Length check
 * - Forbidden character check
 * - No markdown / no emoji enforcement
 * - Warning if AI fabricated facts
 */

import type { AIAnalysis } from "@/models/ai";
import type { CoverLetterConstraints } from "@/models/cover-letter";

// ── AIAnalysis validation ──────────────────────────────────────────────

/**
 * Valid recommendation values.
 */
const VALID_RECOMMENDATIONS = new Set<string>(["apply", "consider", "skip"]);

/**
 * Valid confidence values.
 */
const VALID_CONFIDENCES = new Set<string>(["low", "medium", "high"]);

export interface ValidationError {
  field: string;
  message: string;
}

export interface AnalysisValidationResult {
  valid: boolean;
  analysis: AIAnalysis | null;
  errors: ValidationError[];
  /** Raw JSON string — only stored when debug mode is enabled. */
  rawResponse?: string;
}

/**
 * Parse and validate a raw AI response into an AIAnalysis.
 *
 * Handles:
 * - JSON wrapped in markdown code fences (common AI mistake)
 * - Missing optional fields → defaults
 * - Wrong types → coercion or fallback
 * - Invalid recommendation/confidence → fallback to safe values
 *
 * @param raw — raw response string from AI provider
 * @param overrides — fields that the caller sets (id, jobId, profileId, etc.)
 * @param debugMode — if true, preserves rawResponse for debugging
 */
export function parseAndValidateAnalysis(
  raw: string,
  overrides: {
    id: string;
    jobId: string;
    profileId: string;
    resumeId?: string;
    provider: string;
    model: string;
    promptVersion: string;
    inputHash: string;
  },
  debugMode = false,
): AnalysisValidationResult {
  const errors: ValidationError[] = [];
  const result: AnalysisValidationResult = {
    valid: false,
    analysis: null,
    errors,
    rawResponse: debugMode ? raw : undefined,
  };

  // Step 1: Extract JSON from response
  const jsonStr = extractJson(raw);
  if (!jsonStr) {
    errors.push({ field: "root", message: "Response contains no valid JSON." });
    return result;
  }

  // Step 2: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    errors.push({
      field: "root",
      message: "Failed to parse JSON from AI response.",
    });
    return result;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    errors.push({
      field: "root",
      message: "AI response is not a JSON object.",
    });
    return result;
  }

  const obj = parsed as Record<string, unknown>;

  // Step 3: Validate and coerce required fields
  const fitScore = coerceNumber(obj.fitScore, "fitScore", 0, 100, errors);
  const recommendation = coerceRecommendation(obj.recommendation, errors);
  const confidence = coerceConfidence(obj.confidence, errors);
  const fitReasons = coerceStringArray(obj.fitReasons, "fitReasons", errors);
  const riskFlags = coerceRiskFlags(obj.riskFlags, errors);
  const missingSkills = coerceStringArray(
    obj.missingSkills,
    "missingSkills",
    errors,
  );
  const questionsForHR = coerceStringArray(
    obj.questionsForHR,
    "questionsForHR",
    errors,
  );

  // Step 4: Build the AIAnalysis
  const analysis: AIAnalysis = {
    id: overrides.id,
    jobId: overrides.jobId,
    profileId: overrides.profileId,
    resumeId: overrides.resumeId,

    provider: overrides.provider as AIAnalysis["provider"],
    model: overrides.model,
    promptVersion: overrides.promptVersion,
    inputHash: overrides.inputHash,

    fitScore,
    recommendation,
    confidence,

    fitReasons,
    riskFlags,
    missingSkills,
    questionsForHR,

    suggestedProfileId: safeString(obj.suggestedProfileId),
    suggestedResumeId: safeString(obj.suggestedResumeId),

    tokenUsage: coerceTokenUsage(obj.tokenUsage),

    createdAt: new Date().toISOString(),
  };

  result.valid = errors.length === 0;
  result.analysis = analysis;

  return result;
}

/**
 * Create a safe fallback AIAnalysis when parsing fails completely.
 */
export function createFallbackAnalysis(overrides: {
  id: string;
  jobId: string;
  profileId: string;
  resumeId?: string;
  provider: string;
  model: string;
  promptVersion: string;
  inputHash: string;
}): AIAnalysis {
  return {
    id: overrides.id,
    jobId: overrides.jobId,
    profileId: overrides.profileId,
    resumeId: overrides.resumeId,

    provider: overrides.provider as AIAnalysis["provider"],
    model: overrides.model,
    promptVersion: overrides.promptVersion,
    inputHash: overrides.inputHash,

    fitScore: 0,
    recommendation: "consider",
    confidence: "low",

    fitReasons: [
      "AI response could not be parsed. Try again or review manually.",
    ],
    riskFlags: [
      {
        code: "low_signal",
        severity: "info",
        message: "AI analysis failed — fallback result.",
      },
    ],
    missingSkills: [],
    questionsForHR: [],

    tokenUsage: undefined,
    createdAt: new Date().toISOString(),
  };
}

// ── Cover Letter validation ────────────────────────────────────────────

export interface LetterValidationResult {
  valid: boolean;
  text: string;
  warnings: string[];
  issues: string[];
}

/**
 * Validate a generated cover letter against constraints.
 *
 * Checks:
 * - Length against maxChars
 * - Emoji presence (if noEmoji is set)
 * - Markdown presence (if noMarkdown is set)
 * - Special characters (if noSpecialChars is set)
 * - Fabricated facts warning (heuristic)
 */
export function validateCoverLetter(
  text: string,
  constraints: CoverLetterConstraints,
): LetterValidationResult {
  const warnings: string[] = [];
  const issues: string[] = [];

  // Length check
  if (constraints.maxChars && text.length > constraints.maxChars) {
    issues.push(
      `Письмо превышает лимит в ${constraints.maxChars} символов (текущая длина: ${text.length}).`,
    );
  }

  // Emoji check
  if (constraints.noEmoji) {
    if (EMOJI_LIKE_RE.test(text)) {
      issues.push("Письмо содержит emoji (настройка noEmoji включена).");
    }
  }

  // Markdown check
  if (constraints.noMarkdown) {
    if (/[*_~`#]/.test(text)) {
      issues.push(
        "Письмо содержит markdown-форматирование (настройка noMarkdown включена).",
      );
    }
  }

  // Special chars check
  if (constraints.noSpecialChars) {
    if (containsDisallowedSpecialChars(text)) {
      issues.push(
        "Письмо содержит нестандартные символы (настройка noSpecialChars включена).",
      );
    }
  }

  // Fabricated facts heuristic: if the letter mentions specific years, numbers,
  // or named achievements that look fabricated
  const fabricationPatterns = [
    /\b(20\d{2})\b/g, // years like 2020, 2021
    /\bувеличил[а]?\s+на\s+\d+%/gi, // "увеличил на X%"
    /\bсократил[а]?\s+на\s+\d+%/gi, // "сократил на X%"
    /\bприв[её]л[а]?\s+\d+/gi, // "привёл X клиентов"
  ];

  for (const pattern of fabricationPatterns) {
    if (pattern.test(text)) {
      warnings.push(
        "Письмо содержит конкретные цифры/годы. Проверьте, не выдумал ли AI факты.",
      );
      break;
    }
  }

  // Empty text
  if (text.trim().length === 0) {
    issues.push("Письмо пустое.");
  }

  return {
    valid: issues.length === 0,
    text,
    warnings,
    issues,
  };
}

// ── JSON extraction ────────────────────────────────────────────────────

/**
 * Extract JSON from AI response, handling common wrapper patterns:
 * - ```json ... ```
 * - ``` ... ```
 * - Plain JSON
 */
function extractJson(raw: string): string | null {
  // Try markdown code fence with json tag
  const fenceJson = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenceJson) return fenceJson[1].trim();

  // Try markdown code fence without tag
  const fence = raw.match(/```\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();

  // Try to find JSON object boundaries
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  // Try to extract JSON object from within text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();

  return null;
}

// ── Coercion helpers ───────────────────────────────────────────────────

function coerceNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  errors: ValidationError[],
): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    if (value < min) {
      errors.push({
        field,
        message: `${field} below minimum (${value} < ${min}).`,
      });
      return min;
    }
    if (value > max) {
      errors.push({
        field,
        message: `${field} above maximum (${value} > ${max}).`,
      });
      return max;
    }
    return value;
  }

  if (typeof value === "string") {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return coerceNumber(num, field, min, max, errors);
    }
  }

  errors.push({ field, message: `${field} is not a valid number.` });
  return 0;
}

function coerceRecommendation(
  value: unknown,
  errors: ValidationError[],
): AIAnalysis["recommendation"] {
  if (typeof value === "string" && VALID_RECOMMENDATIONS.has(value)) {
    return value as AIAnalysis["recommendation"];
  }
  errors.push({
    field: "recommendation",
    message: `Invalid recommendation "${String(value)}". Fallback to "consider".`,
  });
  return "consider";
}

function coerceConfidence(
  value: unknown,
  errors: ValidationError[],
): AIAnalysis["confidence"] {
  if (typeof value === "string" && VALID_CONFIDENCES.has(value)) {
    return value as AIAnalysis["confidence"];
  }
  if (typeof value === "string") {
    // Loose match: "medium-high" → "medium"
    const lower = value.toLowerCase();
    for (const valid of VALID_CONFIDENCES) {
      if (lower.includes(valid)) return valid as AIAnalysis["confidence"];
    }
  }
  errors.push({
    field: "confidence",
    message: `Invalid confidence "${String(value)}". Fallback to "low".`,
  });
  return "low";
}

function coerceStringArray(
  value: unknown,
  field: string,
  errors: ValidationError[],
): string[] {
  if (Array.isArray(value)) {
    const arr = value.map((item) =>
      typeof item === "string" ? item : String(item),
    );
    return arr;
  }

  if (typeof value === "string") {
    return value.length > 0 ? [value] : [];
  }

  errors.push({ field, message: `${field} is not an array.` });
  return [];
}

function coerceRiskFlags(
  value: unknown,
  errors: ValidationError[],
): AIAnalysis["riskFlags"] {
  if (!Array.isArray(value)) {
    errors.push({ field: "riskFlags", message: "riskFlags is not an array." });
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    )
    .map((item) => ({
      code: (typeof item.code === "string"
        ? item.code
        : "low_signal") as AIAnalysis["riskFlags"][number]["code"],
      severity: coerceSeverity(item.severity),
      message:
        typeof item.message === "string"
          ? item.message
          : String(item.message ?? ""),
      evidence: typeof item.evidence === "string" ? item.evidence : undefined,
    }));
}

function coerceSeverity(
  value: unknown,
): AIAnalysis["riskFlags"][number]["severity"] {
  const valid = new Set(["info", "low", "medium", "high", "critical"]);
  if (typeof value === "string" && valid.has(value)) {
    return value as AIAnalysis["riskFlags"][number]["severity"];
  }
  return "info";
}

function coerceTokenUsage(value: unknown): AIAnalysis["tokenUsage"] {
  if (typeof value !== "object" || value === null) return undefined;

  const obj = value as Record<string, unknown>;
  const usage: NonNullable<AIAnalysis["tokenUsage"]> = {};

  if (typeof obj.inputTokens === "number") usage.inputTokens = obj.inputTokens;
  if (typeof obj.outputTokens === "number")
    usage.outputTokens = obj.outputTokens;
  if (typeof obj.estimatedCostUsd === "number")
    usage.estimatedCostUsd = obj.estimatedCostUsd;

  return Object.keys(usage).length > 0 ? usage : undefined;
}

function safeString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
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

function containsDisallowedSpecialChars(text: string): boolean {
  return Array.from(text).some(
    (char) =>
      !ALLOWED_EXTRA_SPECIAL_CHARS.has(char) &&
      !isAllowedBasicChar(char),
  );
}

function isAllowedBasicChar(char: string): boolean {
  return (
    /^\p{L}$/u.test(char) ||
    /^\p{N}$/u.test(char) ||
    /^\s$/u.test(char) ||
    ALLOWED_BASIC_PUNCTUATION.has(char)
  );
}
