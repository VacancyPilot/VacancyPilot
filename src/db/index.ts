// Local storage layer — barrel export

export {
  SCHEMA_V1,
  SCHEMA_V2,
  SCHEMA_V3,
  SCHEMA_V4,
  TABLE_NAMES,
  SCHEMA_VERSION,
} from "./schema";
export type { TableName } from "./schema";

export { VacancyDatabase, db } from "./database";

export {
  CURRENT_VERSION,
  getStoredVersion,
  writeCurrentVersion,
  runMigrations,
} from "./migrations";

export {
  jobRepo,
  profileRepo,
  resumeRepo,
  coverLetterRepo,
} from "./repositories";

export { labsActionRepo } from "./labs-repository";

export { hrTimelineRepo } from "./hr-timeline-repository";

export { defaultSettings, loadSettings, saveSettings } from "./settings-bridge";
