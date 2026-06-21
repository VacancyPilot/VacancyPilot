import type { ReactNode } from "react";
import {
  colors,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  fontFamily,
} from "../styles";

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
 * Uses shared design tokens for visual consistency.
 */
export function ErrorState({
  message,
  details,
  onRetry,
}: ErrorStateProps): ReactNode {
  return (
    <div
      style={{
        padding: spacing.xxxl,
        fontFamily,
        fontSize: fontSizes.body,
        color: colors.red,
        background: colors.errorBg,
        border: `1px solid ${colors.redBorder}`,
        borderRadius: borderRadius.lg,
      }}
    >
      <p
        style={{
          margin: `0 0 ${spacing.xs}px`,
          fontWeight: fontWeights.semibold,
        }}
      >
        {message}
      </p>
      {details && (
        <p
          style={{
            margin: `0 0 ${spacing.md}px`,
            fontSize: fontSizes.md,
            color: colors.textFaint,
          }}
        >
          {details}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: `${spacing.xs2}px ${spacing.lg}px`,
            fontSize: fontSizes.md,
            cursor: "pointer",
            border: `1px solid ${colors.borderLight}`,
            borderRadius: borderRadius.md,
            background: colors.white,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
