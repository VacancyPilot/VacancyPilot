// ── HR Reply Classification ──
// Heuristic classification of visible HR communication text
// into reply types. No AI, no network — pure local logic.
//
// Spec: sections Phase 5, 3.6 (Works without AI)

import type { HrReplyType } from "@/models/hr-timeline";

/**
 * Classification input: visible text and optional status badge.
 */
export interface ClassificationInput {
  /** Visible text content from the communication block */
  text: string;

  /** Optional visible status badge/label (e.g. "Приглашение", "Отказ") */
  statusBadge?: string | null;
}

/**
 * Classification result with confidence indicator.
 */
export interface ClassificationResult {
  type: HrReplyType;
  /** Which rule(s) matched (for debugging / transparency) */
  matchedRules: string[];
}

/**
 * Classify a visible HR communication text into a reply type.
 *
 * Priority order:
 * 1. Status badge — highest signal (explicit HH labels)
 * 2. Strong keyword patterns with context disambiguation
 * 3. Fallback to "unknown"
 */
export function classifyHrReply(
  input: ClassificationInput,
): ClassificationResult {
  const { text, statusBadge } = input;
  const matchedRules: string[] = [];

  // ── Level 1: Status badge (explicit HH UI labels) ─────────────────

  if (statusBadge) {
    const badgeLower = statusBadge.toLowerCase();

    // invitation — explicit invitation badge
    if (matchesAny(badgeLower, invitationBadgePatterns)) {
      matchedRules.push("badge:invitation");
      return { type: "invitation", matchedRules };
    }

    // rejection — explicit rejection badge
    if (matchesAny(badgeLower, rejectionBadgePatterns)) {
      matchedRules.push("badge:rejection");
      return { type: "rejection", matchedRules };
    }

    // test_task — explicit test task badge
    if (matchesAny(badgeLower, testTaskBadgePatterns)) {
      matchedRules.push("badge:test_task");
      return { type: "test_task", matchedRules };
    }
  }

  // ── Level 2: Content-based heuristics (ordered by specificity) ───

  const textLower = text.toLowerCase();

  // test_task — test task patterns in content
  if (matchesAny(textLower, testTaskContentPatterns)) {
    matchedRules.push("content:test_task");
    return { type: "test_task", matchedRules };
  }

  // invitation — invitation to interview / next steps
  if (matchesAny(textLower, invitationContentPatterns)) {
    matchedRules.push("content:invitation");
    return { type: "invitation", matchedRules };
  }

  // interview — scheduled interview details (date, time, logistics)
  // Distinguished from invitation: "назначено собеседование" vs "приглашаем"
  if (matchesAny(textLower, interviewContentPatterns)) {
    matchedRules.push("content:interview");
    return { type: "interview", matchedRules };
  }

  // rejection — refusal / decline patterns
  if (matchesAny(textLower, rejectionContentPatterns)) {
    matchedRules.push("content:rejection");
    return { type: "rejection", matchedRules };
  }

  // question — clarifying question from HR
  if (matchesAny(textLower, questionContentPatterns)) {
    matchedRules.push("content:question");
    return { type: "question", matchedRules };
  }

  // ── Fallback ─────────────────────────────────────────────────────
  return { type: "unknown", matchedRules: ["fallback:unknown"] };
}

// ── Pattern collections ────────────────────────────────────────────

/** Badge text patterns indicating an invitation */
const invitationBadgePatterns = [
  /приглашен/i,
  /приглашение/i,
  /invitation/i,
  /invited/i,
];

/** Badge text patterns indicating a rejection */
const rejectionBadgePatterns = [
  /отказ/i,
  /отклонен/i,
  /rejected/i,
  /declined/i,
];

/** Badge text patterns indicating a test task */
const testTaskBadgePatterns = [/тестовое задание/i, /test task/i, /тестовое/i];

/** Content patterns for test task detection */
const testTaskContentPatterns = [
  /тестовое задание/i,
  /test task/i,
  /technical task/i,
  /выполните тестовое/i,
  /пришлите решение/i,
  /прикрепляйте.*задание/i,
  /во вложении.*задание/i,
  /ссылка на тестовое/i,
  /результат.*тестов/i,
];

/** Content patterns for invitation detection */
const invitationContentPatterns = [
  /приглашаем.*собеседование/i,
  /приглашаем.*интервью/i,
  /пригласить.*собеседование/i,
  /хотим пригласить/i,
  /invite.*interview/i,
  /we would like to invite/i,
  /рады пригласить/i,
  /приглашение на/i,
];

/** Content patterns for interview details (scheduled, not invitation) */
const interviewContentPatterns = [
  /назначено собеседование/i,
  /дата собеседования/i,
  /время собеседования/i,
  /собеседование состоится/i,
  /подтверждаем собеседование/i,
  /напоминаем о собеседовании/i,
  /interview scheduled/i,
  /interview date/i,
  /interview time/i,
  /интервью.*назначен/i,
  /собеседование.*назначен/i,
];

/** Content patterns for rejection detection */
const rejectionContentPatterns = [
  /к сожалению.*отказ/i,
  /вынуждены отказать/i,
  /не можем.*продолжить/i,
  /решили.*другого кандидата/i,
  /решили.*другим кандидатом/i,
  /продолжить.*другим кандидатом/i,
  /отказано/i,
  /ваша кандидатура.*отклонена/i,
  /к сожалению.*не готовы/i,
  /unfortunately.*reject/i,
  /we regret to inform/i,
  /decided to move forward with other/i,
  /not selected/i,
  /not moving forward/i,
  /decline.*candid/i,
];

/** Content patterns for question detection */
const questionContentPatterns = [
  /уточнить|уточните|уточнение/i,
  /вопрос|вопросы/i,
  /подскажите|расскажите/i,
  /не могли бы вы/i,
  /хотели бы узнать/i,
  /можете ли вы/i,
  /clarify|clarification/i,
  /question/i,
  /could you/i,
  /would you/i,
  /tell us more about/i,
  /please provide/i,
];

// ── Helpers ─────────────────────────────────────────────────────────

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}
