import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageStatus, PageStatus } from "@/components/PageStatus";
import { EmptyState } from "@/components/EmptyState";
import { tracker } from "@/services/tracker";
import { scoreJob } from "@/services/scoring";
import { jobRepo, profileRepo } from "@/db/repositories";
import type { Job, JobStatus } from "@/models/job";
import type { Profile } from "@/models/profile";
import { useCallback, useEffect, useState, type ReactNode } from "react";

// ── Helpers ──

function buildJobId(vacancyId: string): string {
  return `hh_${vacancyId}`;
}

async function updateBadge(tabId: number, job: Job): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "UPDATE_BADGE",
      payload: {
        score: job.ruleScore?.total,
        status: job.status,
      },
    });
  } catch {
    // Content script may not be loaded — non-critical.
  }
}

async function computeAndStoreScore(job: Job): Promise<Job> {
  // Try to find a relevant profile.
  // Priority: job.selectedProfileId > first available profile.
  let profile: Profile | undefined;

  if (job.selectedProfileId) {
    profile = await profileRepo.getById(job.selectedProfileId);
  }
  if (!profile) {
    const profiles = await profileRepo.list();
    profile = profiles[0];
  }

  if (!profile) {
    // No profile available — score stays undefined.
    return job;
  }

  const scoreResult = scoreJob(job, profile);
  const updated: Job = {
    ...job,
    ruleScore: scoreResult,
    selectedProfileId: job.selectedProfileId ?? profile.id,
  };
  await jobRepo.save(updated);
  return updated;
}

// ── Popup Content ──

