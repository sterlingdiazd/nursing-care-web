import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminNurseProfilesPage from "./AdminNurseProfilesPage";
import {
  getActiveNurseProfiles,
  getInactiveNurseProfiles,
  getPendingNurseProfiles,
} from "../api/adminNurseProfiles";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/nurse-profiles", search: "" }),
}));

vi.mock("../api/adminNurseProfiles", () => ({
  getPendingNurseProfiles: vi.fn(),
  getActiveNurseProfiles: vi.fn(),
  getInactiveNurseProfiles: vi.fn(),
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

describe("AdminNurseProfilesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads nurse administration counts and routes pending actions", async () => {
    vi.mocked(getPendingNurseProfiles).mockResolvedValue([
      {
        userId: "pending-1",
        email: "pending1@example.com",
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "00111111111",
        phone: "8095550199",
        hireDate: "2026-03-21",
        specialty: "Atencion domiciliaria",
        createdAtUtc: "2026-03-21T10:00:00Z",
      },
    ]);
    vi.mocked(getActiveNurseProfiles).mockResolvedValue([
      {
        userId: "active-1",
        email: "active1@example.com",
        name: "Mariela",
        lastName: "Santos",
        specialty: "Cuidados intensivos",
        category: "Senior",
        isAssignmentReady: true,
        workload: { totalAssignedCareRequests: 2, pendingAssignedCareRequests: 1, approvedAssignedCareRequests: 1, completedAssignedCareRequests: 0 },
      },
    ]);
    vi.mocked(getInactiveNurseProfiles).mockResolvedValue([
      {
        userId: "inactive-1",
        email: "inactive1@example.com",
        name: "Rosa",
        lastName: "Diaz",
        specialty: "Cuidado geriatrico",
        category: "Lider",
        isAssignmentReady: false,
        workload: { totalAssignedCareRequests: 5, pendingAssignedCareRequests: 0, approvedAssignedCareRequests: 2, completedAssignedCareRequests: 3 },
      },
    ]);

    renderWithTheme(<AdminNurseProfilesPage />);

    expect(await screen.findByText("Laura Gomez")).toBeInTheDocument();
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
    expect(screen.getByText("Activas")).toBeInTheDocument();
    expect(screen.getByText("Inactivas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Completar revision" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/admin/nurse-profiles/pending-1/review", {
        state: { from: "/admin/nurse-profiles" },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear enfermera" }));

    expect(navigate).toHaveBeenCalledWith("/admin/nurse-profiles/new");
  });
});
