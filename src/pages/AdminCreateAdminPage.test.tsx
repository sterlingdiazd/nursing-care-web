import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCreateAdminPage from "./AdminCreateAdminPage";
import { createAdminAccount } from "../api/adminUsers";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/users/create-admin", search: "" }),
}));

vi.mock("../api/adminUsers", () => ({
  createAdminAccount: vi.fn(),
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

describe("AdminCreateAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createAdminAccount).mockResolvedValue({
      id: "admin-2",
      email: "nueva-admin@nursingcare.local",
      displayName: "Mariela Rojas",
      name: "Mariela",
      lastName: "Rojas",
      identificationNumber: "00111222333",
      phone: "8095550199",
      profileType: "Client",
      roleNames: ["Admin"],
      allowedRoleNames: ["Admin", "Client"],
      isActive: true,
      accountStatus: "Active",
      requiresProfileCompletion: false,
      requiresAdminReview: false,
      requiresManualIntervention: false,
      hasOperationalHistory: false,
      activeRefreshTokenCount: 0,
      createdAtUtc: "2026-03-22T14:00:00Z",
      nurseProfile: null,
      clientProfile: {
        ownedCareRequestsCount: 0,
      },
    });
  });

  it("creates an admin account and exposes the created-account actions", async () => {
    renderWithTheme(<AdminCreateAdminPage />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Mariela" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Rojas" },
    });
    fireEvent.change(screen.getByLabelText("Cedula"), {
      target: { value: "00111222333" },
    });
    fireEvent.change(screen.getByLabelText("Telefono"), {
      target: { value: "8095550199" },
    });
    fireEvent.change(screen.getByLabelText("Correo institucional"), {
      target: { value: "nueva-admin@nursingcare.local" },
    });
    fireEvent.change(screen.getByLabelText("Contrasena inicial"), {
      target: { value: "Pass123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contrasena"), {
      target: { value: "Pass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta administrativa" }));

    await waitFor(() => {
      expect(createAdminAccount).toHaveBeenCalledWith({
        name: "Mariela",
        lastName: "Rojas",
        identificationNumber: "00111222333",
        phone: "8095550199",
        email: "nueva-admin@nursingcare.local",
        password: "Pass123!",
        confirmPassword: "Pass123!",
      });
    });

    expect(await screen.findByText("Cuenta creada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver cuenta creada" }));

    expect(navigate).toHaveBeenCalledWith("/admin/users/admin-2");
  });
});
