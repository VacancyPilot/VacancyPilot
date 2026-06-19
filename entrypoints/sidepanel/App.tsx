import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { useState, useCallback, type ReactNode } from "react";

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
      return (
        <EmptyState
          icon="✉️"
          message="Cover Letter Studio"
          description="Generate, edit, and save cover letters."
        />
      );
    case "profile":
      return (
        <EmptyState
          icon="👤"
          message="Profile & Resume"
          description="Select a profile and resume for this vacancy."
        />
      );
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

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Side Panel">
      <SidePanelContent />
    </ErrorBoundary>
  );
}
