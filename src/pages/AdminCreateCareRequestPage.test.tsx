import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCreateCareRequestPage from "./AdminCreateCareRequestPage";
import {
  createAdminCareRequest,
  getAdminCareRequestClients,
} from "../api/adminCareRequests";

const navigate = vi.fn();
const logout = vi.fn();
let routeSearch = "?view=pending";

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/care-requests/new", search: routeSearch }),
}));

vi.mock("../api/adminCareRequests", () => ({
  getAdminCareRequestClients: vi.fn(),
  createAdminCareRequest: vi.fn(),
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

describe("AdminCreateCareRequestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeSearch = "?view=pending";
    vi.mocked(getAdminCareRequestClients).mockResolvedValue([
      {
        userId: "client-1",
        displayName: "Carla Jimenez",
        email: "carla@example.com",
        identificationNumber: "00122334455",
      },
    ]);
    vi.mocked(createAdminCareRequest).mockResolvedValue({
      id: "request-new",
    });
  });

  it("loads clients, submits an admin-created care request, and preserves list context", async () => {
    renderWithTheme(<AdminCreateCareRequestPage />);

    await waitFor(() => {
      expect(getAdminCareRequestClients).toHaveBeenCalled();
      expect(screen.getByLabelText("Cliente")).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Cliente"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText("Descripcion de la solicitud"), {
      target: { value: "Crear solicitud administrativa de seguimiento" },
    });
    fireEvent.change(screen.getByLabelText("Fecha del servicio (opcional)"), {
      target: { value: "2026-03-25" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear solicitud administrativa" }));

    await waitFor(() => {
      expect(createAdminCareRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          clientUserId: "client-1",
          careRequestDescription: "Crear solicitud administrativa de seguimiento",
          careRequestType: "domicilio_24h",
          unit: 1,
          careRequestDate: "2026-03-25",
          distanceFactor: "local",
          complexityLevel: "estandar",
        }),
      );
    });

    expect(navigate).toHaveBeenCalledWith("/admin/care-requests/request-new?view=pending");
  }, 10000);
});
