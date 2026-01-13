import React from "react";
import { AlertTriangle, Copy, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep console logging for debugging in production.
    console.error("[AppErrorBoundary] Uncaught render error:", error, errorInfo);
  }

  private copyError = async () => {
    if (!this.state.error) return;
    const text = `${this.state.error.name}: ${this.state.error.message}\n\n${this.state.error.stack || ""}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy error:", e);
    }
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Something went wrong</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The app hit an unexpected error while rendering this page.
              </p>

              <div className="mt-4 rounded-lg bg-background/50 border border-border p-3">
                <p className="text-sm font-medium">{error.name}</p>
                <p className="text-sm text-muted-foreground break-words">
                  {error.message}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => (window.location.href = "/")}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  onClick={this.copyError}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy error
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                If you share this error text with support, we can fix it faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
