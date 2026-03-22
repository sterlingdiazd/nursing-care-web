import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCreateClientPage from "./AdminCreateClientPage";
import { createAdminClient } from "../api/adminClients";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/clients/new", search: "" }),
}));

vi.mock("../api/adminClients", () => ({
  createAdminClient: vi.fn(),
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

describe("AdminCreateClientPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAdminClient).mockResolvedValue({
      userId: "client-1",
      email: "carla@example.com",
      displayName: "Carla Jimenez",
      name: "Carla",
      lastName: "Jimenez",
      identificationNumber: "00122334455",
      phone: "8095550177",
      isActive: true,
      ownedCareRequestsCount: 0,
      lastCareRequestAtUtc: null,
      hasHistoricalCareRequests: false,
      canAdminCreateCareRequest: true,
      createdAtUtc: "2026-03-22T14:00:00Z",
      careRequestHistory: [],
    });
  });

  it("submits the manual client creation flow", async () => {
    renderWithTheme(<AdminCreateClientPage />);

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Carla" } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Jimenez" } });
    fireEvent.change(screen.getByLabelText("Cedula"), { target: { value: "00122334455" } });
    fireEvent.change(screen.getByLabelText("Telefono"), { target: { value: "8095550177" } });
    fireEvent.change(screen.getByLabelText("Correo del cliente"), { target: { value: "carla@example.com" } });
    fireEvent.change(screen.getByLabelText("Contrasena inicial"), { target: { value: "Pass123!" } });
    fireEvent.change(screen.getByLabelText("Confirmar contrasena"), { target: { value: "Pass123!" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => {
      expect(createAdminClient).toHaveBeenCalledWith({
        name: "Carla",
        lastName: "Jimenez",
        identificationNumber: "00122334455",
        phone: "8095550177",
        email: "carla@example.com",
        password: "Pass123!",
        confirmPassword: "Pass123!",
      });
    });

    expect(navigate).toHaveBeenCalledWith("/admin/clients/client-1", {
      state: {
        from: "/admin/clients",
        successMessage: "El cliente se creo correctamente y ya esta listo para gestion administrativa.",
      },
    });
  }, 10000);
});
