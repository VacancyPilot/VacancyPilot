export interface AppSettings {
  schemaVersion: number;

  /** True after the user completes the first-run onboarding flow. */
  onboardingCompleted: boolean;

  general: {
    defaultProfileId?: string;
    language: "ru" | "en";
    theme: "system" | "light" | "dark";
    showPageBadge: boolean;
    searchHighlightsEnabled?: boolean;
    searchHighlightsShowViewed?: boolean;
    searchHighlightsShowSavedRejected?: boolean;
    searchHighlightsShowScore?: boolean;
    searchHighlightsShowViewCount?: boolean;
    trackVisitMarks: boolean;
    rejectedSearchCardBehavior: "dim" | "hide";
    autosaveViewedJobs: boolean;
    toolbarClickBehavior: "popup" | "sidePanel";
    closePopupAfterOpeningSidePanel: boolean;
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
    provider?: "openai" | "deepseek" | "openrouter" | "mock";
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
