import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Fade,
  Alert,
  IconButton,
} from "@mui/material";
import { createMessage } from "../api/client";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { motion } from "framer-motion";

const CreateMessage = () => {
  const [msg, setMsg] = useState("");
  const [expiration, setExpiration] = useState(3600); // 1 hour default
  const [result, setResult] = useState<{
    link: string;
    privateKey: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await createMessage(msg, expiration);
      const link = `${window.location.origin}/msg/${data.public_id}`;
      setResult({ link, privateKey: data.private_key });
    } catch (err) {
      setError("Failed to create message");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", textAlign: "center" }}>
        <Typography
          variant="h1"
          gutterBottom
          sx={{ fontSize: "2.5rem !important" }}
        >
          One Time Message
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Send a military-grade encrypted message (RSA-8192).
        </Typography>

        {!result ? (
          <Box
            component="form"
            sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}
          >
            <TextField
              label="Secret Message"
              multiline
              rows={4}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              fullWidth
              placeholder="Type your secret here..."
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Lifetime"
                value={expiration}
                onChange={(e) => setExpiration(Number(e.target.value))}
                fullWidth
              >
                <MenuItem value={60}>1 Minute</MenuItem>
                <MenuItem value={3600}>1 Hour</MenuItem>
                <MenuItem value={86400}>1 Day</MenuItem>
                <MenuItem value={604800}>1 Week</MenuItem>
              </TextField>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!msg || loading}
            >
              {loading ? "Encrypting (RSA-8192)..." : "Create Secret Link"}
            </Button>
          </Box>
        ) : (
          <Fade in>
            <Box sx={{ mt: 3, textAlign: "left" }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>IMPORTANT:</strong> You must save the Private Key below.
                It is required to unlock the message. We do not store it.
              </Alert>

              <Typography variant="caption" color="text.secondary">
                1. Share this link:
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  mb: 3,
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  wordBreak: "break-all",
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  {result.link}
                </Typography>
                <IconButton
                  onClick={() => copyToClipboard(result.link)}
                  color="primary"
                >
                  <ContentCopyIcon />
                </IconButton>
              </Box>

              <Typography variant="caption" color="text.secondary">
                2. Share this Private Key (separately!):
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  value={result.privateKey}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: "monospace", fontSize: "0.8rem" },
                  }}
                />
                <Button
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyToClipboard(result.privateKey)}
                  sx={{ mt: 1 }}
                  fullWidth
                  variant="outlined"
                >
                  Copy Private Key
                </Button>
              </Box>

              <Button
                variant="contained"
                sx={{ mt: 4 }}
                fullWidth
                onClick={() => {
                  setResult(null);
                  setMsg("");
                }}
              >
                Create Another
              </Button>
            </Box>
          </Fade>
        )}
      </Paper>
    </motion.div>
  );
};

export default CreateMessage;
