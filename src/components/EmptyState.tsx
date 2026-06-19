import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Icon or emoji to show above the message. */
  icon?: string;
  /** Primary message. */
  message: string;
  /** Optional secondary description. */
  description?: string;
}

/**
 * Placeholder for screens that have no data yet.
 */
export function EmptyState({
  icon = "\uD83D\uDCCB",
  message,
  description,
}: EmptyStateProps): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "#999",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 32, marginBottom: 8 }}>{icon}</span>
      <p style={{ margin: "0 0 4px", fontWeight: 500, color: "#666" }}>
        {message}
      </p>
      {description && (
        <p style={{ margin: 0, fontSize: 12 }}>{description}</p>
      )}
    </div>
  );
}
