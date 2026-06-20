import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ProfileManager } from "@/components/ProfileManager";
import { ResumeManager } from "@/components/ResumeManager";
import { QueueSection } from "@/components/QueueSection";
import { CompanyGreylistSection } from "@/components/CompanyGreylist";
import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  exportAllJson,
  downloadJson,
  generateJobsCsv,
  downloadCsv,
} from "@/services/export-data";
import {
  deleteAllData,
  deleteJobData,
  deleteAiCacheAndEventLog,
  getDataCounts,
} from "@/services/delete-all";
import { db } from "@/db";
import { jobRepo } from "@/db/repositories";
import type { Job, JobStatus } from "@/models/job";

type SectionId =
  | "queue"
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
  { id: "queue", label: "Queue", icon: "✅" },
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
  const [activeSection, setActiveSection] = useState<SectionId>("queue");

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

// ── Pure helpers for vacancy rendering ──

/** Map score total to a display color. */
export function scoreColor(total: number | undefined): string {
  if (total === undefined) return "#999";
  if (total >= 85) return "#2a8";
  if (total >= 70) return "#6a6";
  if (total >= 50) return "#e6a817";
  return "#c44";
}

/** Map job status to a badge color. */
export function statusBadgeStyle(status: JobStatus): {
  bg: string;
  fg: string;
} {
  switch (status) {
    case "applied":
    case "interview":
    case "offer":
      return { bg: "#e6f7e6", fg: "#2a8" };
    case "saved":
    case "letter_ready":
      return { bg: "#e6f0ff", fg: "#4a90d9" };
    case "rejected_by_me":
    case "rejected_by_company":
    case "blacklist":
      return { bg: "#fff0f0", fg: "#c44" };
    case "test_task":
    case "hr_replied":
      return { bg: "#fff8e6", fg: "#e6a817" };
    default:
      return { bg: "#f5f5f5", fg: "#999" };
  }
}

/** Human-readable label for a JobStatus value. */
export function statusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    new: "New",
    viewed: "Viewed",
    saved: "Saved",
    rejected_by_me: "Rejected",
    letter_ready: "Letter ready",
    applied: "Applied",
    hr_replied: "HR replied",
    interview: "Interview",
    test_task: "Test task",
    rejected_by_company: "Rejected by co.",
    offer: "Offer",
    blacklist: "Blacklisted",
  };
  return labels[status] ?? status;
}

/** Format an ISO-8601 timestamp to a short date. */
export function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

// ── Vacancy Section ──

