import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { getMessage } from "../api/client";
import { motion } from "framer-motion";
import axios from "axios";

const ViewMessage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [privateKey, setPrivateKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleReveal = async () => {
    if (!publicId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMessage(publicId, privateKey);
      setMessage(data.msg);
      setRevealed(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Failed to retrieve message.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", textAlign: "center" }}>
        <Typography
          variant="h1"
          gutterBottom
          sx={{ fontSize: "2.5rem !important" }}
        >
          Secret Message
        </Typography>

        {!revealed ? (
          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="body1" color="text.secondary">
              This message is protected with military-grade RSA-8192 encryption.
              <br />
              Please enter the Private Key to unlock it.
            </Typography>

            <TextField
              label="Private Key (PEM)"
              multiline
              rows={8}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              fullWidth
              placeholder="-----BEGIN RSA PRIVATE KEY-----..."
              sx={{ fontFamily: "monospace" }}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={handleReveal}
              disabled={loading || !privateKey}
              color="secondary"
            >
              {loading ? <CircularProgress size={24} /> : "Unlock Message"}
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              This message has been destroyed from the server. Copy it now if
              you need to save it.
            </Alert>

            <Paper
              variant="outlined"
              sx={{ p: 3, bgcolor: "background.default", textAlign: "left" }}
            >
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                }}
              >
                {message}
              </Typography>
            </Paper>

            <Button variant="text" sx={{ mt: 3 }} onClick={() => navigate("/")}>
              Send a Reply
            </Button>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default ViewMessage;
