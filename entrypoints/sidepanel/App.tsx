import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { CoverLetterStudio } from "@/components/CoverLetterStudio";
import { ProfileTab } from "@/components/ProfileTab";
import { jobRepo } from "@/db/repositories";
import type { Job } from "@/models/job";
import { useState, useCallback, useEffect, type ReactNode } from "react";

type TabId = "overview" | "score" | "letter" | "profile" | "history";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview" },
  { id: "score", label: "Score" },
  { id: "letter", label: "Letter" },
  { id: "profile", label: "Profile" },
  { id: "history", label: "History" },
];

function SidePanelContent(): ReactNode {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const handleTabClick = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        color: "#333",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #e0e0e0",
          background: "#fafafa",
        }}
      >
        <h1
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            color: "#1a3a5c",
          }}
        >
          VacancyPilot
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#999" }}>
          HH.ru copilot
        </p>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        style={{
          display: "flex",
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{
              flex: 1,
              padding: "8px 4px",
              fontSize: 12,
              cursor: "pointer",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #4a90d9"
                  : "2px solid transparent",
              background: activeTab === tab.id ? "#f0f6ff" : "transparent",
              color: activeTab === tab.id ? "#4a90d9" : "#666",
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: "background 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        <TabContent tab={activeTab} />
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: TabId }): ReactNode {
  switch (tab) {
    case "overview":
      return (
        <EmptyState
          icon="📋"
          message="Vacancy overview"
          description="Open a vacancy page to see details here."
        />
      );
    case "score":
      return (
        <EmptyState
          icon="📊"
          message="Score breakdown"
          description="Scoring rules will show fit reasons and risk flags."
        />
      );
    case "letter":
      return <LetterTab />;
    case "profile":
      return <ProfileTabWrapper />;
    case "history":
      return (
        <EmptyState
          icon="🕐"
          message="Status history"
          description="Track status changes and events."
        />
      );
  }
}

// ── Letter tab wrapper ───────────────────────────────────────────────────

interface VacancyContext {
  jobId?: string;
  job?: Job;
  profileId?: string;
  resumeId?: string;
}

/**
 * Detect current vacancy from the active browser tab.
 * Side panel uses lastFocusedWindow to find the HH.ru tab.
 */
function useVacancyContext(): VacancyContext {
  const [ctx, setCtx] = useState<VacancyContext>({});

  useEffect(() => {
    let cancelled = false;

    async function detect(): Promise<void> {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        if (cancelled || !tab?.url) return;

        const match = tab.url.match(/\/vacancy\/(\d+)/);
        if (!match) return;

        const vacancyId = match[1];
        const jobId = `hh_${vacancyId}`;

        // Try to load job from DB to get linked profile/resume
        const job = await jobRepo.getById(jobId);

        if (!cancelled) {
          setCtx({
            jobId,
            job: job ?? undefined,
            profileId: job?.selectedProfileId,
            resumeId: job?.selectedResumeId,
          });
        }
      } catch {
        // Ignore detection errors — user can still type manually
      }
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return ctx;
}

function ProfileTabWrapper(): ReactNode {
  const ctx = useVacancyContext();
  return (
    <ProfileTab
      jobId={ctx.jobId}
      job={ctx.job}
      profileId={ctx.profileId}
      resumeId={ctx.resumeId}
    />
  );
}

function LetterTab(): ReactNode {
  const ctx = useVacancyContext();

  if (!ctx.jobId || !ctx.profileId) {
    return (
      <EmptyState
        icon="✉️"
        message="Cover Letter Studio"
        description="Open a vacancy page and select a profile to start writing."
      />
    );
  }

  return (
    <CoverLetterStudio
      jobId={ctx.jobId}
      profileId={ctx.profileId}
      resumeId={ctx.resumeId}
    />
  );
}

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Side Panel">
      <SidePanelContent />
    </ErrorBoundary>
  );
}
