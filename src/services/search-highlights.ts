import { jobRepo, visitMarkRepo } from "@/db/repositories";
import { loadSettings } from "@/db/settings-bridge";
import type { Job } from "@/models/job";
import type { VisitMark } from "@/models/visit-mark";
import type { SearchBadgeState } from "./search-badge-render";

export type SearchHighlightState = SearchBadgeState;

function uniqueVacancyIds(vacancyIds: string[]): string[] {
  return Array.from(
    new Set(
      vacancyIds
        .map((vacancyId) => vacancyId.trim())
        .filter((vacancyId) => vacancyId.length > 0),
    ),
  );
}

function isRejectedStatus(status: string | undefined): boolean {
  return (
    status === "rejected_by_me" ||
    status === "rejected_by_company" ||
    status === "blacklist"
  );
}

function resolveStatus(
  job: Job | undefined,
  visitMark: VisitMark | undefined,
): string | undefined {
  if (job) {
    if (job.status === "new" && visitMark) {
      return "viewed";
    }
    return job.status;
  }

  if (visitMark) {
    return "viewed";
  }

  return undefined;
}

export async function getSearchHighlightStates(
  vacancyIds: string[],
): Promise<Record<string, SearchHighlightState>> {
  const ids = uniqueVacancyIds(vacancyIds);
  if (ids.length === 0) {
    return {};
  }

  const [jobs, visitMarks, settings] = await Promise.all([
    jobRepo.list(),
    visitMarkRepo.list(),
    loadSettings(),
  ]);
  const wantedIds = new Set(ids);

  const jobByVacancyId = new Map(
    jobs
      .filter((job) => wantedIds.has(job.sourceVacancyId))
      .map((job) => [job.sourceVacancyId, job] as const),
  );
  const visitMarkByVacancyId = new Map(
    visitMarks
      .filter((mark) => wantedIds.has(mark.sourceId))
      .map((mark) => [mark.sourceId, mark] as const),
  );

  const result: Record<string, SearchHighlightState> = {};

  for (const vacancyId of ids) {
    const job = jobByVacancyId.get(vacancyId);
    const visitMark = visitMarkByVacancyId.get(vacancyId);
    const status = resolveStatus(job, visitMark);
    const score = job?.ruleScore?.total;

    if (status === undefined && score === undefined) {
      continue;
    }

    const state: SearchHighlightState = {};
    if (status !== undefined) {
      state.status = status;
    }
    if (typeof score === "number") {
      state.score = score;
    }

    if (isRejectedStatus(status)) {
      if (settings.general.rejectedSearchCardBehavior === "hide") {
        state.hidden = true;
      } else {
        state.dimmed = true;
      }
    }

    result[vacancyId] = state;
  }

  return result;
}
