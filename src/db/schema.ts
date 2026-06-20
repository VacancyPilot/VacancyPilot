/**
 * Dexie schema v2 — single source of truth for IndexedDB stores and indexes.
 *
 * Schema follows the master spec section 10.15.
 * Changing this requires a new version() migration.
 *
 * v2 adds [source+sourceVacancyId] compound index on jobs for stable upsert.
 */

export const SCHEMA_V1 = {
  jobs: "&id, source, sourceVacancyId, companyId, status, selectedProfileId, firstSeenAt, updatedAt, descriptionHash",
  companies: "&id, sourceCompanyId, name, status, updatedAt",
  profiles: "&id, name, updatedAt",
  resumes: "&id, profileId, hhResumeId, updatedAt",
  coverLetters: "&id, jobId, profileId, resumeId, isFinal, updatedAt",
  applications: "&id, jobId, status, appliedAt, updatedAt",
  events: "&id, type, jobId, createdAt, sentToN8n, n8nStatus",
  aiCache: "&id, inputHash, kind, provider, model, promptVersion, createdAt",
  meta: "&key",
} as const;

/** v2 adds [source+sourceVacancyId] compound index on jobs. */
export const SCHEMA_V2 = {
  ...SCHEMA_V1,
  jobs: "&id, [source+sourceVacancyId], source, sourceVacancyId, companyId, status, selectedProfileId, firstSeenAt, updatedAt, descriptionHash",
} as const;

export type TableName = keyof typeof SCHEMA_V1;

export const TABLE_NAMES = Object.keys(SCHEMA_V1) as TableName[];

/** v3 adds labsActions store for Labs control plane action log. */
export const SCHEMA_V3 = {
  ...SCHEMA_V2,
  labsActions: "&id, type, jobId, createdAt",
} as const;

export const SCHEMA_VERSION = 3;
