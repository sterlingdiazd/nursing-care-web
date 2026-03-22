import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminDashboardPage from "./AdminDashboardPage";
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

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "token",
    userId: "11111111-1111-1111-1111-111111111111",
    email: "admin@example.com",
    roles: ["Admin"],
    profileType: 0,
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

    renderWithTheme(<AdminDashboardPage />);

    expect(await screen.findByText("Perfiles pendientes de enfermeria")).toBeInTheDocument();
    expect(screen.getByText("Solicitudes esperando asignacion")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("Area preparada para incidentes criticos del negocio")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir Solicitudes esperando asignacion" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/admin/care-requests?view=unassigned");
    });
  });
});
