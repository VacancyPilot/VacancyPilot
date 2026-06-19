export type RiskSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type RiskCode =
  | 'salary_unknown'
  | 'salary_below_minimum'
  | 'work_mode_mismatch'
  | 'missing_core_skill'
  | 'agency_without_employer'
  | 'unpaid_test_task_risk'
  | 'vague_description'
  | 'low_signal'
  | 'company_blacklist'
  | 'duplicate_vacancy'
  | 'suspicious_wording'
  | 'relocation_required'
  | 'schedule_mismatch';

export interface RiskFlag {
  code: RiskCode;
  severity: RiskSeverity;
  message: string;
  evidence?: string;
}
