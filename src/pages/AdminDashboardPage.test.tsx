import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi, describe, it, expect, beforeEach } from "vitest";

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
    email: "admin@example.com",
    roles: ["ADMIN"],
    logout,
  }),
}));

// Mock AdminPortalShell to isolate the dashboard content
vi.mock("../components/layout/AdminPortalShell", () => ({
    default: ({ children, actions }: any) => (
      <div data-testid="admin-shell">
        <div data-testid="shell-actions">{actions}</div>
        {children}
      </div>
    )
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

    // Wait for content (Corrected Spanish labels from translation.json)
    expect(await screen.findByText("Perfiles pendientes de enfermería")).toBeInTheDocument();
    expect(screen.getByText("Solicitudes esperando asignación")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    
    // Alertas y Acciones labels - match translation.json exactly
    expect(screen.getByText("Alertas de alta severidad")).toBeInTheDocument();
    expect(screen.getByText("Acciones que requieren atención")).toBeInTheDocument();
    expect(screen.getByText("La solicitud requiere aprobacion administrativa inmediata.")).toBeInTheDocument();

    // Interaction with metric card / link - the dashboard renders a button with an aria-label
    fireEvent.click(screen.getByRole("button", { name: /Abrir Solicitudes esperando asignación/i }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/admin/care-requests?view=unassigned");
    });

    // Interaction with queue link
    fireEvent.click(screen.getByRole("button", { name: "Abrir cola de acciones" }));
    expect(navigate).toHaveBeenCalledWith("/admin/action-items");
  });
});
