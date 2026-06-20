// ── HR Timeline data model ──
// Local, read-only representation of HR communication events
// extracted from user-opened HH application / negotiation pages.
//
// Spec: sections Phase 5, 24.3

/**
 * Classification of an HR reply/communication entry.
 * Determined by heuristic analysis of visible text content.
 */
export type HrReplyType =
  | "invitation" // Приглашение на собеседование / invitation to interview
  | "rejection" // Отказ / rejection
  | "question" // Вопрос от HR / clarifying question
  | "test_task" // Тестовое задание / test task
  | "interview" // Информация о собеседовании (дата, время) / interview details
  | "unknown"; // Не удалось классифицировать / unclassified

/**
 * A single HR communication event extracted from a user-opened page.
 * Linked to an Application and stored locally in IndexedDB.
 */
export interface HrTimelineEntry {
  id: string;

  /** Foreign key to Application.id */
  applicationId: string;

  /** Classified reply type */
  type: HrReplyType;

  /** Sanitized visible text content (no HH markup, no personal data beyond what's visible) */
  rawText: string;

  /** Sanitized HTML snippet of the message block (tags stripped to safe subset) */
  rawHtml: string | null;

  /** URL of the page where this entry was extracted */
  sourceUrl: string;

  /** Which HH surface was parsed */
  sourcePage: "applications" | "messages" | "negotiations";

  /** ISO 8601 timestamp of extraction */
  extractedAt: string;

  /** Whether the user has marked this entry as read */
  isRead: boolean;

  /** Optional user notes */
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Raw DTO extracted from the DOM before normalization into HrTimelineEntry.
 * Fields are nullable — the parser must not crash on missing data.
 */
export interface RawHrTimelineDTO {
  /** Visible text of the communication block */
  text: string | null;

  /** Sanitized HTML of the communication block */
  html: string | null;

  /** Classification determined from visible indicators */
  type: HrReplyType;

  /** Any visible status badge text (e.g. "Приглашение", "Отказ") */
  statusBadge: string | null;

  /** Any visible timestamp text from the page */
  timestampText: string | null;

  /** URL of the source page */
  sourceUrl: string;

  /** Which surface was parsed */
  sourcePage: "applications" | "messages" | "negotiations";

  /** ISO 8601 extraction time */
  extractedAt: string;
}
