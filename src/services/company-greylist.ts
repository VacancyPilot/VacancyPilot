/**
 * Company greylist service — ITER-038.
 *
 * Manages company status controls (normal / greylist / blacklist)
 * and provides lookup functions for scoring integration.
 *
 * All operations are local-only — no HH network requests.
 */

import type { Company } from "@/models/company";
import type { Job } from "@/models/job";
import { companyRepo } from "@/db/repositories";

const SOURCE_HH = "hh" as const;

// ── Company lookup helpers ─────────────────────────────────────────────────

/**
 * Look up a company record for scoring purposes.
 *
 * Tries:
 * 1. Exact match by companyId
 * 2. Lookup by sourceCompanyId extracted from companyId pattern
 *
 * Returns undefined if no company record exists.
 */
export async function lookupCompanyForJob(job: Job): Promise<Company | undefined> {
  // Try direct lookup by companyId
  const direct = await companyRepo.getById(job.companyId);
  if (direct) return direct;

  // Try lookup by sourceCompanyId (extracted from companyId like "hh_co_emp_12345")
  const sourceCompanyId = extractSourceCompanyId(job.companyId);
  if (sourceCompanyId) {
    const bySourceId = await companyRepo.findBySourceCompanyId(
      SOURCE_HH,
      sourceCompanyId,
    );
    if (bySourceId) return bySourceId;
  }

  return undefined;
}

/**
 * Extract sourceCompanyId from a companyId like "hh_co_emp_12345".
 * Returns undefined if the id follows a name-based pattern ("hh_co_some_name").
 */
function extractSourceCompanyId(companyId: string): string | undefined {
  const match = companyId.match(/^hh_co_emp_(.+)$/);
  return match ? match[1] : undefined;
}

// ── Greylist controls ──────────────────────────────────────────────────────

/**
 * Set the status of a company, creating a record if one does not exist.
 *
 * @param companyId  - The company identifier (e.g., "hh_co_acme").
 * @param companyName - Human-readable company name.
 * @param status     - Target status: "normal", "greylist", or "blacklist".
 * @param reason     - Optional reason (used for blacklist).
 * @returns The saved Company record.
 */
export async function setCompanyStatus(
  companyId: string,
  companyName: string,
  status: Company["status"],
  reason?: string,
): Promise<Company> {
  const now = new Date().toISOString();
  const existing = await companyRepo.getById(companyId);

  const company: Company = existing
    ? {
        ...existing,
        status,
        blacklistReason: reason ?? existing.blacklistReason,
        updatedAt: now,
      }
    : {
        id: companyId,
        source: SOURCE_HH,
        sourceCompanyId: extractSourceCompanyId(companyId),
        name: companyName,
        status,
        blacklistReason: reason,
        createdAt: now,
        updatedAt: now,
      };

  await companyRepo.save(company);
  return company;
}

/**
 * Remove a company from any restriction list (reset to "normal").
 * If the company record exists, updates status to "normal".
 * If it doesn't exist, returns undefined.
 */
export async function clearCompanyStatus(
  companyId: string,
): Promise<Company | undefined> {
  const existing = await companyRepo.getById(companyId);
  if (!existing) return undefined;

  const updated: Company = {
    ...existing,
    status: "normal",
    blacklistReason: undefined,
    updatedAt: new Date().toISOString(),
  };

  await companyRepo.save(updated);
  return updated;
}

/**
 * Get all greylisted and blacklisted companies for UI display.
 */
export async function listRestrictedCompanies(): Promise<Company[]> {
  const greylist = await companyRepo.listByStatus("greylist");
  const blacklist = await companyRepo.listByStatus("blacklist");
  return [...greylist, ...blacklist];
}

/**
 * Get all companies with any status, sorted by name.
 */
export async function listAllCompanies(): Promise<Company[]> {
  return companyRepo.list();
}

/**
 * Ensure a company record exists with "normal" status.
 * Used when saving a job to create a baseline company entry
 * without overriding an existing greylist/blacklist status.
 */
export async function ensureCompanyRecord(
  companyId: string,
  companyName: string,
): Promise<Company> {
  const existing = await companyRepo.getById(companyId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const company: Company = {
    id: companyId,
    source: SOURCE_HH,
    sourceCompanyId: extractSourceCompanyId(companyId),
    name: companyName,
    status: "normal",
    createdAt: now,
    updatedAt: now,
  };

  await companyRepo.save(company);
  return company;
}

/**
 * Bulk check company statuses for an array of jobs.
 * Returns a Map of companyId → Company for every unique company
 * referenced by the given jobs.
 */
export async function bulkLookupCompanies(
  jobs: Job[],
): Promise<Map<string, Company>> {
  const companyIds = [...new Set(jobs.map((j) => j.companyId))];
  const result = new Map<string, Company>();

  await Promise.all(
    companyIds.map(async (id) => {
      const company = await companyRepo.getById(id);
      if (company) {
        result.set(id, company);
      }
    }),
  );

  return result;
}