function VacancySection(): ReactNode {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await jobRepo.list();
      data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vacancies");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadJobs(true);
  }, [loadJobs]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  // Listen for chrome.storage.local changes to auto-refresh when badge state
  // or other vacancy-related data changes from content script or popup.
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      // Reload when badge keys or job-related storage changes
      const relevantChange = Object.keys(changes).some(
        (key) => key.startsWith("badge_v1_hh_") || key === "app_settings_v1",
      );
      if (relevantChange) {
        void loadJobs(true);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadJobs]);

  if (loading) return <LoadingState message="Loading vacancies…" />;

  if (error)
    return (
      <ErrorState
        message="Failed to load vacancies"
        details={error}
        onRetry={() => void loadJobs()}
      />
    );

  if (!jobs || jobs.length === 0)
    return (
      <EmptyState
        icon="📋"
        message="No vacancies yet"
        description="Vacancies are saved automatically when you view them on HH.ru."
      />
    );

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>
        Tracked Vacancies ({jobs.length})
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            marginLeft: 12,
            padding: "2px 10px",
            fontSize: 11,
            cursor: refreshing ? "default" : "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: refreshing ? "#f5f5f5" : "#fff",
            color: refreshing ? "#999" : "#555",
            fontWeight: 500,
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </h2>
      <table
        style={{
          width: "100%",
          fontSize: 13,
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #e0e0e0",
              textAlign: "left",
            }}
          >
            <th
              style={{
                padding: "6px 8px",
                fontWeight: 600,
                color: "#555",
              }}
            >
              Title
            </th>
            <th
              style={{
                padding: "6px 8px",
                fontWeight: 600,
                color: "#555",
              }}
            >
              Company
            </th>
            <th
              style={{
                padding: "6px 8px",
                fontWeight: 600,
                color: "#555",
                width: 60,
              }}
            >
              Score
            </th>
            <th
              style={{
                padding: "6px 8px",
                fontWeight: 600,
                color: "#555",
                width: 120,
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: "6px 8px",
                fontWeight: 600,
                color: "#555",
                width: 100,
              }}
            >
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const badge = statusBadgeStyle(job.status);
            return (
              <tr key={job.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "6px 8px" }}>
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#4a90d9",
                      textDecoration: "none",
                    }}
                  >
                    {job.title || "(no title)"}
                  </a>
                </td>
                <td style={{ padding: "6px 8px", color: "#666" }}>
                  {job.companyName || "—"}
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    fontWeight: 600,
                    color: scoreColor(job.ruleScore?.total),
                    textAlign: "center",
                  }}
                >
                  {job.ruleScore?.total !== undefined
                    ? job.ruleScore.total
                    : "—"}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.fg,
                    }}
                  >
                    {statusLabel(job.status)}
                  </span>
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    color: "#999",
                    fontSize: 11,
                  }}
                >
                  {formatShortDate(job.updatedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SectionContent({ section }: { section: SectionId }): ReactNode {
  switch (section) {
    case "queue":
      return <QueueSection />;
    case "vacancies":
      return <VacancySection />;
    case "applications":
      return (
        <EmptyState
          icon="📨"
          message="No applications yet"
          description="Applications appear when you track your job search progress."
        />
      );
    case "companies":
      return <CompanyGreylistSection />;
    case "profiles":
      return <ProfileManager />;
    case "resumes":
      return <ResumeManager />;
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
      return <ExportSection />;
    case "settings":
      return (
        <EmptyState
          icon="⚙️"
          message="Settings"
          description="Configure scoring, AI provider, n8n, and general preferences."
        />
      );
    case "privacy":
      return <PrivacySection />;
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

// ── Export Section ───────────────────────────────────────────────────────

type ExportStatus = "idle" | "loading" | "error" | "done";

function ExportSection(): ReactNode {
  const [jsonStatus, setJsonStatus] = useState<ExportStatus>("idle");
  const [csvStatus, setCsvStatus] = useState<ExportStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleExportJson = useCallback(async () => {
    setJsonStatus("loading");
    setErrorMsg("");
    try {
      const envelope = await exportAllJson();
      downloadJson(envelope);
      setJsonStatus("done");
    } catch (err) {
      setJsonStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
    }
  }, []);

  const handleExportCsv = useCallback(async () => {
    setCsvStatus("loading");
    setErrorMsg("");
    try {
      const jobs = await db.jobs.toArray();
      const csv = generateJobsCsv(jobs);
      downloadCsv(
        csv,
        `vacancy-pilot-jobs-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      setCsvStatus("done");
    } catch (err) {
      setCsvStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "CSV export failed");
    }
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>
        Export Your Data
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#666" }}>
        Download your vacancies, cover letters, settings, and event history. API
        keys and secrets are never included in exports.
      </p>

      {errorMsg && (
        <ErrorState
          message="Export failed"
          details={errorMsg}
          onRetry={() => setErrorMsg("")}
        />
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* JSON Export */}
        <div
          style={{
            flex: "1 1 240px",
            padding: 16,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
            JSON Export
          </h3>
          <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
            Full data archive with version envelope — suitable for backup,
            migration, or import into another VacancyPilot instance.
          </p>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={jsonStatus === "loading"}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              cursor: jsonStatus === "loading" ? "not-allowed" : "pointer",
              border: "1px solid #4a90d9",
              borderRadius: 4,
              background: "#4a90d9",
              color: "#fff",
              fontWeight: 600,
              opacity: jsonStatus === "loading" ? 0.6 : 1,
            }}
          >
            {jsonStatus === "loading"
              ? "Exporting…"
              : jsonStatus === "done"
                ? "✓ Exported"
                : "Export JSON"}
          </button>
        </div>

        {/* CSV Export */}
        <div
          style={{
            flex: "1 1 240px",
            padding: 16,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
            CSV Export — Jobs
          </h3>
          <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
            Spreadsheet-friendly job history with scores, statuses, and
            timestamps. Opens in Excel, Google Sheets, or any CSV viewer.
          </p>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={csvStatus === "loading"}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              cursor: csvStatus === "loading" ? "not-allowed" : "pointer",
              border: "1px solid #2a8",
              borderRadius: 4,
              background: "#2a8",
              color: "#fff",
              fontWeight: 600,
              opacity: csvStatus === "loading" ? 0.6 : 1,
            }}
          >
            {csvStatus === "loading"
              ? "Exporting…"
              : csvStatus === "done"
                ? "✓ Exported"
                : "Export CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Privacy / Delete Section ──────────────────────────────────────────────

type DeleteStep =
  | "idle"
  | "warn-export"
  | "confirm"
  | "deleting"
  | "done"
  | "error";

type InlineActionStatus = "idle" | "confirm" | "working" | "done" | "error";

function PrivacySection(): ReactNode {
  const [step, setStep] = useState<DeleteStep>("idle");
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [jobIdInput, setJobIdInput] = useState("");
  const [jobDeleteStatus, setJobDeleteStatus] =
    useState<InlineActionStatus>("idle");
  const [jobDeleteMessage, setJobDeleteMessage] = useState("");
  const [cacheDeleteStatus, setCacheDeleteStatus] =
    useState<InlineActionStatus>("idle");
  const [cacheDeleteMessage, setCacheDeleteMessage] = useState("");

  const refreshCounts = useCallback(async () => {
    try {
      setDataCounts(await getDataCounts());
    } catch {
      setDataCounts({});
    }
  }, []);

  // Load counts when the section mounts or when step returns to idle
  useEffect(() => {
    if (step === "idle") {
      void refreshCounts();
    }
  }, [refreshCounts, step]);

  const totalRows = Object.values(dataCounts).reduce((a, b) => a + b, 0);
  const hasAnyData = totalRows > 0;

  const handleStartDelete = useCallback(() => {
    setStep("warn-export");
    setErrorMsg("");
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setStep("confirm");
  }, []);

  const handleExecuteDelete = useCallback(async () => {
    setStep("deleting");
    setErrorMsg("");
    try {
      await deleteAllData();
      setDataCounts({});
      setStep("done");
    } catch (err) {
      setStep("error");
      setErrorMsg(err instanceof Error ? err.message : "Deletion failed");
    }
  }, []);

  const handleDeleteJob = useCallback(async () => {
    const jobId = jobIdInput.trim();
    if (!jobId) return;

    setJobDeleteStatus("working");
    setJobDeleteMessage("");
    try {
      const result = await deleteJobData(jobId);
      setJobDeleteStatus("done");
      setJobDeleteMessage(
        `Deleted ${jobId} and related records (${result.coverLettersDeleted} letter(s), ${result.applicationsDeleted} application(s), ${result.eventsDeleted} event(s)).`,
      );
      setJobIdInput("");
      await refreshCounts();
    } catch (err) {
      setJobDeleteStatus("error");
      setJobDeleteMessage(
        err instanceof Error ? err.message : "Single-job deletion failed",
      );
    }
  }, [jobIdInput, refreshCounts]);

  const handleDeleteAiCacheAndLog = useCallback(async () => {
    setCacheDeleteStatus("working");
    setCacheDeleteMessage("");
    try {
      const result = await deleteAiCacheAndEventLog();
      setCacheDeleteStatus("done");
      setCacheDeleteMessage(
        `Deleted ${result.cacheEntriesDeleted} AI cache entr${
          result.cacheEntriesDeleted === 1 ? "y" : "ies"
        } and ${result.eventLogEntriesDeleted} event log entr${
          result.eventLogEntriesDeleted === 1 ? "y" : "ies"
        }.`,
      );
      await refreshCounts();
    } catch (err) {
      setCacheDeleteStatus("error");
      setCacheDeleteMessage(
        err instanceof Error ? err.message : "AI cache deletion failed",
      );
    }
  }, [refreshCounts]);

  const handleCancel = useCallback(() => {
    setStep("idle");
    setErrorMsg("");
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>
        Privacy &amp; Data Controls
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#666" }}>
        Manage your local data. All information is stored only in this browser.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 520,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: 16,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
            Delete One Job
          </h3>
          <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
            Remove one saved vacancy by local job ID. Related cover letters,
            application records, and event log entries for that job will also be
            deleted.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              value={jobIdInput}
              onChange={(event) => {
                setJobIdInput(event.target.value);
                if (jobDeleteStatus !== "idle") {
                  setJobDeleteStatus("idle");
                  setJobDeleteMessage("");
                }
              }}
              placeholder="hh_123456"
              style={{
                flex: "1 1 220px",
                minWidth: 180,
                padding: "6px 8px",
                fontSize: 12,
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
            {jobDeleteStatus !== "confirm" ? (
              <button
                type="button"
                onClick={() => setJobDeleteStatus("confirm")}
                disabled={!jobIdInput.trim() || jobDeleteStatus === "working"}
                style={dangerSecondaryButtonStyle(
                  !jobIdInput.trim() || jobDeleteStatus === "working",
                )}
              >
                Delete Job...
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setJobDeleteStatus("idle")}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteJob}
                  style={dangerPrimaryButtonStyle}
                >
                  Confirm Delete
                </button>
              </>
            )}
          </div>
          {jobDeleteMessage && (
            <p
              style={{
                fontSize: 11,
                margin: "10px 0 0",
                color: jobDeleteStatus === "error" ? "#c44" : "#666",
              }}
            >
              {jobDeleteMessage}
            </p>
          )}
        </div>

        <div
          style={{
            padding: 16,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
            Delete AI Cache And Event Log
          </h3>
          <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
            Clear cached AI outputs and the local event log without touching
            saved vacancies, profiles, or settings.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {cacheDeleteStatus !== "confirm" ? (
              <button
                type="button"
                onClick={() => setCacheDeleteStatus("confirm")}
                disabled={cacheDeleteStatus === "working"}
                style={dangerSecondaryButtonStyle(
                  cacheDeleteStatus === "working",
                )}
              >
                Clear Cache And Log...
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCacheDeleteStatus("idle")}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAiCacheAndLog}
                  style={dangerPrimaryButtonStyle}
                >
                  Confirm Clear
                </button>
              </>
            )}
          </div>
          {cacheDeleteMessage && (
            <p
              style={{
                fontSize: 11,
                margin: "10px 0 0",
                color: cacheDeleteStatus === "error" ? "#c44" : "#666",
              }}
            >
              {cacheDeleteMessage}
            </p>
          )}
        </div>
      </div>

      {/* Delete all data card */}
      <div
        style={{
          padding: 16,
          border: step === "done" ? "1px solid #b0d0b0" : "1px solid #e0e0e0",
          borderRadius: 8,
          background: step === "done" ? "#f5fff5" : "#fafafa",
          maxWidth: 520,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            margin: "0 0 4px",
            color: step === "done" ? "#2a8" : "#c33",
          }}
        >
          {step === "done" ? "✓ Data Deleted" : "Delete All Data"}
        </h3>

        {step === "idle" && (
          <>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>
              {hasAnyData
                ? `You have ${totalRows} record(s) across ${Object.values(dataCounts).filter((c) => c > 0).length} table(s). This action is irreversible.`
                : "No data to delete."}
            </p>
            {hasAnyData && (
              <>
                <table
                  style={{
                    width: "100%",
                    fontSize: 11,
                    color: "#555",
                    borderCollapse: "collapse",
                    marginBottom: 12,
                  }}
                >
                  <tbody>
                    {Object.entries(dataCounts)
                      .filter(([, c]) => c > 0)
                      .map(([table, count]) => (
                        <tr key={table}>
                          <td style={{ padding: "2px 8px 2px 0" }}>{table}</td>
                          <td style={{ padding: "2px 0", color: "#999" }}>
                            {count} row(s)
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={handleStartDelete}
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    cursor: "pointer",
                    border: "1px solid #c44",
                    borderRadius: 4,
                    background: "#fff",
                    color: "#c44",
                    fontWeight: 600,
                  }}
                >
                  Delete All Data…
                </button>
              </>
            )}
          </>
        )}

        {step === "warn-export" && (
          <>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
              ⚠️ You are about to permanently delete all your VacancyPilot data.
              This includes vacancies, cover letters, profiles, settings, and
              event history.
            </p>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
              We strongly recommend exporting your data first from the
              <span style={{ fontWeight: 600 }}> Export</span> section.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  background: "#fff",
                  color: "#555",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: "1px solid #c44",
                  borderRadius: 4,
                  background: "#c44",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                I understand, continue
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
              🔴 Final confirmation: this action{" "}
              <strong>cannot be undone</strong>. All local data will be wiped
              immediately.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  background: "#fff",
                  color: "#555",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: "1px solid #900",
                  borderRadius: 4,
                  background: "#900",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Delete Everything
              </button>
            </div>
          </>
        )}

        {step === "deleting" && (
          <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
            Deleting all data…
          </p>
        )}

        {step === "done" && (
          <>
            <p style={{ fontSize: 12, color: "#2a8", margin: "0 0 8px" }}>
              All VacancyPilot data has been deleted from this browser.
            </p>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                color: "#555",
              }}
            >
              Done
            </button>
          </>
        )}

        {step === "error" && (
          <>
            <ErrorState
              message="Deletion failed"
              details={errorMsg}
              onRetry={handleExecuteDelete}
            />
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  background: "#fff",
                  color: "#555",
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const secondaryButtonStyle = {
  padding: "6px 14px",
  fontSize: 12,
  cursor: "pointer",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  color: "#555",
} as const;

function dangerSecondaryButtonStyle(disabled: boolean) {
  return {
    padding: "6px 14px",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid #c44",
    borderRadius: 4,
    background: "#fff",
    color: "#c44",
    fontWeight: 600,
    opacity: disabled ? 0.6 : 1,
  } as const;
}

const dangerPrimaryButtonStyle = {
  padding: "6px 14px",
  fontSize: 12,
  cursor: "pointer",
  border: "1px solid #900",
  borderRadius: 4,
  background: "#900",
  color: "#fff",
  fontWeight: 700,
} as const;

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Dashboard">
      <DashboardContent />
    </ErrorBoundary>
  );
}
