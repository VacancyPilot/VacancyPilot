/**
 * Queue Section component — ITER-037.
 *
 * Dashboard section that shows saved vacancies as a task-list queue,
 * grouped by workflow stage. Includes filtering, sorting, and
 * duplicate detection integration.
 */

import React, { useState, useCallback, useEffect, type ReactNode } from "react";
import type { Job } from "@/models/job";
import type { QueueTask, QueueStage, TaskPriority } from "@/models/queue";
import { STAGE_LABELS } from "@/models/queue";
import type { DuplicateCandidate } from "@/models/duplicate";
import { jobRepo } from "@/db/repositories";
import {
  buildQueueTasks,
  groupByStage,
  filterQueueTasks,
  sortQueueTasks,
  computeQueueStats,
  type QueueFilter,
  type QueueSort,
  type QueueSortField,
  type TaskGroup,
} from "@/services/queue-service";
import { detectDuplicates } from "@/services/duplicate-detection";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

// ── Style helpers (same palette as existing dashboard) ───────────────────────

function stageColor(stage: QueueStage): string {
  switch (stage) {
    case "todo":
      return "#f0ad4e";
    case "in_progress":
      return "#5bc0de";
    case "waiting":
      return "#337ab7";
    case "done":
      return "#5cb85c";
    case "archived":
      return "#999";
  }
}

function priorityBadgeColor(priority: TaskPriority): {
  bg: string;
  fg: string;
} {
  switch (priority) {
    case "high":
      return { bg: "#d9534f", fg: "#fff" };
    case "medium":
      return { bg: "#f0ad4e", fg: "#333" };
    case "low":
      return { bg: "#e0e0e0", fg: "#666" };
  }
}

function statusBadgeStyle(status: string): { bg: string; fg: string } {
  switch (status) {
    case "new":
      return { bg: "#d9edf7", fg: "#31708f" };
    case "viewed":
      return { bg: "#fcf8e3", fg: "#8a6d3b" };
    case "saved":
      return { bg: "#e8f5e9", fg: "#388e3c" };
    case "rejected_by_me":
      return { bg: "#f5f5f5", fg: "#999" };
    case "letter_ready":
      return { bg: "#e1f5fe", fg: "#0277bd" };
    case "applied":
      return { bg: "#ede7f6", fg: "#4527a0" };
    case "hr_replied":
      return { bg: "#e0f2f1", fg: "#00695c" };
    case "interview":
      return { bg: "#fff3e0", fg: "#e65100" };
    case "test_task":
      return { bg: "#fce4ec", fg: "#c62828" };
    case "rejected_by_company":
      return { bg: "#f5f5f5", fg: "#999" };
    case "offer":
      return { bg: "#c8e6c9", fg: "#1b5e20" };
    case "blacklist":
      return { bg: "#212121", fg: "#fff" };
    default:
      return { bg: "#eee", fg: "#333" };
  }
}

function daysLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days}d ago`;
}

// ── Main component ───────────────────────────────────────────────────────────

export function QueueSection(): ReactNode {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Queue view state
  const [grouped, setGrouped] = useState(true);
  const [filter, setFilter] = useState<QueueFilter>({});
  const [sort, setSort] = useState<QueueSort>({
    field: "priority",
    direction: "asc",
  });
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [titleSearchInput, setTitleSearchInput] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobRepo.list();
      data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  // Listen for storage changes to auto-refresh.
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      const relevantChange = Object.keys(changes).some(
        (key) => key.startsWith("badge_v1_hh_") || key === "app_settings_v1",
      );
      if (relevantChange) {
        void loadJobs();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadJobs]);

  // ── Apply title search debounce ──
  const handleTitleSearch = useCallback((value: string) => {
    setTitleSearchInput(value);
    setFilter((prev) => ({
      ...prev,
      titleSearch: value || undefined,
    }));
  }, []);

  if (loading) return <LoadingState message="Loading queue…" />;

  if (error)
    return (
      <ErrorState
        message="Failed to load queue"
        details={error}
        onRetry={() => void loadJobs()}
      />
    );

  if (!jobs || jobs.length === 0)
    return (
      <EmptyState
        icon="📋"
        message="Queue is empty"
        description="Saved vacancies will appear here as work items. Visit HH.ru search results and use quick save to add items."
      />
    );

  // ── Build queue tasks ──
  const allTasks = buildQueueTasks(jobs);
  const filteredTasks = filterQueueTasks(allTasks, filter);
  const sortedTasks = sortQueueTasks(filteredTasks, sort);
  const stats = computeQueueStats(allTasks);

  // ── Duplicate detection ──
  const duplicates = showDuplicates ? detectDuplicates(jobs) : [];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          Queue ({allTasks.length})
        </h2>
        <button
          type="button"
          onClick={() => void loadJobs()}
          style={{
            padding: "2px 10px",
            fontSize: 11,
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            color: "#555",
            fontWeight: 500,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          padding: "8px 12px",
          background: "#f9f9f9",
          borderRadius: 6,
          fontSize: 12,
          color: "#666",
        }}
      >
        <span>
          <strong>{stats.actionableCount}</strong> need action
        </span>
        <span>
          <strong>{stats.highPriorityCount}</strong> high priority
        </span>
        {Object.entries(stats.byStage)
          .filter(([, count]) => count > 0)
          .map(([stage, count]) => (
            <span key={stage}>
              <strong>{count}</strong>{" "}
              {STAGE_LABELS[stage as QueueStage].toLowerCase()}
            </span>
          ))}
      </div>

      {/* Controls: search, filter, sort, toggle */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Title search */}
        <input
          type="text"
          placeholder="Search by title…"
          value={titleSearchInput}
          onChange={(e) => handleTitleSearch(e.target.value)}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
            width: 180,
          }}
        />

        {/* Priority filter */}
        <select
          value={filter.priority ?? ""}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              priority: (e.target.value || undefined) as
                | TaskPriority
                | undefined,
            }))
          }
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Stage filter */}
        <select
          value={filter.stage ?? ""}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              stage: (e.target.value || undefined) as QueueStage | undefined,
            }))
          }
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        >
          <option value="">All stages</option>
          <option value="todo">To Decide</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="done">Done</option>
        </select>

        {/* Actionable only toggle */}
        <label
          style={{
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            color: "#555",
          }}
        >
          <input
            type="checkbox"
            checked={filter.actionableOnly ?? false}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                actionableOnly: e.target.checked || undefined,
              }))
            }
          />
          Actionable only
        </label>

        {/* Sort */}
        <select
          value={sort.field}
          onChange={(e) =>
            setSort((prev) => ({
              ...prev,
              field: e.target.value as QueueSortField,
            }))
          }
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        >
          <option value="priority">Sort: Priority</option>
          <option value="score">Sort: Score</option>
          <option value="updatedAt">Sort: Date</option>
          <option value="title">Sort: Title</option>
          <option value="company">Sort: Company</option>
        </select>

        {/* Grouped / Flat toggle */}
        <button
          type="button"
          onClick={() => setGrouped((g) => !g)}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: grouped ? "#4a90d9" : "#fff",
            color: grouped ? "#fff" : "#555",
            fontWeight: 500,
          }}
        >
          {grouped ? "Grouped" : "Flat"}
        </button>

        {/* Duplicate detection toggle */}
        <button
          type="button"
          onClick={() => setShowDuplicates((s) => !s)}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: showDuplicates ? "#f0ad4e" : "#fff",
            color: showDuplicates ? "#fff" : "#555",
            fontWeight: 500,
          }}
        >
          {showDuplicates
            ? `Duplicates: ${duplicates.length}`
            : "Show duplicates"}
        </button>
      </div>

      {/* Duplicate candidates panel */}
      {showDuplicates && duplicates.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fff8e1",
            border: "1px solid #ffe082",
            borderRadius: 6,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              margin: "0 0 8px",
              color: "#e65100",
            }}
          >
            ⚠ Potential Duplicates ({duplicates.length})
          </h3>
          {duplicates.slice(0, 10).map((dup, idx) => (
            <DuplicateRow key={idx} duplicate={dup} />
          ))}
          {duplicates.length > 10 && (
            <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0" }}>
              …and {duplicates.length - 10} more (showing top 10 by confidence)
            </p>
          )}
        </div>
      )}
      {showDuplicates && duplicates.length === 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 8,
            background: "#e8f5e9",
            borderRadius: 6,
            fontSize: 12,
            color: "#388e3c",
          }}
        >
          ✓ No duplicates detected.
        </div>
      )}

      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <p style={{ color: "#999", fontSize: 13, fontStyle: "italic" }}>
          No tasks match the current filters.
        </p>
      ) : grouped ? (
        <GroupedQueueView
          tasks={sortedTasks}
          onRefresh={() => void loadJobs()}
        />
      ) : (
        <FlatQueueView tasks={sortedTasks} onRefresh={() => void loadJobs()} />
      )}
    </div>
  );
}

// ── Grouped queue view ───────────────────────────────────────────────────────

function GroupedQueueView({
  tasks,
  onRefresh,
}: {
  tasks: QueueTask[];
  onRefresh: () => void;
}): ReactNode {
  const groups = groupByStage(tasks);

  return (
    <div>
      {groups.map((group) => (
        <StageGroup key={group.stage} group={group} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function StageGroup({
  group,
  onRefresh,
}: {
  group: TaskGroup;
  onRefresh: () => void;
}): ReactNode {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Group header */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: "#f5f5f5",
          borderRadius: "4px 4px 0 0",
          borderBottom: collapsed ? "none" : "1px solid #e0e0e0",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: stageColor(group.stage),
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>
          {group.label}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#999",
            background: "#e0e0e0",
            padding: "1px 6px",
            borderRadius: 8,
          }}
        >
          {group.count}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#999" }}>
          {collapsed ? "▶" : "▼"}
        </span>
      </div>

      {/* Task rows */}
      {!collapsed &&
        group.tasks.map((task) => (
          <QueueTaskRow key={task.jobId} task={task} onRefresh={onRefresh} />
        ))}
    </div>
  );
}

// ── Flat queue view ──────────────────────────────────────────────────────────

function FlatQueueView({
  tasks,
  onRefresh,
}: {
  tasks: QueueTask[];
  onRefresh: () => void;
}): ReactNode {
  return (
    <div>
      {tasks.map((task) => (
        <QueueTaskRow key={task.jobId} task={task} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

// ── Queue task row ───────────────────────────────────────────────────────────

function QueueTaskRow({
  task,
  onRefresh: _onRefresh,
}: {
  task: QueueTask;
  onRefresh: () => void;
}): ReactNode {
  void _onRefresh; // reserved for future interactive actions
  const priorityBadge = priorityBadgeColor(task.priority);
  const statusBadge = statusBadgeStyle(task.job.status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderBottom: "1px solid #f0f0f0",
        fontSize: 13,
      }}
    >
      {/* Priority indicator */}
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: priorityBadge.bg,
          flexShrink: 0,
        }}
        title={`Priority: ${task.priority}`}
      />

      {/* Title link */}
      <a
        href={task.job.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#4a90d9",
          textDecoration: "none",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={task.job.title}
      >
        {task.job.title || "(no title)"}
      </a>

      {/* Company */}
      <span
        style={{
          color: "#666",
          minWidth: 100,
          maxWidth: 140,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.job.companyName || "—"}
      </span>

      {/* Score */}
      <span
        style={{
          fontWeight: 600,
          color:
            (task.job.ruleScore?.total ?? 0) >= 55
              ? "#388e3c"
              : (task.job.ruleScore?.total ?? 0) >= 30
                ? "#f0ad4e"
                : "#999",
          minWidth: 50,
          textAlign: "center",
        }}
      >
        {task.job.ruleScore?.total !== undefined
          ? task.job.ruleScore.total
          : "—"}
      </span>

      {/* Status badge */}
      <span
        style={{
          display: "inline-block",
          padding: "1px 8px",
          borderRadius: 10,
          fontSize: 10,
          fontWeight: 600,
          background: statusBadge.bg,
          color: statusBadge.fg,
          whiteSpace: "nowrap",
        }}
      >
        {task.job.status.replace(/_/g, " ")}
      </span>

      {/* Next action hint */}
      <span
        style={{
          fontSize: 11,
          color: "#999",
          minWidth: 120,
          maxWidth: 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={task.nextAction}
      >
        → {task.nextAction}
      </span>

      {/* Days since update */}
      <span
        style={{
          fontSize: 10,
          color: task.daysSinceUpdate > 14 ? "#d9534f" : "#999",
          minWidth: 55,
          textAlign: "right",
        }}
      >
        {daysLabel(task.daysSinceUpdate)}
      </span>

      {/* Indicators */}
      {task.hasCoverLetter && (
        <span title="Has cover letter" style={{ fontSize: 11 }}>
          ✉️
        </span>
      )}
      {task.hasProfile && (
        <span title="Profile assigned" style={{ fontSize: 11 }}>
          👤
        </span>
      )}
    </div>
  );
}

// ── Duplicate row ────────────────────────────────────────────────────────────

function DuplicateRow({
  duplicate,
}: {
  duplicate: DuplicateCandidate;
}): ReactNode {
  const confidencePct = Math.round(duplicate.confidence * 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 0",
        fontSize: 12,
        borderBottom: "1px solid #ffe082",
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "1px 6px",
          borderRadius: 8,
          fontSize: 10,
          fontWeight: 700,
          background:
            duplicate.confidence >= 0.8
              ? "#d9534f"
              : duplicate.confidence >= 0.6
                ? "#f0ad4e"
                : "#5bc0de",
          color: "#fff",
        }}
      >
        {confidencePct}%
      </span>

      <a
        href={duplicate.jobA.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#4a90d9",
          textDecoration: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 200,
        }}
        title={duplicate.jobA.title}
      >
        {duplicate.jobA.title}
      </a>

      <span style={{ color: "#999" }}>≈</span>

      <a
        href={duplicate.jobB.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#4a90d9",
          textDecoration: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 200,
        }}
        title={duplicate.jobB.title}
      >
        {duplicate.jobB.title}
      </a>

      {duplicate.sameUrl && (
        <span
          style={{
            fontSize: 10,
            color: "#d9534f",
            fontWeight: 600,
          }}
        >
          same URL
        </span>
      )}
      {duplicate.sameDescriptionHash && !duplicate.sameUrl && (
        <span
          style={{
            fontSize: 10,
            color: "#d9534f",
            fontWeight: 600,
          }}
        >
          same desc
        </span>
      )}
      {duplicate.sameCompany && (
        <span style={{ fontSize: 10, color: "#f0ad4e" }}>same company</span>
      )}
    </div>
  );
}
