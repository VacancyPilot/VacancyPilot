import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { CoverLetterStudio } from "@/components/CoverLetterStudio";
import { GuidedApplyWorkspace } from "@/components/GuidedApplyWorkspace";
import { HrWorkspace } from "@/components/HrWorkspace";
import { ProfileTab } from "@/components/ProfileTab";
import { jobRepo } from "@/db/repositories";
import type { Job } from "@/models/job";
import type { RiskFlag } from "@/models/risk";
import type { ApplicationStatusSync } from "@/adapters/types";
import type { RawHrTimelineDTO } from "@/models/hr-timeline";
import { persistHrTimelineForJob } from "@/services/hr-timeline-sync";
import { useState, useCallback, useEffect, type ReactNode } from "react";

type TabId = "overview" | "score" | "letter" | "apply" | "profile" | "history" | "hr";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview" },
  { id: "score", label: "Score" },
  { id: "letter", label: "Letter" },
  { id: "apply", label: "Apply" },
  { id: "profile", label: "Profile" },
  { id: "history", label: "History" },
  { id: "hr", label: "HR" },
];

interface VacancyContext {
  jobId?: string;
  job?: Job;
  profileId?: string;
  resumeId?: string;
  passiveStatus?: Partial<ApplicationStatusSync> | null;
}

interface HrExtractionResponse {
  success: boolean;
  timeline?: RawHrTimelineDTO[];
  sourceVacancyId?: string | null;
  error?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(total: number | undefined): string {
  if (total === undefined) return "#999";
  if (total >= 85) return "#2a8";
  if (total >= 70) return "#6a6";
  if (total >= 50) return "#e6a817";
  return "#c44";
}

function statusBadgeStyle(status: string): { bg: string; fg: string } {
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

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
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

function riskSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#c44";
    case "high":
      return "#e66";
    case "medium":
      return "#e6a817";
    case "low":
      return "#4a90d9";
    default:
      return "#999";
  }
}

function detectSupportedPageKind(
  url: string | undefined,
): "vacancy" | "applications" | "messages" | "other" {
  if (!url) return "other";

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "hh.ru" && !parsed.hostname.endsWith(".hh.ru")) {
      return "other";
    }

    if (/^\/vacancy\/\d+/i.test(parsed.pathname)) return "vacancy";
    if (/^\/applicant\/responses/i.test(parsed.pathname)) return "applications";
    if (/^\/negotiations/i.test(parsed.pathname)) return "messages";
    return "other";
  } catch {
    return "other";
  }
}

// ── Main Side Panel ────────────────────────────────────────────────────────

