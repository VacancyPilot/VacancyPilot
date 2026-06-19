/**
 * Dexie schema v1 — single source of truth for IndexedDB stores and indexes.
 *
 * Schema follows the master spec section 10.15.
 * Changing this requires a new version() migration.
 */

export const SCHEMA_V1 = {
  jobs: '&id, source, sourceVacancyId, companyId, status, selectedProfileId, firstSeenAt, updatedAt, descriptionHash',
  companies: '&id, sourceCompanyId, name, status, updatedAt',
  profiles: '&id, name, updatedAt',
  resumes: '&id, profileId, hhResumeId, updatedAt',
  coverLetters: '&id, jobId, profileId, resumeId, isFinal, updatedAt',
  applications: '&id, jobId, status, appliedAt, updatedAt',
  events: '&id, type, jobId, createdAt, sentToN8n, n8nStatus',
  aiCache: '&id, inputHash, kind, provider, model, promptVersion, createdAt',
  meta: '&key',
} as const;

export type TableName = keyof typeof SCHEMA_V1;

export const TABLE_NAMES = Object.keys(SCHEMA_V1) as TableName[];

export const SCHEMA_VERSION = 1;
