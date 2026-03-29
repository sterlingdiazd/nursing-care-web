import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminDashboardPage from "./AdminDashboardPage";
import { getAdminActionItems } from "../api/adminActionItems";
import { getAdminDashboard } from "../api/adminDashboard";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin", search: "" }),
}));

vi.mock("../api/adminDashboard", () => ({
  getAdminDashboard: vi.fn(),
}));

vi.mock("../api/adminActionItems", () => ({
  getAdminActionItems: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "token",
    userId: "11111111-1111-1111-1111-111111111111",
    email: "admin@example.com",
    roles: ["ADMIN"],
    profileType: "ADMIN",
    requiresProfileCompletion: false,
    requiresAdminReview: false,
    isLoading: false,
    error: null,
    logout,
    register: vi.fn(),
    login: vi.fn(),
    clearError: vi.fn(),
  }),
}));

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard widgets and routes drill-down actions", async () => {
    vi.mocked(getAdminDashboard).mockResolvedValue({
      pendingNurseProfilesCount: 3,
      careRequestsWaitingForAssignmentCount: 5,
      careRequestsWaitingForApprovalCount: 4,
      careRequestsRejectedTodayCount: 1,
      approvedCareRequestsStillIncompleteCount: 6,
      overdueOrStaleRequestsCount: 2,
      activeNursesCount: 8,
      activeClientsCount: 21,
      unreadAdminNotificationsCount: 0,
      highSeverityAlerts: [],
      generatedAtUtc: "2026-03-22T12:30:00Z",
    });
    vi.mocked(getAdminActionItems).mockResolvedValue([
      {
        id: "action-1",
        severity: "High",
        state: "Unread",
        entityType: "CareRequest",
        entityIdentifier: "request-1",
        summary: "La solicitud requiere aprobacion administrativa inmediata.",
        requiredAction: "Revisar y aprobar la solicitud.",
        assignedOwner: null,
        deepLinkPath: "/admin/care-requests?view=pending-approval&selected=request-1",
        detectedAtUtc: "2026-03-22T11:00:00Z",
      },
    ]);

    renderWithTheme(<AdminDashboardPage />);

    expect(await screen.findByText("dashboard.widgets.pendingNurses.label")).toBeInTheDocument();
    expect(screen.getByText("dashboard.widgets.waitingAssignment.label")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("dashboard.criticalAlertsDesc")).toBeInTheDocument();
    expect(screen.getByText("dashboard.actionQueueTitle")).toBeInTheDocument();
    expect(screen.getByText("La solicitud requiere aprobacion administrativa inmediata.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir dashboard.widgets.waitingAssignment.label" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/admin/care-requests?view=unassigned");
    });

    fireEvent.click(screen.getByRole("button", { name: "dashboard.openQueue" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/admin/action-items");
    });
  }, 30000);
});
