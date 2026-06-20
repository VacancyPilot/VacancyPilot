import { useState, useCallback, useEffect, type ReactNode } from "react";
import { jobRepo } from "@/db/repositories";
import { createStatusChange } from "@/services/status-transitions";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import type { Job, JobStatus } from "@/models/job";

// ── Kanban column definitions ─────────────────────────────────────────────

interface KanbanColumn {
  id: string;
  label: string;
  icon: string;
  statuses: JobStatus[];
  color: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "saved",
    label: "Saved",
    icon: "📥",
    statuses: ["saved", "letter_ready"],
    color: "#4a90d9",
  },
  {
    id: "active",
    label: "Active",
    icon: "🔄",
    statuses: ["applied", "hr_replied", "interview", "test_task"],
    color: "#e6a817",
  },
  {
    id: "offer",
    label: "Offer",
    icon: "🏆",
    statuses: ["offer"],
    color: "#2a8",
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: "🚫",
    statuses: ["rejected_by_me", "rejected_by_company", "blacklist"],
    color: "#c44",
  },
];

/** All statuses NOT covered by kanban columns fall into "Other". */
const OTHER_LABEL = "Other";
const OTHER_ICON = "📦";

// ── Allowed transitions per column (for quick-action dropdown) ────────────

const COLUMN_TRANSITIONS: Record<string, JobStatus[]> = {
  saved: ["applied", "rejected_by_me"],
  active: ["offer", "rejected_by_me"],
  offer: ["rejected_by_me"],
  rejected: ["saved", "applied"],
};

// ── Helpers ───────────────────────────────────────────────────────────────

function scoreColor(total: number | undefined): string {
  if (total === undefined) return "#999";
  if (total >= 85) return "#2a8";
  if (total >= 70) return "#6a6";
  if (total >= 50) return "#e6a817";
  return "#c44";
}

function statusBadgeStyle(status: JobStatus): { bg: string; fg: string } {
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

function statusLabel(status: JobStatus): string {
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
  return labels[status];
}

function formatShortDate(iso: string): string {
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

function classifyColumn(status: JobStatus): string {
  for (const col of KANBAN_COLUMNS) {
    if (col.statuses.includes(status)) return col.id;
  }
  return "other";
}

// ── Component ─────────────────────────────────────────────────────────────

export function KanbanBoard(): ReactNode {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [changingJobId, setChangingJobId] = useState<string | null>(null);

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
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      const relevantChange = Object.keys(changes).some(
        (key) => key.startsWith("badge_v1_hh_") || key === "app_settings_v1",
      );
      if (relevantChange) void loadJobs(true);
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadJobs]);

  const handleMoveJob = useCallback(
    async (jobId: string, toStatus: JobStatus) => {
      setChangingJobId(jobId);
      try {
        const job = await jobRepo.getById(jobId);
        if (!job) return;
        const change = createStatusChange(job.status, toStatus, "user");
        job.status = toStatus;
        job.statusHistory = [...job.statusHistory, change];
        job.updatedAt = new Date().toISOString();
        await jobRepo.save(job);

        // Update local state optimistically
        setJobs((prev) =>
          prev
            .map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: toStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : j,
            )
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
      } catch {
        // Let UI stay consistent — reload on error
        void loadJobs(true);
      } finally {
        setChangingJobId(null);
      }
    },
    [loadJobs],
  );

  const handleOpenVacancy = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // ── Filtering ──
  const filteredJobs = search
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.companyName.toLowerCase().includes(search.toLowerCase()),
      )
    : jobs;

  // ── Group into columns ──
  const columnJobs: Record<string, Job[]> = {};
  for (const col of KANBAN_COLUMNS) {
    columnJobs[col.id] = [];
  }
  columnJobs.other = [];

  for (const job of filteredJobs) {
    const colId = classifyColumn(job.status);
    if (columnJobs[colId]) {
      columnJobs[colId].push(job);
    } else {
      columnJobs.other.push(job);
    }
  }

  // ── Render ──

  if (loading) return <LoadingState message="Loading vacancies…" />;

  if (error)
    return (
      <ErrorState
        message="Failed to load vacancies"
        details={error}
        onRetry={() => void loadJobs()}
      />
    );

  if (jobs.length === 0)
    return (
      <EmptyState
        icon="📋"
        message="No vacancies yet"
        description="Vacancies are saved automatically when you view them on HH.ru."
      />
    );

  const totalJobs = filteredJobs.length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2
          style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1a3a5c" }}
        >
          Kanban Board ({totalJobs})
        </h2>
        <input
          type="text"
          placeholder="Search title or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
            width: 200,
          }}
        />
      </div>

      {/* Board */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflow: "auto",
          minHeight: 300,
        }}
      >
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumnView
            key={col.id}
            column={col}
            jobs={columnJobs[col.id] ?? []}
            changingJobId={changingJobId}
            onMoveJob={handleMoveJob}
            onOpenVacancy={handleOpenVacancy}
          />
        ))}

        {/* Other column (new, viewed) */}
        {(columnJobs.other?.length ?? 0) > 0 && (
          <KanbanColumnView
            column={{
              id: "other",
              label: OTHER_LABEL,
              icon: OTHER_ICON,
              statuses: [],
              color: "#999",
            }}
            jobs={columnJobs.other ?? []}
            changingJobId={changingJobId}
            onMoveJob={handleMoveJob}
            onOpenVacancy={handleOpenVacancy}
          />
        )}
      </div>
    </div>
  );
}