function PopupContent(): ReactNode {
  const pageInfo = usePageStatus();
  const [savedJob, setSavedJob] = useState<Job | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobLoaded, setJobLoaded] = useState(false);

  // Load saved job from DB when vacancy is detected.
  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (pageInfo.kind !== "vacancy" || !pageInfo.vacancyId) {
        if (!cancelled) {
          setSavedJob(null);
          setJobLoaded(true);
        }
        return;
      }

      try {
        const jobId = buildJobId(pageInfo.vacancyId);
        const job = await jobRepo.getById(jobId);
        if (!cancelled) {
          setSavedJob(job ?? null);
          setJobLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setSavedJob(null);
          setJobLoaded(true);
        }
      }
    }

    setJobLoaded(false);
    setActionError(null);
    void load();

    return () => {
      cancelled = true;
    };
  }, [pageInfo]);

  // ── Save ──

  const handleSave = useCallback(async () => {
    if (pageInfo.kind !== "vacancy") return;

    setIsSaving(true);
    setActionError(null);

    try {
      // Request vacancy extraction from the content script.
      const response: {
        success: boolean;
        dto?: import("@/adapters/hh/types").RawVacancyDTO;
        error?: string;
      } = await chrome.tabs.sendMessage(pageInfo.tabId, {
        type: "EXTRACT_VACANCY",
      });

      if (!response?.success || !response.dto) {
        setActionError(response?.error ?? "Could not extract vacancy data");
        setIsSaving(false);
        return;
      }

      const job = await tracker.saveFromDTO(response.dto);

      // Compute score if a profile is available.
      const jobWithScore = await computeAndStoreScore(job);

      setSavedJob(jobWithScore);

      // Update the page badge.
      await updateBadge(pageInfo.tabId, jobWithScore);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("Could not establish connection") ||
        msg.includes("receiving end does not exist")
      ) {
        setActionError(
          "Could not reach the vacancy page. Try reloading the page first.",
        );
      } else {
        setActionError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [pageInfo]);

  // ── Reject ──

  const handleReject = useCallback(async () => {
    if (pageInfo.kind !== "vacancy") return;

    setIsSaving(true);
    setActionError(null);

    try {
      // If the job is already saved, update its status.
      // If not saved yet, save first then reject.
      let job = savedJob ?? null;

      if (!job) {
        // Need to extract and save first.
        const response: {
          success: boolean;
          dto?: import("@/adapters/hh/types").RawVacancyDTO;
          error?: string;
        } = await chrome.tabs.sendMessage(pageInfo.tabId, {
          type: "EXTRACT_VACANCY",
        });

        if (!response?.success || !response.dto) {
          setActionError(response?.error ?? "Could not extract vacancy data");
          setIsSaving(false);
          return;
        }

        job = await tracker.saveFromDTO(response.dto);
      }

      const updated = await tracker.updateStatus(
        job.id,
        "rejected_by_me" as JobStatus,
        "Rejected from popup",
      );

      if (updated) {
        setSavedJob(updated);
        await updateBadge(pageInfo.tabId, updated);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("Could not establish connection") ||
        msg.includes("receiving end does not exist")
      ) {
        setActionError(
          "Could not reach the vacancy page. Try reloading the page first.",
        );
      } else {
        setActionError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [pageInfo, savedJob]);

  // ── Derived display values ──

  const scoreDisplay =
    savedJob?.ruleScore?.total !== undefined
      ? String(savedJob.ruleScore.total)
      : "—";

  const statusDisplay = savedJob?.status ?? "—";

  const recommendation = savedJob?.ruleScore?.recommendation;

  const scoreColor =
    savedJob?.ruleScore?.total !== undefined
      ? savedJob.ruleScore.total >= 80
        ? "#2a8"
        : savedJob.ruleScore.total >= 50
          ? "#e6a817"
          : "#c44"
      : "#999";

  const isVacancy = pageInfo.kind === "vacancy";

  // ── Render ──

  return (
    <div
      style={{
        width: 300,
        padding: 12,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        color: "#333",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h1
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: "#1a3a5c",
          }}
        >
          VacancyPilot
        </h1>
        <span style={{ fontSize: 11, color: "#aaa" }}>v0.1</span>
      </div>

      {/* Page status */}
      <div
        style={{
          padding: "6px 8px",
          background: "#f5f5f5",
          borderRadius: 4,
          marginBottom: 10,
        }}
      >
        <PageStatus info={pageInfo} />
      </div>

      {/* Score & Status */}
      {isVacancy && jobLoaded ? (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "#666" }}>Score</span>
            <span style={{ fontWeight: 600, color: scoreColor }}>
              {scoreDisplay}
            </span>
          </div>
          {recommendation && (
            <div
              style={{
                fontSize: 11,
                color: "#999",
                marginBottom: 6,
                textAlign: "right",
              }}
            >
              {recommendation}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#666" }}>Status</span>
            <span style={{ fontWeight: 600 }}>{statusDisplay}</span>
          </div>
        </div>
      ) : pageInfo.kind === "loading" || (isVacancy && !jobLoaded) ? null : (
        <EmptyState
          icon="🔍"
          message="No vacancy detected"
          description="Open an HH.ru vacancy page to start."
        />
      )}

      {/* Error message */}
      {actionError && (
        <div
          style={{
            padding: "6px 8px",
            background: "#fff3f3",
            border: "1px solid #fcc",
            borderRadius: 4,
            marginBottom: 10,
            fontSize: 12,
            color: "#c44",
          }}
        >
          {actionError}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: isVacancy ? 10 : 0,
        }}
      >
        {isVacancy && (
          <>
            <ActionButton
              label="Save"
              color="#2a8"
              onClick={handleSave}
              disabled={isSaving}
            />
            <ActionButton
              label="Reject"
              color="#c44"
              onClick={handleReject}
              disabled={isSaving}
            />
          </>
        )}
        <ActionButton label="Side Panel" onClick={openSidePanel} primary wide />
        <ActionButton label="Dashboard" onClick={openDashboard} wide />
      </div>
    </div>
  );
}

function openSidePanel(): void {
  chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
}

function openDashboard(): void {
  chrome.runtime.openOptionsPage();
}

// ── Action Button ──

function ActionButton({
  label,
  onClick,
  color,
  primary,
  wide,
  disabled,
}: {
  label: string;
  onClick: () => void;
  color?: string;
  primary?: boolean;
  wide?: boolean;
  disabled?: boolean;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: wide ? 1 : undefined,
        padding: "4px 8px",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        border: primary ? `1px solid ${color ?? "#4a90d9"}` : "1px solid #ddd",
        borderRadius: 4,
        background: primary ? (color ?? "#4a90d9") : "#fff",
        color: primary ? "#fff" : (color ?? "#333"),
        fontWeight: primary ? 600 : 400,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ── App Root ──

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Popup">
      <PopupContent />
    </ErrorBoundary>
  );
}
