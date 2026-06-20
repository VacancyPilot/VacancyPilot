// Local storage layer — barrel export

export { SCHEMA_V1, SCHEMA_V2, TABLE_NAMES, SCHEMA_VERSION } from "./schema";
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
  companyRepo,
} from "./repositories";

export { defaultSettings, loadSettings, saveSettings } from "./settings-bridge";
