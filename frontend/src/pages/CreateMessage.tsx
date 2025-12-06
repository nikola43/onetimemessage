import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Fade,
  IconButton,
} from "@mui/material";
import { createMessage } from "../api/client";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { motion } from "framer-motion";
import { toast } from "sonner";

const CreateMessage = () => {
  const [msg, setMsg] = useState("");
  const [expiration, setExpiration] = useState(3600); // 1 hour default
  const [result, setResult] = useState<{
    link: string;
    privateKey: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = await createMessage(msg, expiration);
      const link = `${window.location.origin}/msg/${data.public_id}`;
      setResult({ link, privateKey: data.private_key });
      toast.success("Message created successfully!");
    } catch (err) {
      toast.error("Failed to create message");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
    >
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
          One Time Message
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Send a military-grade encrypted message (RSA-8192).
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Need 18,000,000,000,000,000,000,000,000,000,000,000,000 years to break encryption.
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
              variant="filled"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Lifetime"
                value={expiration}
                onChange={(e) => setExpiration(Number(e.target.value))}
                fullWidth
                variant="filled"
              >
                <MenuItem value={60}>1 Minute</MenuItem>
                <MenuItem value={3600}>1 Hour</MenuItem>
                <MenuItem value={86400}>1 Day</MenuItem>
                <MenuItem value={604800}>1 Week</MenuItem>
              </TextField>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!msg || loading}
              sx={{
                background: "linear-gradient(45deg, #00bcd4 30%, #2196f3 90%)",
                boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                color: "white",
                height: 48,
              }}
            >
              {loading ? "Encrypting (RSA-8192)..." : "Create Secret Link"}
            </Button>
          </Box>
        ) : (
          <Fade in>
            <Box sx={{ mt: 3, textAlign: "left" }}>
              <Typography
                variant="body1"
                sx={{ mb: 2, fontWeight: "bold", color: "warning.main" }}
              >
                ⚠️ IMPORTANT: You must save the Private Key below. It is
                required to unlock the message. We do not store it.
              </Typography>

              <Typography variant="caption" color="text.secondary">
                1. Share this link:
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  mb: 3,
                  p: 2,
                  bgcolor: "rgba(0,0,0,0.3)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  wordBreak: "break-all",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", color: "#00bcd4" }}
                >
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
                  bgcolor: "rgba(0,0,0,0.3)",
                  borderRadius: 2,
                  position: "relative",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  value={result.privateKey}
                  InputProps={{
                    readOnly: true,
                    sx: {
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      color: "#ff4081",
                    },
                  }}
                  variant="standard"
                />
                <Button
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyToClipboard(result.privateKey)}
                  sx={{ mt: 1 }}
                  fullWidth
                  variant="outlined"
                  color="secondary"
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
