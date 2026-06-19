import { db } from "./database";
import type { Job } from "@/models/job";
import type { Profile } from "@/models/profile";

/**
 * Thin CRUD helpers for key domain entities.
 *
 * These are convenience wrappers around Dexie tables.
 * Complex queries should be added here as the product grows.
 */

// ---- Job repository ----

export const jobRepo = {
  list: () => db.jobs.toArray(),

  getById: (id: string) => db.jobs.get(id as Job["id"]),

  /** Insert or update a job (upsert by id). */
  save: (job: Job) => db.jobs.put(job),

  /** Bulk upsert — useful for import/search triage. */
  bulkSave: (jobs: Job[]) => db.jobs.bulkPut(jobs),

  delete: (id: string) => db.jobs.delete(id as Job["id"]),

  /** Count jobs by status. */
  countByStatus: (status: string) =>
    db.jobs.where("status").equals(status).count(),

  /** Find jobs by company. */
  listByCompany: (companyId: string) =>
    db.jobs.where("companyId").equals(companyId).toArray(),

  /** Find jobs updated after a given timestamp. */
  listUpdatedAfter: (iso: string) =>
    db.jobs.where("updatedAt").above(iso).toArray(),

  /** Find a job by source and source vacancy id. Returns undefined if not found. */
  findBySourceVacancy: (source: string, sourceVacancyId: string) =>
    db.jobs.where({ source, sourceVacancyId }).first(),
};

// ---- Profile repository ----

export const profileRepo = {
  list: () => db.profiles.toArray(),

  getById: (id: string) => db.profiles.get(id as Profile["id"]),

  save: (profile: Profile) => db.profiles.put(profile),

  delete: (id: string) => db.profiles.delete(id as Profile["id"]),
};
