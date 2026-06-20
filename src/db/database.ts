import Dexie, { type EntityTable } from "dexie";
import type { Job } from "@/models/job";
import type { Company } from "@/models/company";
import type { Profile } from "@/models/profile";
import type { Resume } from "@/models/resume";
import type { CoverLetter } from "@/models/cover-letter";
import type { Application } from "@/models/application";
import type { EventLog } from "@/models/event-log";
import type { AIRequestCache } from "@/models/ai";
import type { LabsActionLog } from "@/models/labs-action-log";
import type { HrTimelineEntry } from "@/models/hr-timeline";
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_V3, SCHEMA_V4 } from "./schema";

/**
 * Dexie database wrapper for VacancyPilot.
 *
 * All domain data goes here. Settings and API keys are NOT stored in IndexedDB;
 * they live in chrome.storage.local (see settings-bridge.ts).
 */

export class VacancyDatabase extends Dexie {
  jobs!: EntityTable<Job, "id">;
  companies!: EntityTable<Company, "id">;
  profiles!: EntityTable<Profile, "id">;
  resumes!: EntityTable<Resume, "id">;
  coverLetters!: EntityTable<CoverLetter, "id">;
  applications!: EntityTable<Application, "id">;
  events!: EntityTable<EventLog, "id">;
  aiCache!: EntityTable<AIRequestCache, "id">;
  labsActions!: EntityTable<LabsActionLog, "id">;
  hrTimeline!: EntityTable<HrTimelineEntry, "id">;
  meta!: EntityTable<{ key: string; value: unknown }, "key">;

  constructor() {
    super("VacancyPilotDB");
    this.version(1).stores(SCHEMA_V1);
    this.version(2).stores(SCHEMA_V2);
    this.version(3).stores(SCHEMA_V3);
    this.version(4).stores(SCHEMA_V4);
  }
}

/** Singleton database instance. Created lazily by Dexie — no DB open until first operation. */
export const db = new VacancyDatabase();
