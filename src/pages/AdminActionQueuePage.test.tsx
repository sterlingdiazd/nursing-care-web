import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminActionQueuePage from "./AdminActionQueuePage";
import { getAdminActionItems } from "../api/adminActionItems";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/action-items", search: "" }),
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

describe("AdminActionQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the queue, filters items, and drills down to detail routes", async () => {
    vi.mocked(getAdminActionItems).mockResolvedValue([
      {
        id: "action-1",
        severity: "High",
        state: "Unread",
        entityType: "CareRequest",
        entityIdentifier: "request-1",
        summary: "Solicitud pendiente de aprobacion inmediata.",
        requiredAction: "Aprobar o rechazar la solicitud.",
        assignedOwner: null,
        deepLinkPath: "/admin/care-requests?view=pending-approval&selected=request-1",
        detectedAtUtc: "2026-03-22T11:00:00Z",
      },
      {
        id: "action-2",
        severity: "Medium",
        state: "Pending",
        entityType: "NurseProfile",
        entityIdentifier: "nurse-1",
        summary: "Perfil de enfermeria pendiente por completar.",
        requiredAction: "Completar el perfil administrativo.",
        assignedOwner: null,
        deepLinkPath: "/admin/nurse-profiles?view=pending&userId=nurse-1",
        detectedAtUtc: "2026-03-20T11:00:00Z",
      },
    ]);

    renderWithTheme(<AdminActionQueuePage />);

    expect(await screen.findByText("Solicitud pendiente de aprobacion inmediata.")).toBeInTheDocument();
    expect(screen.getByText("Perfil de enfermeria pendiente por completar.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtrar por severidad alta" }));

    await waitFor(() => {
      expect(screen.getByText("Solicitud pendiente de aprobacion inmediata.")).toBeInTheDocument();
      expect(screen.queryByText("Perfil de enfermeria pendiente por completar.")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Abrir solicitud request-1" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/admin/care-requests?view=pending-approval&selected=request-1");
    });
  }, 30000);
});
