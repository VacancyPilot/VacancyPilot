// --- Duplicate detection model ---

import type { Job } from "./job";

/** A pair of jobs identified as potential duplicates. */
export interface DuplicateCandidate {
  /** The original job (earlier firstSeenAt). */
  jobA: Job;

  /** The suspected duplicate job (later firstSeenAt). */
  jobB: Job;

  /** Title similarity score (0–1). 1 = identical. */
  titleSimilarity: number;

  /** Whether both jobs belong to the same company. */
  sameCompany: boolean;

  /** Whether both jobs share the same source URL. */
  sameUrl: boolean;

  /** Whether both jobs share the same description hash. */
  sameDescriptionHash: boolean;

  /** Combined duplicate confidence (0–1). */
  confidence: number;
}

/** Reasons explaining why two jobs are flagged as duplicates. */
export type DuplicateReason =
  | "same_url"
  | "same_description_hash"
  | "same_company_similar_title"
  | "very_similar_title"
  | "similar_title_same_city";
