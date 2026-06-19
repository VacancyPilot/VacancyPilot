import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { useState, useCallback, type ReactNode } from "react";

type SectionId =
  | "vacancies"
  | "applications"
  | "companies"
  | "profiles"
  | "resumes"
  | "letters"
  | "events"
  | "export"
  | "settings"
  | "privacy"
  | "debug";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: string;
}

const SECTIONS: SectionDef[] = [
  { id: "vacancies", label: "Vacancies", icon: "📋" },
  { id: "applications", label: "Applications", icon: "📨" },
  { id: "companies", label: "Companies", icon: "🏢" },
  { id: "profiles", label: "Profiles", icon: "👤" },
  { id: "resumes", label: "Resumes", icon: "📄" },
  { id: "letters", label: "Letters", icon: "✉️" },
  { id: "events", label: "Events", icon: "📜" },
  { id: "export", label: "Export", icon: "📦" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "privacy", label: "Privacy", icon: "🔒" },
  { id: "debug", label: "Debug", icon: "🛠️" },
];

function DashboardContent(): ReactNode {
  const [activeSection, setActiveSection] = useState<SectionId>("vacancies");

  const handleSectionClick = useCallback((section: SectionId) => {
    setActiveSection(section);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        color: "#333",
      }}
    >
      {/* Sidebar */}
      <nav
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: "1px solid #e0e0e0",
          background: "#fafafa",
          overflow: "auto",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #e0e0e0",
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
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#999" }}>
            Dashboard
          </p>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => handleSectionClick(section.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: "none",
                  borderLeft:
                    activeSection === section.id
                      ? "3px solid #4a90d9"
                      : "3px solid transparent",
                  background:
                    activeSection === section.id ? "#f0f6ff" : "transparent",
                  color: activeSection === section.id ? "#4a90d9" : "#555",
                  fontWeight: activeSection === section.id ? 600 : 400,
                  textAlign: "left",
                }}
              >
                <span>{section.icon}</span>
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: 20,
          background: "#fff",
        }}
      >
        <SectionContent section={activeSection} />
      </main>
    </div>
  );
}

function SectionContent({ section }: { section: SectionId }): ReactNode {
  switch (section) {
    case "vacancies":
      return (
        <EmptyState
          icon="📋"
          message="No vacancies yet"
          description="Vacancies are saved automatically when you view them on HH.ru."
        />
      );
    case "applications":
      return (
        <EmptyState
          icon="📨"
          message="No applications yet"
          description="Applications appear when you track your job search progress."
        />
      );
    case "companies":
      return (
        <EmptyState
          icon="🏢"
          message="No companies yet"
          description="Companies are created automatically from saved vacancies."
        />
      );
    case "profiles":
      return (
        <EmptyState
          icon="👤"
          message="No profiles yet"
          description="Create a profile to tailor scoring and cover letters."
        />
      );
    case "resumes":
      return (
        <EmptyState
          icon="📄"
          message="No resumes yet"
          description="Add your CV to pair it with applications."
        />
      );
    case "letters":
      return (
        <EmptyState
          icon="✉️"
          message="No cover letters yet"
          description="Generate cover letters from the side panel on a vacancy page."
        />
      );
    case "events":
      return (
        <EmptyState
          icon="📜"
          message="No events yet"
          description="Activity log will appear as you use the extension."
        />
      );
    case "export":
      return (
        <EmptyState
          icon="📦"
          message="Export your data"
          description="Export vacancies and history as CSV or JSON."
        />
      );
    case "settings":
      return (
        <EmptyState
          icon="⚙️"
          message="Settings"
          description="Configure scoring, AI provider, n8n, and general preferences."
        />
      );
    case "privacy":
      return (
        <EmptyState
          icon="🔒"
          message="Privacy controls"
          description="Manage AI data sharing, data retention, and delete all data."
        />
      );
    case "debug":
      return (
        <EmptyState
          icon="🛠️"
          message="Debug tools"
          description="Parser debug mode, raw HTML inspection, and local logs."
        />
      );
  }
}

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Dashboard">
      <DashboardContent />
    </ErrorBoundary>
  );
}
