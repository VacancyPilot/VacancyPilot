import type { Job, JobStatus } from "@/models/job";
import type { RawVacancyDTO } from "@/adapters/hh/types";
import { db } from "@/db/database";
import { jobRepo } from "@/db/repositories";
import { createStatusChange } from "./status-transitions";
import { createEventLogEntry } from "./event-log-helper";

const SOURCE_HH = "hh" as const;

/**
 * Build a stable job id from source and vacancy id.
 * Format: "hh_123456"
 */
function buildJobId(sourceVacancyId: string): string {
  return `${SOURCE_HH}_${sourceVacancyId}`;
}

/**
 * Simple 32-bit string hash (djb2 variant).
 * Used for descriptionHash to detect description changes.
 */
function hashString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * Generate a company id from a company name.
 * Temporary until sourceCompanyId extraction is added to the parser.
 */
function companyIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return `${SOURCE_HH}_co_${slug}`;
}

/**
 * Find an existing job by source vacancy id via the repository.
 * Returns undefined if no match.
 */
async function findExistingJob(
  sourceVacancyId: string,
): Promise<Job | undefined> {
  return jobRepo.findBySourceVacancy(SOURCE_HH, sourceVacancyId);
}

/**
 * Map RawVacancyDTO to a new Job domain object.
 * Caller must provide a validated, non-empty sourceVacancyId.
 */
function dtoToNewJob(dto: RawVacancyDTO, sourceVacancyId: string): Job {
  const now = new Date().toISOString();
  const descriptionClean = dto.descriptionText ?? "";

  return {
    id: buildJobId(sourceVacancyId),
    source: SOURCE_HH,
    sourceVacancyId,
    sourceUrl: dto.sourceUrl,
    canonicalUrl: undefined,

    title: dto.title ?? "",
    companyId: companyIdFromName(dto.companyName ?? "unknown"),
    companyName: dto.companyName ?? "",

    salaryRaw: dto.salaryRaw ?? undefined,
    salaryMin: dto.salaryMin ?? undefined,
    salaryMax: dto.salaryMax ?? undefined,
    salaryCurrency: dto.salaryCurrency ?? undefined,
    salaryGross: undefined,

    city: dto.city ?? undefined,
    workMode: dto.workMode ?? "unknown",
    experienceRaw: dto.experienceRaw ?? undefined,
    experienceMinYears: undefined,
    employmentType: dto.employmentType ?? undefined,
    schedule: dto.schedule ?? undefined,

    descriptionClean,
    descriptionHash: hashString(descriptionClean),
    skills: dto.skills ?? [],

    status: "saved",
    statusHistory: [createStatusChange(undefined, "saved", "system")],

    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now,
  };
}

/**
 * Persist a new event log entry to the database.
 */
async function persistEvent(
  type: "job_saved" | "status_changed",
  jobId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const entry = createEventLogEntry(type, payload, { jobId });
  await db.events.put(entry);
}

// ---- Public tracker API ----

export const tracker = {
  /**
   * Save or update a job from a parsed vacancy DTO.
   *
   * - If the job already exists (matched by source + sourceVacancyId),
   *   preserves the existing status and updates other fields.
   * - If new, creates a job with status 'saved'.
   * - Logs a job_saved event in both cases.
   * - Throws if sourceVacancyId is missing or empty.
   *
   * Returns the saved Job.
   */
  async saveFromDTO(dto: RawVacancyDTO): Promise<Job> {
    const sourceVacancyId = (dto.sourceVacancyId ?? "").trim();
    if (!sourceVacancyId) {
      throw new Error("Cannot save vacancy: sourceVacancyId is missing");
    }

    const existing = await findExistingJob(sourceVacancyId);

    if (existing) {
      const now = new Date().toISOString();
      const descriptionClean = dto.descriptionText ?? existing.descriptionClean;
      const updated: Job = {
        ...existing,
        title: dto.title ?? existing.title,
        companyName: dto.companyName ?? existing.companyName,
        salaryRaw: dto.salaryRaw ?? existing.salaryRaw,
        salaryMin: dto.salaryMin ?? existing.salaryMin,
        salaryMax: dto.salaryMax ?? existing.salaryMax,
        salaryCurrency: dto.salaryCurrency ?? existing.salaryCurrency,
        city: dto.city ?? existing.city,
        workMode: dto.workMode ?? existing.workMode,
        experienceRaw: dto.experienceRaw ?? existing.experienceRaw,
        employmentType: dto.employmentType ?? existing.employmentType,
        schedule: dto.schedule ?? existing.schedule,
        descriptionClean,
        descriptionHash: hashString(descriptionClean),
        skills: dto.skills ?? existing.skills,
        lastSeenAt: now,
        updatedAt: now,
      };

      await jobRepo.save(updated);
      await persistEvent("job_saved", updated.id, {
        title: updated.title,
        companyName: updated.companyName,
        action: "updated",
      });

      return updated;
    }

    // New job
    const job = dtoToNewJob(dto, sourceVacancyId);
    await jobRepo.save(job);
    await persistEvent("job_saved", job.id, {
      title: job.title,
      companyName: job.companyName,
      action: "created",
    });

    return job;
  },

  /**
   * Update the status of a saved job.
   *
   * - Appends a StatusChange to statusHistory.
   * - Persists the job and logs a status_changed event.
   * - Returns the updated Job, or null if the job was not found.
   */
  async updateStatus(
    jobId: string,
    newStatus: JobStatus,
    note?: string,
  ): Promise<Job | null> {
    const job = await jobRepo.getById(jobId);
    if (!job) return null;

    const now = new Date().toISOString();
    const change = createStatusChange(job.status, newStatus, "user", note);

    const updated: Job = {
      ...job,
      status: newStatus,
      statusHistory: [...job.statusHistory, change],
      updatedAt: now,
    };

    await jobRepo.save(updated);
    await persistEvent("status_changed", jobId, {
      from: change.from,
      to: change.to,
      note: change.note,
    });

    return updated;
  },
};
