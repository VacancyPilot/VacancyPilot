import type { ReactNode } from "react";

interface ErrorStateProps {
  /** Short error title. */
  message: string;
  /** Optional technical details. */
  details?: string;
  /** Optional retry callback. */
  onRetry?: () => void;
}

/**
 * Inline error state used within a UI section (not the root error boundary).
 * Displays an error message and an optional retry button.
 */
export function ErrorState({
  message,
  details,
  onRetry,
}: ErrorStateProps): ReactNode {
  return (
    <div
      style={{
        padding: 16,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "#b33",
        background: "#fff5f5",
        border: "1px solid #e0b0b0",
        borderRadius: 6,
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{message}</p>
      {details && (
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>
          {details}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: "2px 10px",
            fontSize: 12,
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
