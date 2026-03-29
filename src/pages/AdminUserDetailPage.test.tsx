import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUserDetailPage from "./AdminUserDetailPage";
import {
  getAdminUserDetail,
  invalidateAdminUserSessions,
  updateAdminUser,
  updateAdminUserActiveState,
  updateAdminUserRoles,
} from "../api/adminUsers";

const navigate = vi.fn();
const logout = vi.fn();

const baseDetail = {
  id: "user-1",
  email: "mario@example.com",
  displayName: "Mario Lopez",
  name: "Mario",
  lastName: "Lopez",
  identificationNumber: "00122334455",
  phone: "8095550177",
  profileType: "CLIENT" as const,
  roleNames: ["CLIENT"] as const,
  allowedRoleNames: ["ADMIN", "CLIENT"] as const,
  isActive: true,
  accountStatus: "Active" as const,
  requiresProfileCompletion: false,
  requiresAdminReview: false,
  requiresManualIntervention: false,
  hasOperationalHistory: true,
  activeRefreshTokenCount: 1,
  createdAtUtc: "2026-03-22T11:00:00Z",
  nurseProfile: null,
  clientProfile: {
    ownedCareRequestsCount: 4,
  },
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/users/user-1", search: "?role=CLIENT" }),
  useParams: () => ({ id: "user-1" }),
}));

vi.mock("../api/adminUsers", () => ({
  getAdminUserDetail: vi.fn(),
  updateAdminUser: vi.fn(),
  updateAdminUserRoles: vi.fn(),
  updateAdminUserActiveState: vi.fn(),
  invalidateAdminUserSessions: vi.fn(),
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

describe("AdminUserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAdminUserDetail).mockResolvedValue(baseDetail);
    vi.mocked(updateAdminUser).mockResolvedValue({
      ...baseDetail,
      name: "Mariela",
      lastName: "Santos",
      displayName: "Mariela Santos",
      phone: "8095550444",
    });
    vi.mocked(updateAdminUserRoles).mockResolvedValue({
      ...baseDetail,
      roleNames: ["ADMIN", "CLIENT"],
    });
    vi.mocked(updateAdminUserActiveState).mockResolvedValue({
      ...baseDetail,
      isActive: false,
      accountStatus: "Inactive",
      activeRefreshTokenCount: 0,
    });
    vi.mocked(invalidateAdminUserSessions).mockResolvedValue({
      userId: "user-1",
      revokedActiveSessionCount: 1,
    });
  });

  it("loads the detail view and runs identity, role, access, and session actions", async () => {
    renderWithTheme(<AdminUserDetailPage />);

    expect(await screen.findByText("Mario Lopez")).toBeInTheDocument();
    expect(getAdminUserDetail).toHaveBeenCalledWith("user-1");

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Mariela" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Santos" },
    });
    fireEvent.change(screen.getByLabelText("Telefono"), {
      target: { value: "8095550444" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar informacion" }));

    await waitFor(() => {
      expect(updateAdminUser).toHaveBeenCalledWith("user-1", expect.objectContaining({
        name: "Mariela",
        lastName: "Santos",
        phone: "8095550444",
      }));
    });
    await screen.findByText("La informacion de la cuenta se actualizo correctamente.");

    fireEvent.click(screen.getByLabelText("Administración"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar roles" }));

    await waitFor(() => {
      expect(updateAdminUserRoles).toHaveBeenCalledWith("user-1", ["ADMIN", "CLIENT"]);
    });
    await screen.findByText("Los roles permitidos se actualizaron correctamente.");

    fireEvent.click(screen.getByRole("button", { name: "Desactivar cuenta" }));

    await waitFor(() => {
      expect(updateAdminUserActiveState).toHaveBeenCalledWith("user-1", false);
    });
    await screen.findByText("La cuenta se desactivo y se cerraron las sesiones activas.");

    fireEvent.click(screen.getByRole("button", { name: "Invalidar sesiones activas" }));

    await waitFor(() => {
      expect(invalidateAdminUserSessions).toHaveBeenCalledWith("user-1");
    });
    await screen.findByText("Se invalidaron 1 sesiones activas.");

    fireEvent.click(screen.getByRole("button", { name: "Volver al listado" }));
    expect(navigate).toHaveBeenCalledWith("/admin/users?role=CLIENT");
  }, 20000);
});
