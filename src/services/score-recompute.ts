import type { Job } from "@/models/job";
import type { Profile } from "@/models/profile";
import { scoreJob } from "./scoring";
import { jobRepo, profileRepo } from "@/db/repositories";
import { loadSettings } from "@/db/settings-bridge";

/**
 * Persist badge state to chrome.storage.local so the content script
 * can read it on page load (content scripts cannot access Dexie directly).
 */
function badgeStorageKey(vacancyId: string): string {
  return `badge_v1_hh_${vacancyId}`;
}

async function persistBadgeState(vacancyId: string, job: Job): Promise<void> {
  try {
    const key = badgeStorageKey(vacancyId);
    await chrome.storage.local.set({
      [key]: {
        score: job.ruleScore?.total,
        status: job.status,
      },
    });
  } catch {
    // Non-critical.
  }
}

/**
 * Find the best matching profile for a job.
 *
 * Priority:
 * 1. Explicit profileId argument
 * 2. job.selectedProfileId
 * 3. Settings defaultProfileId
 * 4. First available profile
 *
 * Returns undefined if no profile exists.
 */
async function resolveProfile(
  explicitProfileId?: string,
  jobSelectedProfileId?: string,
): Promise<Profile | undefined> {
  const lookupId = explicitProfileId ?? jobSelectedProfileId;
  if (lookupId) {
    const profile = await profileRepo.getById(lookupId);
    if (profile) return profile;
  }

  const settings = await loadSettings();
  if (settings.general.defaultProfileId) {
    const profile = await profileRepo.getById(settings.general.defaultProfileId);
    if (profile) return profile;
  }

  const profiles = await profileRepo.list();
  return profiles[0];
}

/**
 * Recompute and persist the rule-based score for a job.
 *
 * - Loads the job from Dexie.
 * - Resolves the best profile (explicit > selected > default > first).
 * - Computes the deterministic `ruleScore` via `scoreJob()`.
 * - Persists the updated job and badge state to chrome.storage.local.
 * - Returns the updated Job, or null if the job was not found.
 *
 * Callers that also need live badge updates (content script messaging)
 * should handle `chrome.tabs.sendMessage` separately — this function
 * only handles persistence.
 */
export async function recomputeScoreForJob(
  jobId: string,
  explicitProfileId?: string,
): Promise<Job | null> {
  const job = await jobRepo.getById(jobId);
  if (!job) return null;

  const profile = await resolveProfile(explicitProfileId, job.selectedProfileId);
  if (!profile) {
    // No profile available — score stays undefined.
    return job;
  }

  const scoreResult = scoreJob(job, profile);
  const updated: Job = {
    ...job,
    ruleScore: scoreResult,
    selectedProfileId: profile.id,
    updatedAt: new Date().toISOString(),
  };

  await jobRepo.save(updated);

  // Persist badge state so the content script picks up the new score on page load.
  // The vacancyId is the part after "hh_" in the job ID.
  const vacancyId = job.sourceVacancyId;
  await persistBadgeState(vacancyId, updated);

  return updated;
}
