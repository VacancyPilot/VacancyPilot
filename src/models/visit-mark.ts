export interface VisitMark {
  id: string;
  source: "hh";
  sourceType: "vacancy";
  sourceId: string;
  sourceUrl?: string;
  title?: string;
  companyName?: string;
  companyId?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  viewCount: number;
  updatedAt: string;
}
