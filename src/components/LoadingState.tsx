import type { ReactNode } from "react";

interface LoadingStateProps {
  /** Optional message; defaults to "Loading…". */
  message?: string;
}

/**
 * Minimal loading placeholder.
 * Used when data is being fetched or computed asynchronously.
 */
export function LoadingState({ message = "Loading\u2026" }: LoadingStateProps): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "#999",
      }}
    >
      {message}
    </div>
  );
}
