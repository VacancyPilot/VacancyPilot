/**
 * Duplicate detection service — ITER-037.
 *
 * Detects potential duplicate vacancies in local data using heuristics:
 * 1. Same canonical URL or source URL
 * 2. Same description hash (re-posted vacancy)
 * 3. Same company + very similar title
 * 4. Very similar title alone (cross-company duplicates)
 *
 * All detection is local-only; no HH network requests.
 */

import type { Job } from "@/models/job";
import type { DuplicateCandidate } from "@/models/duplicate";

// ── Configuration ────────────────────────────────────────────────────────────

/** Minimum title similarity to consider two jobs as potential duplicates. */
const TITLE_SIMILARITY_THRESHOLD = 0.65;

/** Minimum combined confidence to include in results. */
const MIN_CONFIDENCE = 0.4;

// ── Title similarity (simple token-based Jaccard index) ──────────────────────

/**
 * Normalize a title for comparison:
 * - lowercase
 * - collapse whitespace
 * - remove punctuation
 * - split into tokens
 */
function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\sа-яё]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/**
 * Compute Jaccard similarity between two title token sets.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
export function titleSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeTitle(a));
  const tokensB = new Set(normalizeTitle(b));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  // Count intersection size
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union;
}

// ── Confidence scoring ───────────────────────────────────────────────────────

function computeConfidence(
  titleSim: number,
  sameCompany: boolean,
  sameUrl: boolean,
  sameDescHash: boolean,
): number {
  // Hard signals — near-certain duplicates
  if (sameUrl || sameDescHash) return Math.min(1.0, 0.9 + titleSim * 0.1);

  // Same company + high title similarity
  if (sameCompany && titleSim >= 0.8) return 0.85;

  // Same company + moderate title similarity
  if (sameCompany && titleSim >= TITLE_SIMILARITY_THRESHOLD) return 0.7;

  // High title similarity alone
  if (titleSim >= 0.9) return 0.75;

  // Moderate title similarity alone
  if (titleSim >= TITLE_SIMILARITY_THRESHOLD) return titleSim * 0.7;

  return 0;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Find duplicate candidates across all saved jobs.
 *
 * Compares each pair once (i < j). Returns candidates sorted by
 * confidence descending. Excludes jobs with blacklist status.
 */
export function detectDuplicates(jobs: Job[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  // Filter out blacklisted and rejected jobs — they are not "actionable" duplicates
  const activeJobs = jobs.filter(
    (j) => j.status !== "blacklist" && j.status !== "rejected_by_me",
  );

  for (let i = 0; i < activeJobs.length; i++) {
    for (let j = i + 1; j < activeJobs.length; j++) {
      const jobA = activeJobs[i];
      const jobB = activeJobs[j];

      // Skip if same ID (shouldn't happen but be safe)
      if (jobA.id === jobB.id) continue;

      const titleSim = titleSimilarity(jobA.title, jobB.title);
      const sameCompany = jobA.companyId === jobB.companyId;
      const sameUrl =
        jobA.canonicalUrl !== undefined &&
        jobB.canonicalUrl !== undefined &&
        jobA.canonicalUrl === jobB.canonicalUrl;
      const sameDescHash =
        jobA.descriptionHash !== "" &&
        jobB.descriptionHash !== "" &&
        jobA.descriptionHash === jobB.descriptionHash;

      const confidence = computeConfidence(
        titleSim,
        sameCompany,
        sameUrl,
        sameDescHash,
      );

      if (confidence >= MIN_CONFIDENCE) {
        // Ensure jobA is the earlier one
        const [earlier, later] =
          jobA.firstSeenAt <= jobB.firstSeenAt
            ? [jobA, jobB]
            : [jobB, jobA];

        candidates.push({
          jobA: earlier,
          jobB: later,
          titleSimilarity: Math.round(titleSim * 100) / 100,
          sameCompany,
          sameUrl,
          sameDescriptionHash: sameDescHash,
          confidence: Math.round(confidence * 100) / 100,
        });
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  return candidates;
}
