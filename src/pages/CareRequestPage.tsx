import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { createCareRequest } from "../api/careRequests";
import WorkspaceShell from "../components/layout/WorkspaceShell";
import { clearClientLogs, logClientEvent, useClientLogs } from "../logging/clientLogger";

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function CareRequestPage() {
  const navigate = useNavigate();
  const [residentId, setResidentId] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const logs = useClientLogs();

  const trimmedResidentId = residentId.trim();
  const trimmedDescription = description.trim();
  const isResidentIdValid = !trimmedResidentId || guidPattern.test(trimmedResidentId);
  const descriptionCount = trimmedDescription.length;
  const latestLogs = useMemo(() => logs.slice(0, 4), [logs]);
  const canSubmit =
    !isLoading &&
    trimmedResidentId.length > 0 &&
    trimmedDescription.length > 0 &&
    isResidentIdValid;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trimmedResidentId || !trimmedDescription) {
      setFeedback({
        type: "error",
        message: "Resident ID and description are both required.",
      });
      return;
    }

    if (!guidPattern.test(trimmedResidentId)) {
      setFeedback({
        type: "error",
        message: "Resident ID must be a valid GUID before you can submit.",
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await createCareRequest({
        residentId: trimmedResidentId,
        description: trimmedDescription,
      });

      logClientEvent("web.ui", "Create care request succeeded", {
        residentId: trimmedResidentId,
        createdId: response.id,
      });

      setFeedback({
        type: "success",
        message: `Care Request created successfully with ID ${response.id}.`,
      });
      setResidentId("");
      setDescription("");
      navigate(`/care-requests/${response.id}`);
    } catch (error: any) {
      logClientEvent(
        "web.ui",
        "Create care request surfaced an error to the UI",
        {
          residentId: trimmedResidentId,
          message: error.message ?? "Unknown error",
        },
        "error",
      );

      setFeedback({
        type: "error",
        message: error.message ?? "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceShell
      eyebrow="New Request"
      title="Capture a request with enough context for clean downstream review."
      description="The intake view keeps validation, operational guidance, and recent client-side diagnostics visible while you enter the request."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/care-requests")}>
            View Queue
          </Button>
          <Button variant="contained" onClick={() => navigate("/home")}>
            Back To Overview
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4">Intake form</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                  Use a real resident GUID and a description that gives approvers enough clinical
                  context to route the work correctly.
                </Typography>
              </Box>

              {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}

              <TextField
                fullWidth
                label="Resident ID"
                value={residentId}
                onChange={(event) => setResidentId(event.target.value)}
                placeholder="550e8400-e29b-41d4-a716-446655440000"
                disabled={isLoading}
                error={!isResidentIdValid}
                helperText={
                  !isResidentIdValid
                    ? "Enter a valid GUID in 8-4-4-4-12 format."
                    : "The API expects a resident GUID."
                }
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={8}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the care needed, urgency, handoff expectations, and any operational detail relevant for approval."
                disabled={isLoading}
                helperText={`${descriptionCount} characters`}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
                  {isLoading ? (
                    <>
                      <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                      Creating Request
                    </>
                  ) : (
                    "Create Care Request"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  disabled={isLoading}
                  onClick={() => {
                    setResidentId("");
                    setDescription("");
                    setFeedback(null);
                  }}
                >
                  Reset Form
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 2.5, bgcolor: "#f3ede0" }}>
            <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
              Submission Checklist
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Alert severity={trimmedResidentId ? "success" : "info"} variant="outlined">
                Resident ID entered
              </Alert>
              <Alert severity={isResidentIdValid ? "success" : "error"} variant="outlined">
                GUID format {isResidentIdValid ? "looks valid" : "needs correction"}
              </Alert>
              <Alert
                severity={trimmedDescription.length > 24 ? "success" : "info"}
                variant="outlined"
              >
                Description is specific enough for triage
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Recent client logs</Typography>
              <Button size="small" variant="outlined" onClick={() => clearClientLogs()}>
                Clear
              </Button>
            </Stack>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {latestLogs.length === 0 ? (
                <Typography color="text.secondary">No logs captured yet.</Typography>
              ) : (
                latestLogs.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      p: 1.6,
                      borderRadius: 2,
                      bgcolor: "rgba(247, 244, 238, 0.72)",
                      border: "1px solid rgba(23, 48, 66, 0.08)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {log.timestamp} • {log.source} • {log.level.toUpperCase()}
                    </Typography>
                    <Typography sx={{ mt: 0.6, fontWeight: 700 }}>{log.message}</Typography>
                    {log.data && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            whiteSpace: "pre-wrap",
                            fontSize: 12,
                            color: "text.secondary",
                            fontFamily: '"IBM Plex Mono", "SFMono-Regular", monospace',
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Box>
                      </>
                    )}
                  </Box>
                ))
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </WorkspaceShell>
  );
}
