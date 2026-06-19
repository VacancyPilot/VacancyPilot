import { type ErrorInfo, Component, type ReactNode } from "react";

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
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[VacancyPilot] ErrorBoundary caught an error${this.props.rootLabel ? ` in ${this.props.rootLabel}` : ""}:`,
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
            padding: 16,
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
            color: "#333",
            background: "#fff3f3",
            border: "1px solid #e0a0a0",
            borderRadius: 6,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            {label} crashed
          </p>
          <p style={{ margin: "0 0 8px", color: "#666", fontSize: 12 }}>
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
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
