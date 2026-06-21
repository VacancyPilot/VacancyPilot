import type { ReactNode } from "react";
import { colors, fontSizes, fontWeights, spacing, fontFamily } from "../styles";

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
 * Uses shared design tokens for visual consistency.
 */
export function EmptyState({
  icon = "📋",
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
        padding: spacing.emptyLarge,
        fontFamily,
        fontSize: fontSizes.body,
        color: colors.textPlaceholder,
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: fontSizes.icon, marginBottom: spacing.md }}>
        {icon}
      </span>
      <p
        style={{
          margin: `0 0 ${spacing.xs}px`,
          fontWeight: fontWeights.semibold,
          color: colors.textMuted,
        }}
      >
        {message}
      </p>
      {description && (
        <p style={{ margin: 0, fontSize: fontSizes.md }}>{description}</p>
      )}
    </div>
  );
}
