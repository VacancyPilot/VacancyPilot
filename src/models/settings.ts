export interface AppSettings {
  schemaVersion: number;

  general: {
    defaultProfileId?: string;
    language: 'ru' | 'en';
    theme: 'system' | 'light' | 'dark';
    showPageBadge: boolean;
    autosaveViewedJobs: boolean;
  };

  privacy: {
    aiEnabled: boolean;
    n8nEnabled: boolean;
    strictPrivacyMode: boolean;
    showPayloadPreviewAlways: boolean;
    allowResumeHighlightsToAI: boolean;
    allowFullDescriptionToAI: boolean;
    redactContacts: boolean;
    debugHtmlMode: boolean;
    dataRetentionDays?: number;
  };

  ai: {
    provider?: 'openai' | 'deepseek' | 'openrouter';
    model?: string;
    dailyRequestLimit: number;
    maxInputChars: number;
    enableStreaming: boolean;
    enableCache: boolean;
  };

  n8n: {
    enabled: boolean;
    webhookUrl?: string;
    hmacSecretSet: boolean;
    enabledEvents: string[];
    dailyEventLimit: number;
  };

  labs: {
    enabled: boolean;
    guidedApplyEnabled: boolean;
    killSwitchEnabled: boolean;
    dailyActionLimit: number;
  };
}
