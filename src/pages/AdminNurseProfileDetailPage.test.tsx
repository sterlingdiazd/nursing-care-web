import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminNurseProfileDetailPage from "./AdminNurseProfileDetailPage";
import {
  getNurseProfileForAdmin,
  setNurseOperationalAccessForAdmin,
} from "../api/adminNurseProfiles";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/nurse-profiles/nurse-1", search: "", state: { from: "/admin/nurse-profiles" } }),
  useParams: () => ({ id: "nurse-1" }),
}));

vi.mock("../api/adminNurseProfiles", () => ({
  getNurseProfileForAdmin: vi.fn(),
  setNurseOperationalAccessForAdmin: vi.fn(),
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

describe("AdminNurseProfileDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a nurse detail and toggles operational access", async () => {
    vi.mocked(getNurseProfileForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "laura@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "00111111111",
      phone: "8095550199",
      profileType: 1,
      userIsActive: true,
      nurseProfileIsActive: true,
      isPendingReview: false,
      isAssignmentReady: true,
      hasHistoricalCareRequests: true,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Cuidados intensivos",
      licenseId: "55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
      workload: {
        totalAssignedCareRequests: 3,
        pendingAssignedCareRequests: 1,
        approvedAssignedCareRequests: 1,
        completedAssignedCareRequests: 1,
        lastCareRequestAtUtc: "2026-03-22T10:00:00Z",
      },
    });
    vi.mocked(setNurseOperationalAccessForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "laura@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "00111111111",
      phone: "8095550199",
      profileType: 1,
      userIsActive: false,
      nurseProfileIsActive: false,
      isPendingReview: false,
      isAssignmentReady: false,
      hasHistoricalCareRequests: true,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Cuidados intensivos",
      licenseId: "55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
      workload: {
        totalAssignedCareRequests: 3,
        pendingAssignedCareRequests: 1,
        approvedAssignedCareRequests: 1,
        completedAssignedCareRequests: 1,
        lastCareRequestAtUtc: "2026-03-22T10:00:00Z",
      },
    });

    renderWithTheme(<AdminNurseProfileDetailPage />);

    expect(await screen.findByText("Laura Gomez")).toBeInTheDocument();
    expect(screen.getByText(/tiene historial de solicitudes/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Desactivar acceso operativo" }));

    await waitFor(() => {
      expect(setNurseOperationalAccessForAdmin).toHaveBeenCalledWith("nurse-1", false);
    });

    expect(await screen.findByRole("button", { name: "Activar acceso operativo" })).toBeInTheDocument();
  });
});
