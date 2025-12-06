import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Container, CircularProgress } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary";
import MatrixBackground from "./components/MatrixBackground";
import { Toaster } from "sonner";

const CreateMessage = lazy(() => import("./pages/CreateMessage"));
const ViewMessage = lazy(() => import("./pages/ViewMessage"));

function App() {
  return (
    <ErrorBoundary>
      <MatrixBackground />
      <Toaster position="top-center" richColors theme="dark" />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          // Removed gradient to let Matrix background show through, or use a semi-transparent overlay
          background:
            "radial-gradient(circle at 50% 50%, rgba(19, 47, 76, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%)",
        }}
      >
        <Container maxWidth="md">
          <Suspense fallback={<CircularProgress />}>
            <Routes>
              <Route path="/" element={<CreateMessage />} />
              <Route path="/msg/:publicId" element={<ViewMessage />} />
            </Routes>
          </Suspense>
        </Container>
      </Box>
    </ErrorBoundary>
  );
}

export default App;