function SidePanelContent(): ReactNode {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [ctx, setCtx] = useState<VacancyContext>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabClick = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  // Detect current vacancy from explicit background-managed context.
  // Falls back to active-tab guessing only when no context is available.
  useEffect(() => {
    let cancelled = false;

    async function detect(): Promise<void> {
      try {
        const context: { tabId: number; vacancyId: string | null } | null =
          await chrome.runtime.sendMessage({ type: "GET_SIDE_PANEL_CONTEXT" });

        let tab: chrome.tabs.Tab | undefined;
        if (context?.tabId && context.tabId > 0) {
          try {
            tab = await chrome.tabs.get(context.tabId);
          } catch {
            tab = undefined;
          }
        }

        if (!tab) {
          const [activeTab] = await chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
          });
          tab = activeTab;
        }

        if (cancelled || !tab?.url || tab.id === undefined) {
          if (!cancelled) setCtx({});
          return;
        }

        const pageKind = detectSupportedPageKind(tab.url);

        if (pageKind === "vacancy") {
          const match = tab.url.match(/\/vacancy\/(\d+)/);
          if (!match) {
            if (!cancelled) setCtx({});
            return;
          }

          const vacancyId = match[1];
          const jobId = `hh_${vacancyId}`;
          const job = await jobRepo.getById(jobId);

          try {
            const response: {
              success: boolean;
              passiveStatus?: Partial<ApplicationStatusSync> | null;
            } = await chrome.tabs.sendMessage(tab.id, {
              type: "EXTRACT_VACANCY",
            });
            if (!cancelled) {
              setCtx({
                jobId,
                job: job ?? undefined,
                profileId: job?.selectedProfileId,
                resumeId: job?.selectedResumeId,
                passiveStatus: response?.passiveStatus ?? undefined,
              });
            }
          } catch {
            if (!cancelled) {
              setCtx({
                jobId,
                job: job ?? undefined,
                profileId: job?.selectedProfileId,
                resumeId: job?.selectedResumeId,
              });
            }
          }
          return;
        }

        if (pageKind === "applications" || pageKind === "messages") {
          let vacancyId = context?.tabId === tab.id ? context?.vacancyId : null;

          let hrResponse: HrExtractionResponse | null = null;
          try {
            hrResponse = (await chrome.tabs.sendMessage(tab.id, {
              type: "EXTRACT_HR_TIMELINE",
            })) as HrExtractionResponse;
          } catch {
            hrResponse = null;
          }

          vacancyId = hrResponse?.sourceVacancyId ?? vacancyId ?? null;
          if (!vacancyId) {
            if (!cancelled) setCtx({});
            return;
          }

          const jobId = `hh_${vacancyId}`;
          const job = await jobRepo.getById(jobId);

          if (job && hrResponse?.success && hrResponse.timeline) {
            await persistHrTimelineForJob(job, hrResponse.timeline);
          }

          if (!cancelled) {
            setCtx({
              jobId,
              job: job ?? undefined,
              profileId: job?.selectedProfileId,
              resumeId: job?.selectedResumeId,
            });
          }
          return;
        }

        if (!cancelled) setCtx({});
      } catch {
        if (!cancelled) setCtx({});
      }
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Auto-refresh when badge state changes (popup saved/rejected a vacancy).
  useEffect(() => {
    function onChanged(
      changes: Record<string, chrome.storage.StorageChange>,
    ): void {
      const hasBadgeChange = Object.keys(changes).some((k) =>
        k.startsWith("badge_v1_hh_"),
      );
      if (hasBadgeChange) handleRefresh();
    }
    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, [handleRefresh]);

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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
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
        <button
          type="button"
          onClick={handleRefresh}
          title="Refresh"
          style={{
            padding: "2px 6px",
            fontSize: 11,
            cursor: "pointer",
            border: "1px solid #ddd",
            borderRadius: 4,
            background: "#fff",
            color: "#888",
          }}
        >
          ↻
        </button>
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
        <TabContent tab={activeTab} ctx={ctx} onRefresh={handleRefresh} />
      </div>
    </div>
  );
}

function TabContent({
  tab,
  ctx,
  onRefresh,
}: {
  tab: TabId;
  ctx: VacancyContext;
  onRefresh: () => void;
}): ReactNode {
  switch (tab) {
    case "overview":
      return <OverviewTab ctx={ctx} />;
    case "score":
      return <ScoreTab ctx={ctx} />;
    case "letter":
      return <LetterTab ctx={ctx} />;
    case "apply":
      return (
        <GuidedApplyWorkspace
          jobId={ctx.jobId ?? ""}
          job={ctx.job}
          profileId={ctx.profileId}
          resumeId={ctx.resumeId}
          onRefresh={onRefresh}
        />
      );
    case "profile":
      return <ProfileTabWrapper ctx={ctx} onRefresh={onRefresh} />;
    case "hr":
      return (
        <HrWorkspace
          jobId={ctx.jobId ?? ""}
          job={ctx.job}
          onRefresh={onRefresh}
        />
      );
    case "history":
      return <HistoryTab ctx={ctx} />;
  }
}

// ── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ ctx }: { ctx: VacancyContext }): ReactNode {
  if (!ctx.jobId) {
    return (
      <EmptyState
        icon="📋"
        message="Vacancy overview"
        description="Open a vacancy page to see details here."
      />
    );
  }

  if (!ctx.job) {
    return (
      <EmptyState
        icon="📋"
        message="Not saved yet"
        description="Save this vacancy from the popup to see details."
      />
    );
  }

  const job = ctx.job;
  const badge = statusBadgeStyle(job.status);

  return (
    <div>
      {/* Title and company */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>
          {job.title || "(no title)"}
        </h2>
        <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
          {job.companyName || "—"}
        </p>
      </div>

      {/* Passive HH status hint (informational, read-only) */}
      {ctx.passiveStatus && passiveStatusLabel(ctx.passiveStatus) && (
        <div
          style={{
            padding: "6px 8px",
            background: "#fff8e6",
            border: "1px solid #e6d58c",
            borderRadius: 4,
            marginBottom: 14,
            fontSize: 12,
            color: "#8a7010",
          }}
        >
          {passiveStatusLabel(ctx.passiveStatus)}
        </div>
      )}

      {/* Status + Score */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            background: badge.bg,
            color: badge.fg,
          }}
        >
          {statusLabel(job.status)}
        </span>
        {job.ruleScore && (
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: scoreColor(job.ruleScore.total),
            }}
          >
            {job.ruleScore.total}
          </span>
        )}
        {job.ruleScore?.recommendation && (
          <span
            style={{
              fontSize: 11,
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            {job.ruleScore.recommendation}
          </span>
        )}
      </div>

      {/* Key details */}
      <div
        style={{
          background: "#f9f9f9",
          borderRadius: 6,
          padding: 10,
          marginBottom: 14,
        }}
      >
        <DetailRow label="Salary" value={job.salaryRaw ?? "—"} />
        <DetailRow label="City" value={job.city ?? "—"} />
        <DetailRow label="Work mode" value={job.workMode ?? "—"} />
        <DetailRow label="Experience" value={job.experienceRaw ?? "—"} />
        <DetailRow label="Employment" value={job.employmentType ?? "—"} />
        <DetailRow label="Schedule" value={job.schedule ?? "—"} />
        <DetailRow
          label="Profile"
          value={job.selectedProfileId ? `✓ assigned` : "—"}
        />
        <DetailRow
          label="Resume"
          value={job.selectedResumeId ? `✓ assigned` : "—"}
        />
        <DetailRow
          label="First seen"
          value={formatShortDate(job.firstSeenAt)}
        />
        <DetailRow label="Last seen" value={formatShortDate(job.lastSeenAt)} />
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#888",
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            Skills
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {job.skills.map((skill) => (
              <span
                key={skill}
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: 11,
                  background: "#eef3ff",
                  color: "#4a6fa5",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description preview */}
      {job.descriptionClean && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#888",
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            Description
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#555",
              lineHeight: 1.5,
              maxHeight: 150,
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              background: "#fafafa",
              borderRadius: 4,
              padding: 8,
            }}
          >
            {job.descriptionClean.slice(0, 500)}
            {job.descriptionClean.length > 500 && "…"}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        fontSize: 12,
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Score Tab ──────────────────────────────────────────────────────────────

function ScoreTab({ ctx }: { ctx: VacancyContext }): ReactNode {
  if (!ctx.jobId) {
    return (
      <EmptyState
        icon="📊"
        message="Score breakdown"
        description="Open a vacancy page to see scoring."
      />
    );
  }

  if (!ctx.job) {
    return (
      <EmptyState
        icon="📊"
        message="Not saved yet"
        description="Save this vacancy from the popup to compute a score."
      />
    );
  }

  const score = ctx.job.ruleScore;

  if (!score) {
    return (
      <EmptyState
        icon="📊"
        message="No score"
        description="Create a profile with target titles and skills to enable scoring."
      />
    );
  }

  const breakdownEntries: Array<{
    label: string;
    score: number;
    max: number;
    section: string;
  }> = [
    {
      label: "Title match",
      score: score.breakdown.titleMatch,
      max: 20,
      section: "titleMatch",
    },
    {
      label: "Must-have skills",
      score: score.breakdown.mustHaveSkills,
      max: 25,
      section: "mustHaveSkills",
    },
    {
      label: "Nice-to-have skills",
      score: score.breakdown.niceToHaveSkills,
      max: 10,
      section: "niceToHaveSkills",
    },
    {
      label: "Experience fit",
      score: score.breakdown.experienceFit,
      max: 15,
      section: "experienceFit",
    },
    {
      label: "Work mode / location",
      score: score.breakdown.workModeLocation,
      max: 10,
      section: "workModeLocation",
    },
    {
      label: "Salary fit",
      score: score.breakdown.salaryFit,
      max: 10,
      section: "salaryFit",
    },
    {
      label: "Company preference",
      score: score.breakdown.companyPreference,
      max: 5,
      section: "companyPreference",
    },
    {
      label: "Language / misc",
      score: score.breakdown.languageScheduleMisc,
      max: 5,
      section: "languageScheduleMisc",
    },
  ];

  return (
    <div>
      {/* Total score header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
          padding: 12,
          background: "#f9f9f9",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: scoreColor(score.total),
            lineHeight: 1,
          }}
        >
          {score.total}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#999",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {score.recommendation}
        </div>
      </div>

      {/* Breakdown bars */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#888",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Breakdown
        </div>
        {breakdownEntries.map((entry) => {
          const pct = entry.max > 0 ? (entry.score / entry.max) * 100 : 0;
          const barColor = pct >= 80 ? "#2a8" : pct >= 50 ? "#e6a817" : "#c44";
          return (
            <div key={entry.label} style={{ marginBottom: 6 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 2,
                }}
              >
                <span style={{ color: "#555" }}>{entry.label}</span>
                <span style={{ fontWeight: 600 }}>
                  {entry.score}/{entry.max}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "#eee",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(pct, 100)}%`,
                    background: barColor,
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Caps applied */}
      {score.capsApplied && score.capsApplied.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#c44",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            Caps applied
          </div>
          {score.capsApplied.map((cap, i) => (
            <div
              key={i}
              style={{
                padding: "6px 8px",
                background: "#fff5f5",
                border: "1px solid #fcc",
                borderRadius: 4,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              <span style={{ color: "#c44", fontWeight: 600 }}>
                max {cap.maxScore}
              </span>
              <span style={{ color: "#666", marginLeft: 8 }}>{cap.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fit reasons */}
      {score.fitReasons.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#2a8",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            Fit reasons
          </div>
          {score.fitReasons.map((reason, i) => (
            <div
              key={i}
              style={{
                padding: "4px 0",
                fontSize: 12,
                color: "#555",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              ✓ {reason}
            </div>
          ))}
        </div>
      )}

      {/* Risk flags */}
      {score.riskFlags.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#c44",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            Risk flags
          </div>
          {score.riskFlags.map((flag, i) => (
            <RiskFlagRow key={i} flag={flag} />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskFlagRow({ flag }: { flag: RiskFlag }): ReactNode {
  const color = riskSeverityColor(flag.severity);
  return (
    <div
      style={{
        padding: "6px 8px",
        background: "#fff8f8",
        border: "1px solid #fee",
        borderRadius: 4,
        marginBottom: 4,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            display: "inline-block",
            padding: "0 5px",
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            background: color,
            color: "#fff",
            textTransform: "uppercase",
          }}
        >
          {flag.severity}
        </span>
        <span style={{ color: "#333" }}>{flag.message}</span>
      </div>
      {flag.evidence && (
        <div
          style={{ fontSize: 10, color: "#999", marginTop: 2, marginLeft: 2 }}
        >
          {flag.evidence}
        </div>
      )}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────

function HistoryTab({ ctx }: { ctx: VacancyContext }): ReactNode {
  if (!ctx.jobId) {
    return (
      <EmptyState
        icon="🕐"
        message="Status history"
        description="Open a vacancy page to see history."
      />
    );
  }

  if (!ctx.job) {
    return (
      <EmptyState
        icon="🕐"
        message="Not saved yet"
        description="Save this vacancy to start tracking status changes."
      />
    );
  }

  const history = ctx.job.statusHistory;
  if (!history || history.length === 0) {
    return (
      <EmptyState
        icon="🕐"
        message="No history"
        description="Status changes will appear as you interact with the vacancy."
      />
    );
  }

  // Show newest first
  const reversed = [...history].reverse();

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#888",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        Status history ({history.length})
      </div>

      <div style={{ position: "relative" }}>
        {/* Timeline line */}
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 0,
            bottom: 0,
            width: 2,
            background: "#e0e0e0",
          }}
        />

        {reversed.map((change, i) => {
          const isLast = i === reversed.length - 1;
          return (
            <div
              key={`${change.at}-${i}`}
              style={{
                position: "relative",
                paddingLeft: 24,
                marginBottom: isLast ? 0 : 14,
              }}
            >
              {/* Dot */}
              <div
                style={{
                  position: "absolute",
                  left: 3,
                  top: 3,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: isLast ? "#4a90d9" : "#bbb",
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 2px #e0e0e0",
                }}
              />

              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {change.from ? (
                  <>
                    <span style={{ color: "#999" }}>
                      {statusLabel(change.from)}
                    </span>
                    <span style={{ color: "#ccc", margin: "0 4px" }}>→</span>
                  </>
                ) : null}
                <span>{statusLabel(change.to)}</span>
              </div>
              <div style={{ fontSize: 10, color: "#999", marginTop: 1 }}>
                {formatShortDate(change.at)}
                <span style={{ marginLeft: 6, color: "#bbb" }}>
                  via {change.source}
                </span>
              </div>
              {change.note && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#666",
                    marginTop: 2,
                    fontStyle: "italic",
                  }}
                >
                  {change.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Letter Tab ─────────────────────────────────────────────────────────────

function LetterTab({ ctx }: { ctx: VacancyContext }): ReactNode {
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

// ── Profile Tab Wrapper ────────────────────────────────────────────────────

function ProfileTabWrapper({
  ctx,
  onRefresh,
}: {
  ctx: VacancyContext;
  onRefresh: () => void;
}): ReactNode {
  return (
    <ProfileTab
      jobId={ctx.jobId}
      job={ctx.job}
      profileId={ctx.profileId}
      resumeId={ctx.resumeId}
      onProfileChange={onRefresh}
      onResumeChange={onRefresh}
    />
  );
}

// ── App Root ───────────────────────────────────────────────────────────────

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Side Panel">
      <SidePanelContent />
    </ErrorBoundary>
  );
}
