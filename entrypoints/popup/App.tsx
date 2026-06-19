import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageStatus, PageStatus } from "@/components/PageStatus";
import { EmptyState } from "@/components/EmptyState";
import { useCallback, type ReactNode } from "react";

function openSidePanel(): void {
  chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
}

function openDashboard(): void {
  chrome.runtime.openOptionsPage();
}

function PopupContent(): ReactNode {
  const pageInfo = usePageStatus();

  const handleSave = useCallback(() => {
    // TODO ITER-010: wire to tracker.save
    console.log("[VacancyPilot] Save clicked");
  }, []);

  const handleReject = useCallback(() => {
    // TODO ITER-010: wire to tracker.updateStatus
    console.log("[VacancyPilot] Reject clicked");
  }, []);

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

      {/* Score & Status placeholder */}
      {pageInfo.kind === "vacancy" ? (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "#666" }}>Score</span>
            <span style={{ fontWeight: 600 }}>—</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#666" }}>Status</span>
            <span style={{ fontWeight: 600 }}>—</span>
          </div>
        </div>
      ) : pageInfo.kind === "loading" ? null : (
        <EmptyState
          icon="🔍"
          message="No vacancy detected"
          description="Open an HH.ru vacancy page to start."
        />
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: pageInfo.kind === "vacancy" ? 10 : 0,
        }}
      >
        {pageInfo.kind === "vacancy" && (
          <>
            <ActionButton label="Save" color="#2a8" onClick={handleSave} />
            <ActionButton label="Reject" color="#c44" onClick={handleReject} />
          </>
        )}
        <ActionButton label="Side Panel" onClick={openSidePanel} primary wide />
        <ActionButton label="Dashboard" onClick={openDashboard} wide />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  color,
  primary,
  wide,
}: {
  label: string;
  onClick: () => void;
  color?: string;
  primary?: boolean;
  wide?: boolean;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: wide ? 1 : undefined,
        padding: "4px 8px",
        fontSize: 12,
        cursor: "pointer",
        border: primary ? `1px solid ${color ?? "#4a90d9"}` : "1px solid #ddd",
        borderRadius: 4,
        background: primary ? (color ?? "#4a90d9") : "#fff",
        color: primary ? "#fff" : (color ?? "#333"),
        fontWeight: primary ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

export default function App(): ReactNode {
  return (
    <ErrorBoundary rootLabel="Popup">
      <PopupContent />
    </ErrorBoundary>
  );
}
