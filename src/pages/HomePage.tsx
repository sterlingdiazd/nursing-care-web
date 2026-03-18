import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

import WorkspaceShell from "../components/layout/WorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { logClientEvent } from "../logging/clientLogger";
import { UserProfileType } from "../types/auth";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, email, roles, profileType } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const canCreateRequest = roles.includes("Nurse") || roles.includes("Admin");
  const profileLabel =
    profileType === UserProfileType.Nurse ? "Nurse profile" : "Client profile";

  const openBoard = () => {
    logClientEvent("web.ui", "Home quick action opened care request board", {
      roles,
      profileType,
    });
    navigate("/care-requests");
  };

  return (
    <WorkspaceShell
      eyebrow="Operations Overview"
      title="A cleaner workspace for care intake and coordination."
      description="The web experience now centers around a structured operations console: overview, live request board, intake, and detailed review with role-based transitions."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/care-request")}>
            Open Intake
          </Button>
          <Button variant="contained" onClick={openBoard}>
            Open Request Board
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.3fr 0.9fr" },
          gap: 3,
        }}
      >
        <Stack spacing={3}>
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background:
                "linear-gradient(145deg, rgba(24,59,84,0.98) 0%, rgba(33,88,124,0.96) 58%, rgba(53,122,116,0.92) 100%)",
              color: "#f8fafc",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -40,
                top: -30,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <Stack spacing={2.5} sx={{ position: "relative" }}>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "#bde0dd" }}>
                Daily Command View
              </Typography>
              <Typography variant="h3" sx={{ color: "#fffef8", maxWidth: 640 }}>
                {canCreateRequest
                  ? "Move requests from intake to action without losing the operational thread."
                  : "Review the current request flow with a professional, role-aware view."}
              </Typography>
              <Typography sx={{ maxWidth: 620, color: "rgba(235,244,247,0.8)", lineHeight: 1.8 }}>
                Use the board to review status, then open individual requests for lifecycle
                transitions, timestamps, and detail context. Intake remains available when you need
                to add new work.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Chip
                  label={profileLabel}
                  sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fffef8", borderRadius: 2 }}
                />
                <Chip
                  label={roles.join(", ") || "User"}
                  sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#d8ecec", borderRadius: 2 }}
                />
                <Chip
                  label={email ?? "No email loaded"}
                  sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#d8ecec", borderRadius: 2 }}
                />
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {[
              {
                title: "Structured navigation",
                body: "Overview, queue, and intake now sit inside one consistent shell with stable context.",
              },
              {
                title: "Role-led workflow",
                body: "Admins can approve or reject pending requests, while nurses and admins can complete approved work.",
              },
              {
                title: "Session resilience",
                body: "Stored sessions restore automatically and refresh flows keep the workspace usable during longer reviews.",
              },
            ].map((item) => (
              <Paper key={item.title} sx={{ p: 3, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 1.2 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {item.body}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Stack>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
              Readiness
            </Typography>
            <Typography variant="h5" sx={{ mt: 1.1, mb: 2 }}>
              Current workspace health
            </Typography>
            <Stack spacing={1.25}>
              <Alert severity="success" variant="outlined">
                Auth state restores from local storage
              </Alert>
              <Alert severity="success" variant="outlined">
                Protected requests send Bearer tokens automatically
              </Alert>
              <Alert severity="info" variant="outlined">
                Queue and detail screens reflect lifecycle transitions directly
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2.5, bgcolor: "#f3ede0" }}>
            <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
              Recommended Flow
            </Typography>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {[
                "Open the request board to review the live queue.",
                "Use intake when a nurse or admin needs to create a new request.",
                "Open a request detail page to approve, reject, or complete it based on role.",
              ].map((step) => (
                <Box key={step} sx={{ display: "flex", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#b7803c",
                      mt: 0.9,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ color: "#6f5a3b", lineHeight: 1.7 }}>{step}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </WorkspaceShell>
  );
}
