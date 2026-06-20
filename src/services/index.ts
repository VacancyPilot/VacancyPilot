// Services — barrel export

export { STATUS_ORDER, createStatusChange } from "./status-transitions";
export { createEventLogEntry } from "./event-log-helper";
export { tracker } from "./tracker";
export { scoreJob, DEFAULT_WEIGHTS } from "./scoring";

export {
  redactText,
  redactContacts,
  redactEmails,
  redactPhones,
  redactUrls,
  redactTokens,
  truncateDescription,
} from "./redaction";

export {
  buildVacancyAnalysisInput,
  buildCoverLetterInput,
} from "./ai-input-builders";
export type {
  BuildVacancyInputOptions,
  BuildCoverLetterOptions,
} from "./ai-input-builders";

export {
  generateVacancyAnalysisPreview,
  generateCoverLetterPreview,
} from "./payload-preview";

export {
  exportAllJson,
  downloadJson,
  generateJobsCsv,
  downloadCsv,
} from "./export-data";
export type { ExportEnvelope } from "./export-data";

export {
  deleteAllData,
  deleteJobData,
  deleteAiCacheAndEventLog,
  hasData,
  getDataCounts,
} from "./delete-all";

// Labs control plane
export {
  isLabsEnabled,
  isGuidedApplyEnabled,
  getRemainingDailyBudget,
  hasDailyBudget,
  checkGuidedApplyGate,
  recordLabsAction,
  getActionLog,
  getTodayActionCount,
} from "./labs-control";
export type {
  DeleteJobDataResult,
  DeleteAiCacheAndEventLogResult,
} from "./delete-all";

// Reminders and daily summary
export { checkReminder, getReminders, getDailySummary } from "./reminders";
export type {
  ReminderReason,
  ReminderItem,
  DailySummary,
  ActivityEvent,
} from "./reminders";
export type { PayloadPreview, IncludedField } from "./payload-preview";

// AI provider
export { MockLLMProvider } from "./ai-provider";

// AI validation
export {
  parseAndValidateAnalysis,
  createFallbackAnalysis,
  validateCoverLetter,
} from "./ai-validation";
export type {
  ValidationError,
  AnalysisValidationResult,
  LetterValidationResult,
} from "./ai-validation";

// AI hash
export {
  computeAnalysisInputHash,
  computeCoverLetterInputHash,
} from "./ai-hash";

// AI cache
export {
  checkAnalysisCache,
  checkCoverLetterCache,
  storeAnalysisCache,
  storeCoverLetterCache,
  invalidateCache,
  listCacheEntries,
  getCachedAnalysis,
  getCachedCoverLetter,
} from "./ai-cache";
export type {
  CacheKind,
  CacheCheckResult,
  AnalysisCacheCheckResult,
  CoverLetterCacheCheckResult,
  CacheStoreParams,
  CoverLetterCacheStoreParams,
} from "./ai-cache";
