import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminClientsPage from "./AdminClientsPage";
import { getAdminClients } from "../api/adminClients";

const navigate = vi.fn();
const logout = vi.fn();
let locationSearch = "?search=carla&status=active";

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/clients", search: locationSearch }),
}));

vi.mock("../api/adminClients", () => ({
  getAdminClients: vi.fn(),
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

describe("AdminClientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationSearch = "?search=carla&status=active";

    vi.mocked(getAdminClients).mockResolvedValue([
      {
        userId: "client-1",
        email: "carla@example.com",
        displayName: "Carla Jimenez",
        name: "Carla",
        lastName: "Jimenez",
        identificationNumber: "00122334455",
        phone: "8095550177",
        isActive: true,
        ownedCareRequestsCount: 2,
        lastCareRequestAtUtc: "2026-03-22T11:00:00Z",
        createdAtUtc: "2026-03-20T09:00:00Z",
      },
    ]);
  });

  it("loads the client module, preserves filters, and opens detail routes", async () => {
    renderWithTheme(<AdminClientsPage />);

    expect(await screen.findByText("Carla Jimenez")).toBeInTheDocument();
    expect(getAdminClients).toHaveBeenCalledWith({
      search: "carla",
      status: "active",
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cliente" }));
    expect(navigate).toHaveBeenCalledWith("/admin/clients/new");

    fireEvent.change(screen.getByLabelText("Buscar por correo, nombre, cedula o telefono"), {
      target: { value: "ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(navigate).toHaveBeenCalledWith("/admin/clients?search=ana&status=active");

    fireEvent.click(screen.getByRole("button", { name: "Ver cliente" }));

    expect(navigate).toHaveBeenCalledWith("/admin/clients/client-1?search=carla&status=active", {
      state: { from: "/admin/clients?search=carla&status=active" },
    });
  }, 10000);
});
