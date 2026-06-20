import type { CoverLetterConstraints } from "./profile";

export type { CoverLetterConstraints };

export type CoverLetterMode =
  | "tg_short"
  | "hh_standard"
  | "confident"
  | "very_short"
  | "en";

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

  versions: CoverLetterVersion[];

  createdAt: string;
  updatedAt: string;
}
