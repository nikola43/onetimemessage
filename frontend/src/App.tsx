import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Container, CircularProgress } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary";

const CreateMessage = lazy(() => import("./pages/CreateMessage"));
const ViewMessage = lazy(() => import("./pages/ViewMessage"));

function App() {
  return (
    <ErrorBoundary>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "radial-gradient(circle at 50% 50%, #132f4c 0%, #0a1929 100%)",
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
