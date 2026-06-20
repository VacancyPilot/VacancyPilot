// --- Adapter contract types ---
// Phase 0–1: only HHAdapter is implemented.

export type SourceSite =
  | "hh"
  | "linkedin"
  | "indeed"
  | "djinni"
  | "rabota_md"
  | "greenhouse"
  | "lever"
  | "workday";

export type PageKind =
  | "vacancy"
  | "search"
  | "applications"
  | "messages"
  | null;

// --- Raw extraction DTOs ---

/** Visible search card DTO. Phase 2 — only fields visible on the search-result card. */
export interface RawSearchItemDTO {
  sourceId: string;
  title: string | null;
  companyName: string | null;
  url: string | null;
  salaryRaw: string | null;
  city: string | null;
  experienceRaw: string | null;
  workMode: "remote" | "hybrid" | "office" | "unknown" | null;
  publicationDate: string | null;
}

/** Aligned with PassiveHHStatus from models. Real extraction comes later. */
export interface ApplicationStatusSync {
  detectedApplied?: boolean;
  detectedViewedByEmployer?: boolean;
  detectedInvitation?: boolean;
  detectedRejected?: boolean;
  rawLabel?: string;
  detectedAt: string;
}

// --- Adapter interface ---
// Methods for form filling are excluded from Core — they belong in Labs.

export interface SiteAdapter {
  siteId: SourceSite;
  matchUrl(url: string): PageKind;
  extractVacancy(doc: Document): import("./hh/types").RawVacancyDTO | null;
  extractSearchList(doc: Document): RawSearchItemDTO[];
  extractVisibleApplicationStatus?(
    doc: Document,
  ): Partial<ApplicationStatusSync> | null;
}
