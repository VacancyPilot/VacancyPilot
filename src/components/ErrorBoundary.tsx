import { type ErrorInfo, Component, type ReactNode } from "react";
import {
  colors,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  fontFamily,
} from "../styles";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Label shown in the error message to identify which UI root crashed. */
  rootLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary for popup, side panel, and dashboard.
 *
 * - Catches render errors in the subtree.
 * - Shows a compact error message instead of a white screen.
 * - Offers a "Reload UI" button.
 * - Logs the error to the console.
 * - Does NOT send data anywhere — no telemetry.
 * - Uses shared design tokens for visual consistency.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[VacancyPilot] ErrorBoundary caught an error${
        this.props.rootLabel ? ` in ${this.props.rootLabel}` : ""
      }:`,
      error,
      info.componentStack,
    );
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const label = this.props.rootLabel ?? "UI";
      return (
        <div
          style={{
            padding: spacing.xxxl,
            fontFamily,
            fontSize: fontSizes.body,
            color: colors.text,
            background: colors.actionErrorBg,
            border: `1px solid ${colors.redBorder}`,
            borderRadius: borderRadius.lg,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              margin: `0 0 ${spacing.md}px`,
              fontWeight: fontWeights.semibold,
            }}
          >
            {label} crashed
          </p>
          <p
            style={{
              margin: `0 0 ${spacing.md}px`,
              color: colors.textMuted,
              fontSize: fontSizes.md,
            }}
          >
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: `${spacing.xs}px ${spacing.xl}px`,
              fontSize: fontSizes.md,
              cursor: "pointer",
              border: `1px solid ${colors.borderLight}`,
              borderRadius: borderRadius.md,
              background: colors.white,
            }}
          >
            Reload UI
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
