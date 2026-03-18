import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";

type RootErrorBoundaryProps = {
  children: React.ReactNode;
};

type RootErrorBoundaryState = {
  error: Error | null;
};

class RootErrorBoundary extends React.Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Root render error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#f8fafc",
            color: "#0f172a",
            fontFamily: "Segoe UI, Arial, sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              background: "#ffffff",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Frontend runtime error</h1>
            <p style={{ marginBottom: "16px" }}>
              The page crashed while rendering. The message below should help locate the exact broken field or component.
            </p>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "13px",
              }}
            >
              {this.state.error.stack || this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </RootErrorBoundary>
  </React.StrictMode>
);
