import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageStatus, PageStatus } from "@/components/PageStatus";
import { EmptyState } from "@/components/EmptyState";
import { tracker } from "@/services/tracker";
import { recomputeScoreForJob } from "@/services/score-recompute";
import { persistBadgeState } from "@/services/badge-state";
import { jobRepo, profileRepo } from "@/db/repositories";
import { loadSettings } from "@/db/settings-bridge";
import type { Job, JobStatus } from "@/models/job";
import type { Profile } from "@/models/profile";
import type { ApplicationStatusSync } from "@/adapters/types";
import type { PageStatusInfo } from "@/components/PageStatus";

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

// ── Popup Content ──

function PopupContent(): ReactNode {
  const pageInfo = usePageStatus();
  const [savedJob, setSavedJob] = useState<Job | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobLoaded, setJobLoaded] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<
    string | undefined
  >();
  const [passiveStatus, setPassiveStatus] = useState<
    Partial<ApplicationStatusSync> | null | undefined
  >(undefined);

  // Load profiles on mount
  useEffect(() => {
    async function loadProfiles(): Promise<void> {
      try {
        const [list, settings] = await Promise.all([
          profileRepo.list(),
          loadSettings(),
        ]);
        setProfiles(list);
        // Preselect: job's selectedProfileId > settings default > first profile
        const defaultId =
          savedJob?.selectedProfileId ??
          settings.general.defaultProfileId ??
          list[0]?.id;
        setSelectedProfileId(defaultId);
      } catch {
        // Non-critical
      }
    }
    void loadProfiles();
  }, [savedJob?.selectedProfileId]);

  // Load saved job from DB when vacancy is detected.
  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (pageInfo.kind !== "vacancy" || !pageInfo.vacancyId) {
        if (!cancelled) {
          setSavedJob(null);
          setJobLoaded(true);
          setPassiveStatus(undefined);
        }
        return;
      }

      try {
        const jobId = buildJobId(pageInfo.vacancyId);
        const job = await jobRepo.getById(jobId);
        if (!cancelled) {
          setSavedJob(job ?? null);
          setJobLoaded(true);

          // Update badge from saved state on popup open.
          if (job) {
            await updateBadge(pageInfo.tabId, job);
            await persistBadgeState(pageInfo.vacancyId, {
              score: job.ruleScore?.total,
              status: job.status,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setSavedJob(null);
          setJobLoaded(true);
        }
      }

      // Fetch passive HH status from the content script (independent of save state).
      try {
        const response: {
          success: boolean;
          passiveStatus?: Partial<ApplicationStatusSync> | null;
        } = await chrome.tabs.sendMessage(pageInfo.tabId, {
          type: "EXTRACT_VACANCY",
        });
        if (!cancelled) {
          setPassiveStatus(response?.passiveStatus ?? undefined);
        }
      } catch {
        // Content script may not be reachable — non-critical.
        if (!cancelled) setPassiveStatus(undefined);
      }
    }

    setJobLoaded(false);
    setActionError(null);
    setPassiveStatus(undefined);
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
        passiveStatus?: Partial<ApplicationStatusSync> | null;
      } = await chrome.tabs.sendMessage(pageInfo.tabId, {
        type: "EXTRACT_VACANCY",
      });

      // Update passive status from the response.
      setPassiveStatus(response?.passiveStatus ?? undefined);

      if (!response?.success || !response.dto) {
        setActionError(response?.error ?? "Could not extract vacancy data");
        setIsSaving(false);
        return;
      }

      const job = await tracker.saveFromDTO(response.dto);

      // Compute score if a profile is available (uses shared recompute path).
      const jobWithScore =
        (await recomputeScoreForJob(job.id, selectedProfileId)) ?? job;

      setSavedJob(jobWithScore);

      // Update the page badge live (recomputeScoreForJob already persisted badge state).
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
  }, [pageInfo, selectedProfileId]);

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
          passiveStatus?: Partial<ApplicationStatusSync> | null;
        } = await chrome.tabs.sendMessage(pageInfo.tabId, {
          type: "EXTRACT_VACANCY",
        });

        // Update passive status from the response.
        setPassiveStatus(response?.passiveStatus ?? undefined);

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
        await persistBadgeState(pageInfo.vacancyId, {
          score: updated.ruleScore?.total,
          status: updated.status,
        });
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

  // Score breakdown visibility toggle
  const [showBreakdown, setShowBreakdown] = useState(false);

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

      {/* Passive HH status hint (informational, read-only) */}
      {passiveStatus && passiveStatusLabel(passiveStatus) && (
        <div
          style={{
            padding: "6px 8px",
            background: "#fff8e6",
            border: "1px solid #e6d58c",
            borderRadius: 4,
            marginBottom: 10,
            fontSize: 12,
            color: "#8a7010",
          }}
        >
          {passiveStatusLabel(passiveStatus)}
        </div>
      )}

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

          {/* Score breakdown toggle */}
          {savedJob?.ruleScore && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                style={{
                  width: "100%",
                  padding: "3px 6px",
                  fontSize: 11,
                  cursor: "pointer",
                  border: "1px solid #ddd",
                  borderRadius: 3,
                  background: "#f9f9f9",
                  color: "#888",
                  textAlign: "left",
                }}
              >
                {showBreakdown ? "▾ Hide breakdown" : "▸ Show breakdown"}
              </button>
              {showBreakdown && <ScoreBreakdown score={savedJob.ruleScore} />}
            </div>
          )}
        </div>
      ) : pageInfo.kind === "loading" || (isVacancy && !jobLoaded) ? null : (
        <EmptyState
          icon="🔍"
          message="No vacancy detected"
          description="Open an HH.ru vacancy page to start."
        />
      )}

      {/* Profile selector */}
      {isVacancy && profiles.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "#666",
              marginBottom: 3,
            }}
          >
            Profile
          </label>
          <select
            value={selectedProfileId ?? ""}
            onChange={(e) => setSelectedProfileId(e.target.value || undefined)}
            style={{
              width: "100%",
              padding: "4px 6px",
              fontSize: 12,
              border: "1px solid #ddd",
              borderRadius: 3,
              background: "#fff",
              color: "#333",
            }}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
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
        <ActionButton
          label="Side Panel"
          onClick={() => openSidePanel(pageInfo)}
          primary
          wide
        />
        <ActionButton label="Dashboard" onClick={openDashboard} wide />
      </div>
    </div>
  );
}

