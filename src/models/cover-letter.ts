import type { CoverLetterConstraints } from "./profile";

export type { CoverLetterConstraints };

export type CoverLetterMode =
  | "tg_short"
  | "hh_standard"
  | "confident"
  | "very_short"
  | "en";

/**
 * Draft provenance tracks the review lifecycle of a cover letter.
 * - ai_generated: raw AI output, not yet reviewed by the user
 * - edited: user has modified the text after generation
 * - final: user has explicitly marked as ready to send
 */
export type DraftProvenance = "ai_generated" | "edited" | "final";

export interface CoverLetterVersion {
  bodyText: string;
  createdAt: string;
  source: "template" | "ai" | "manual_edit";
  aiProvider?: string;
  aiModel?: string;
  promptVersion?: string;
}

export interface CoverLetter {
  id: string;
  jobId: string;
  profileId?: string;
  resumeId?: string;

  mode: CoverLetterMode;

  constraints: CoverLetterConstraints;

  bodyText: string;
  isFinal: boolean;

  source: "template" | "ai" | "manual_edit";
  aiProvider?: string;
  aiModel?: string;
  promptVersion?: string;

  /** Review-lifecycle provenance. Distinct from `source` which tracks origin. */
  provenance: DraftProvenance;

  versions: CoverLetterVersion[];

  createdAt: string;
  updatedAt: string;
}
