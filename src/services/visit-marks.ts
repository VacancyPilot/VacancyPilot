import type { VisitMark } from "@/models/visit-mark";
import { visitMarkRepo } from "@/db/repositories";

export interface RecordVacancyVisitInput {
  sourceId: string;
  sourceUrl?: string;
  title?: string;
  companyName?: string;
  companyId?: string | null;
}

function buildVisitMarkId(sourceId: string): string {
  return `hh_vacancy_${sourceId}`;
}

export async function recordVacancyVisit(
  input: RecordVacancyVisitInput,
): Promise<VisitMark> {
  const sourceId = input.sourceId.trim();
  if (!sourceId) {
    throw new Error("Cannot record visit: sourceId is missing");
  }

  const now = new Date().toISOString();
  const existing = await visitMarkRepo.findBySourceId(sourceId);

  const next: VisitMark = existing
    ? {
        ...existing,
        sourceUrl: input.sourceUrl ?? existing.sourceUrl,
        title: input.title ?? existing.title,
        companyName: input.companyName ?? existing.companyName,
        companyId:
          input.companyId !== undefined ? input.companyId : existing.companyId,
        lastSeenAt: now,
        viewCount: existing.viewCount + 1,
        updatedAt: now,
      }
    : {
        id: buildVisitMarkId(sourceId),
        source: "hh",
        sourceType: "vacancy",
        sourceId,
        sourceUrl: input.sourceUrl,
        title: input.title,
        companyName: input.companyName,
        companyId: input.companyId ?? null,
        firstSeenAt: now,
        lastSeenAt: now,
        viewCount: 1,
        updatedAt: now,
      };

  await visitMarkRepo.save(next);
  return next;
}
