import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminNurseProfilesPage from "./AdminNurseProfilesPage";
import {
  completeNurseProfileForAdmin,
  getNurseProfileForAdmin,
  getPendingNurseProfiles,
} from "../api/adminNurseProfiles";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/nurse-profiles" }),
}));

vi.mock("../api/adminNurseProfiles", () => ({
  getPendingNurseProfiles: vi.fn(),
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

describe("Admin nurse profiles page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads pending nurse profiles and renders the selected detail form", async () => {
    vi.mocked(getPendingNurseProfiles).mockResolvedValue([
      {
        userId: "nurse-1",
        email: "nurse1@example.com",
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "001-1111111-1",
        phone: "8095550199",
        createdAtUtc: "2026-03-21T10:00:00Z",
      },
    ]);

    vi.mocked(getNurseProfileForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "nurse1@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "001-1111111-1",
      phone: "8095550199",
      profileType: 1,
      userIsActive: true,
      nurseProfileIsActive: false,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Home Care",
      licenseId: "LIC-55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
    });

    renderWithTheme(<AdminNurseProfilesPage />);

    expect(await screen.findByText("Laura Gomez")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("nurse1@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Banco Central")).toBeInTheDocument();
  });

  it("submits the admin completion form", async () => {
    vi.mocked(getPendingNurseProfiles).mockResolvedValue([
      {
        userId: "nurse-1",
        email: "nurse1@example.com",
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "001-1111111-1",
        phone: "8095550199",
        createdAtUtc: "2026-03-21T10:00:00Z",
      },
    ]);

    vi.mocked(getNurseProfileForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "nurse1@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "001-1111111-1",
      phone: "8095550199",
      profileType: 1,
      userIsActive: true,
      nurseProfileIsActive: false,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Home Care",
      licenseId: "LIC-55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
    });

    vi.mocked(completeNurseProfileForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "nurse1@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "001-1111111-1",
      phone: "8095550199",
      profileType: 1,
      userIsActive: true,
      nurseProfileIsActive: true,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Home Care",
      licenseId: "LIC-55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
    });

    renderWithTheme(<AdminNurseProfilesPage />);

    expect(await screen.findByDisplayValue("Laura")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Completar perfil de enfermeria" }));

    await waitFor(() => {
      expect(completeNurseProfileForAdmin).toHaveBeenCalledWith("nurse-1", {
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "001-1111111-1",
        phone: "8095550199",
        email: "nurse1@example.com",
        hireDate: "2026-03-21",
        specialty: "Home Care",
        licenseId: "LIC-55",
        bankName: "Banco Central",
        accountNumber: "123456",
        category: "Senior",
      });
    });
  });
});