function buildOpenSidePanelMessage(
  pageInfo: PageStatusInfo,
): {
  type: "OPEN_SIDE_PANEL";
  tabId?: number;
  vacancyId?: string;
} {
  if (pageInfo.kind === "vacancy") {
    return {
      type: "OPEN_SIDE_PANEL",
      tabId: pageInfo.tabId,
      vacancyId: pageInfo.vacancyId,
    };
  }

  return { type: "OPEN_SIDE_PANEL" };
}

function openSidePanel(pageInfo: PageStatusInfo): void {
  chrome.runtime.sendMessage(buildOpenSidePanelMessage(pageInfo));
}

function openDashboard(): void {
  chrome.runtime.openOptionsPage();
}

/**
 * Format a passive HH status into a user-facing informational label.
 * Only returns a label for detected statuses; returns null if no status.
 */
function passiveStatusLabel(
  status: Partial<ApplicationStatusSync>,
): string | null {
  if (status.detectedApplied) return "HH shows: Вы откликнулись";
  if (status.detectedRejected) return "HH shows: Отказ";
  if (status.detectedInvitation) return "HH shows: Приглашение";
  if (status.detectedViewedByEmployer)
    return "HH shows: Работодатель просмотрел резюме";
  return null;
}

// ── Score Breakdown ──────────────────────────────────────────────────────

function ScoreBreakdown({
  score,
}: {
  score: import("@/models/scoring").ScoreResult;
}): ReactNode {
  const entries: Array<{ label: string; score: number; max: number }> = [
    { label: "Title", score: score.breakdown.titleMatch, max: 20 },
    {
      label: "Must-have skills",
      score: score.breakdown.mustHaveSkills,
      max: 25,
    },
    { label: "Nice-to-have", score: score.breakdown.niceToHaveSkills, max: 10 },
    { label: "Experience", score: score.breakdown.experienceFit, max: 15 },
    {
      label: "Work/Location",
      score: score.breakdown.workModeLocation,
      max: 10,
    },
    { label: "Salary", score: score.breakdown.salaryFit, max: 10 },
    { label: "Company", score: score.breakdown.companyPreference, max: 5 },
    { label: "Misc", score: score.breakdown.languageScheduleMisc, max: 5 },
  ];

  return (
    <div
      style={{
        marginTop: 6,
        padding: "6px 8px",
        background: "#f9f9f9",
        borderRadius: 4,
        fontSize: 11,
      }}
    >
      {entries.map((e) => {
        const pct = e.max > 0 ? (e.score / e.max) * 100 : 0;
        const barColor = pct >= 80 ? "#2a8" : pct >= 50 ? "#e6a817" : "#c44";
        return (
          <div key={e.label} style={{ marginBottom: 3 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 1,
              }}
            >
              <span style={{ color: "#888" }}>{e.label}</span>
              <span style={{ fontWeight: 600 }}>
                {e.score}/{e.max}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "#eee",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(pct, 100)}%`,
                  background: barColor,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}

      {score.fitReasons.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontWeight: 600, color: "#2a8", marginBottom: 2 }}>
            Fit reasons
          </div>
          {score.fitReasons.slice(0, 3).map((r, i) => (
            <div key={i} style={{ color: "#555", padding: "1px 0" }}>
              ✓ {r}
            </div>
          ))}
          {score.fitReasons.length > 3 && (
            <div style={{ color: "#999", fontSize: 10 }}>
              +{score.fitReasons.length - 3} more
            </div>
          )}
        </div>
      )}

      {score.riskFlags.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontWeight: 600, color: "#c44", marginBottom: 2 }}>
            Risk flags
          </div>
          {score.riskFlags.slice(0, 3).map((flag, i) => (
            <div
              key={i}
              style={{ color: "#c44", padding: "1px 0", fontSize: 10 }}
            >
              ⚠ {flag.message}
            </div>
          ))}
          {score.riskFlags.length > 3 && (
            <div style={{ color: "#999", fontSize: 10 }}>
              +{score.riskFlags.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
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
