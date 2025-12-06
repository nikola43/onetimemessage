import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import { getMessage } from "../api/client";
import axios from "axios";

const ViewMessage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [privateKey, setPrivateKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");

  const handleReveal = async () => {
    if (!publicId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMessage(publicId, privateKey.trim());
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
    <Box>
      <Paper
        sx={{
          p: 4,
          maxWidth: 800,
          mx: "auto",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          background: "rgba(10, 25, 41, 0.7)",
        }}
      >
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontSize: "2.5rem !important",
            textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
          }}
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
              variant="filled"
            />

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={handleReveal}
              disabled={loading || !privateKey}
              sx={{
                background: "linear-gradient(45deg, #f50057 30%, #ff4081 90%)",
                boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
                color: "white",
                height: 48,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Unlock Message"
              )}
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="body1"
              sx={{ mb: 3, fontWeight: "bold", color: "warning.main" }}
            >
              ⚠️ This message has been destroyed from the server. Copy it now if
              you need to save it.
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "rgba(0,0,0,0.3)",
                textAlign: "left",
                border: "1px solid rgba(0, 255, 0, 0.3)",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                  color: "#00ff00",
                  textShadow: "0 0 5px rgba(0, 255, 0, 0.5)",
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
    </Box>
  );
};

export default ViewMessage;
