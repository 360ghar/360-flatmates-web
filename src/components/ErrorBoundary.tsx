import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "@/pages/ErrorFallback";
import { debug } from "@/lib/debug";

interface Props {
  children: ReactNode;
  /** Optional section label shown in dev console output to identify the
   *  failing subtree (e.g. "RouteBoundary: /home"). */
  label?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const tag = this.props.label
      ? `ErrorBoundary:${this.props.label}`
      : "ErrorBoundary";

    // Always log the error, regardless of label. This ensures "Something
    // went wrong" screens never hide the root cause from the console.
    debug.dumpError(tag, `Caught error in ${this.props.label ?? "root"} boundary`, error);

    // Log component stack separately for readability
    if (info.componentStack) {
      debug.error(tag, "Component stack:", info.componentStack);
    }

    // Persist info in state so ErrorFallback can display it in dev mode
    this.setState({ errorInfo: info });
  }

  reset = () => this.setState({ hasError: false, error: undefined, errorInfo: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error ?? new Error("Unknown error")}
          componentStack={this.state.errorInfo?.componentStack ?? undefined}
          reset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Wrap a route element so a single misbehaving page doesn't take down
 * the whole app. Used by <App /> to give every lazy-loaded route its own
 * boundary, in addition to the top-level <ErrorBoundary> that catches
 * errors in the chrome (router, providers, layout shells).
 */
export function RouteBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary label="route">{children}</ErrorBoundary>;
}