// ── Kanban Column View ────────────────────────────────────────────────────

function KanbanColumnView({
  column,
  jobs,
  changingJobId,
  onMoveJob,
  onOpenVacancy,
}: {
  column: KanbanColumn;
  jobs: Job[];
  changingJobId: string | null;
  onMoveJob: (jobId: string, toStatus: JobStatus) => void;
  onOpenVacancy: (url: string) => void;
}): ReactNode {
  const [dropdownJobId, setDropdownJobId] = useState<string | null>(null);

  const allowedMoves =
    COLUMN_TRANSITIONS[column.id] ??
    (["saved", "applied", "offer", "rejected_by_me"] as JobStatus[]);

  return (
    <div
      style={{
        flex: "0 0 220px",
        display: "flex",
        flexDirection: "column",
        background: "#f9f9f9",
        border: `1px solid ${column.color}30`,
        borderRadius: 6,
        maxHeight: "calc(100vh - 120px)",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "8px 10px",
          borderBottom: `2px solid ${column.color}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>{column.icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: column.color,
            flex: 1,
          }}
        >
          {column.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#999",
            background: "#eee",
            borderRadius: 10,
            padding: "1px 7px",
          }}
        >
          {jobs.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ overflow: "auto", padding: "4px 6px", flex: 1 }}>
        {jobs.map((job) => {
          const badge = statusBadgeStyle(job.status);
          const isChanging = changingJobId === job.id;

          return (
            <div
              key={job.id}
              style={{
                padding: "8px",
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: 4,
                marginBottom: 6,
                opacity: isChanging ? 0.5 : 1,
                cursor: "pointer",
              }}
            >
              {/* Title */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: 4,
                  lineHeight: 1.3,
                  cursor: "pointer",
                }}
                onClick={() => onOpenVacancy(job.sourceUrl)}
                title="Open vacancy"
              >
                {job.title || "(no title)"}
              </div>

              {/* Company */}
              <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
                {job.companyName || "—"}
              </div>

              {/* Score + Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                {job.ruleScore?.total !== undefined ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: scoreColor(job.ruleScore.total),
                    }}
                  >
                    {job.ruleScore.total}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "#ccc" }}>—</span>
                )}

                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 6px",
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    background: badge.bg,
                    color: badge.fg,
                  }}
                >
                  {statusLabel(job.status)}
                </span>
              </div>

              {/* Date */}
              <div style={{ fontSize: 10, color: "#bbb" }}>
                {formatShortDate(job.updatedAt)}
              </div>

              {/* Quick actions */}
              <div style={{ marginTop: 6, position: "relative" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownJobId(dropdownJobId === job.id ? null : job.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "3px 8px",
                    fontSize: 10,
                    border: "1px solid #ccc",
                    borderRadius: 3,
                    background: "#fff",
                    color: "#555",
                    cursor: "pointer",
                  }}
                >
                  Move ▾
                </button>

                {dropdownJobId === job.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      zIndex: 10,
                      marginTop: 2,
                    }}
                  >
                    {allowedMoves
                      .filter((s) => s !== job.status)
                      .map((targetStatus) => (
                        <button
                          key={targetStatus}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownJobId(null);
                            onMoveJob(job.id, targetStatus);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "4px 8px",
                            fontSize: 10,
                            border: "none",
                            background: "transparent",
                            color: "#333",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          → {statusLabel(targetStatus)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div
            style={{
              padding: "12px 8px",
              fontSize: 11,
              color: "#ccc",
              textAlign: "center",
            }}
          >
            Empty
          </div>
        )}
      </div>
    </div>
  );
}
