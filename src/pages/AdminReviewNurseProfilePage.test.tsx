import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminReviewNurseProfilePage from "./AdminReviewNurseProfilePage";
import {
  completeNurseProfileForAdmin,
  getNurseProfileForAdmin,
} from "../api/adminNurseProfiles";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/nurse-profiles/nurse-1/review", search: "", state: { from: "/admin/nurse-profiles" } }),
  useParams: () => ({ id: "nurse-1" }),
}));

vi.mock("../api/adminNurseProfiles", () => ({
  getNurseProfileForAdmin: vi.fn(),
  completeNurseProfileForAdmin: vi.fn(),
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

describe("AdminReviewNurseProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the review completion flow", async () => {
    vi.mocked(getNurseProfileForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "laura@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "00111111111",
      phone: "8095550199",
      profileType: 1,
      userIsActive: true,
      nurseProfileIsActive: false,
      isPendingReview: true,
      isAssignmentReady: false,
      hasHistoricalCareRequests: false,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Cuidados intensivos",
      licenseId: "55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
      workload: { totalAssignedCareRequests: 0 },
    });
    vi.mocked(completeNurseProfileForAdmin).mockResolvedValue({
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
      hasHistoricalCareRequests: false,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Cuidados intensivos",
      licenseId: "55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
      workload: { totalAssignedCareRequests: 0 },
    });

    renderWithTheme(<AdminReviewNurseProfilePage />);

    expect(await screen.findByRole("button", { name: "Completar perfil y activar acceso" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Completar perfil y activar acceso" }));

    await waitFor(() => {
      expect(completeNurseProfileForAdmin).toHaveBeenCalledWith("nurse-1", {
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "00111111111",
        phone: "8095550199",
        email: "laura@example.com",
        hireDate: "2026-03-21",
        specialty: "Cuidados intensivos",
        licenseId: "55",
        bankName: "Banco Central",
        accountNumber: "123456",
        category: "Senior",
      });
    });

    expect(navigate).toHaveBeenCalledWith("/admin/nurse-profiles/nurse-1", {
      state: {
        from: "/admin/nurse-profiles",
        successMessage: "La revision se completo y la enfermera quedo habilitada.",
      },
    });
  });
});
