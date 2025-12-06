import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background:
              "radial-gradient(circle at 50% 50%, #132f4c 0%, #0a1929 100%)",
            p: 3,
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: "center" }}>
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We apologize for the inconvenience. Please try refreshing the
              page.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
