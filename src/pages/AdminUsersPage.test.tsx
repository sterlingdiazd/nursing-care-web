import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUsersPage from "./AdminUsersPage";
import { getAdminUsers } from "../api/adminUsers";

const navigate = vi.fn();
const logout = vi.fn();
let locationSearch = "?search=mario&role=Client&profileType=Client&status=Active";

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/users", search: locationSearch }),
}));

vi.mock("../api/adminUsers", () => ({
  getAdminUsers: vi.fn(),
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

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationSearch = "?search=mario&role=Client&profileType=Client&status=Active";

    vi.mocked(getAdminUsers).mockResolvedValue([
      {
        id: "user-1",
        email: "mario@example.com",
        displayName: "Mario Lopez",
        name: "Mario",
        lastName: "Lopez",
        identificationNumber: "00122334455",
        phone: "8095550177",
        profileType: "Client",
        roleNames: ["Client"],
        isActive: true,
        accountStatus: "Active",
        requiresProfileCompletion: false,
        requiresAdminReview: false,
        requiresManualIntervention: false,
        createdAtUtc: "2026-03-22T11:00:00Z",
      },
    ]);
  });

  it("loads the admin users list, preserves filters, and opens account detail", async () => {
    renderWithTheme(<AdminUsersPage />);

    expect(await screen.findByText("Mario Lopez")).toBeInTheDocument();
    expect(getAdminUsers).toHaveBeenCalledWith({
      search: "mario",
      role: "Client",
      profileType: "Client",
      status: "Active",
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear administrador" }));

    expect(navigate).toHaveBeenCalledWith("/admin/users/create-admin");

    fireEvent.change(screen.getByLabelText("Buscar por correo, nombre, cedula o telefono"), {
      target: { value: "sandra" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(navigate).toHaveBeenCalledWith("/admin/users?search=sandra&role=Client&profileType=Client&status=Active");

    fireEvent.click(screen.getByRole("button", { name: "Ver cuenta" }));

    expect(navigate).toHaveBeenCalledWith("/admin/users/user-1?search=mario&role=Client&profileType=Client&status=Active");
  });
});
