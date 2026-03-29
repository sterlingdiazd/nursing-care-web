import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminClientDetailPage from "./AdminClientDetailPage";
import {
  getAdminClientDetail,
  updateAdminClient,
  updateAdminClientActiveState,
} from "../api/adminClients";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/clients/client-1", search: "", state: { from: "/admin/clients" } }),
  useParams: () => ({ id: "client-1" }),
}));

vi.mock("../api/adminClients", () => ({
  getAdminClientDetail: vi.fn(),
  updateAdminClient: vi.fn(),
  updateAdminClientActiveState: vi.fn(),
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

describe("AdminClientDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAdminClientDetail).mockResolvedValue({
      userId: "client-1",
      email: "carla@example.com",
      displayName: "Carla Jimenez",
      name: "Carla",
      lastName: "Jimenez",
      identificationNumber: "00122334455",
      phone: "8095550177",
      isActive: true,
      ownedCareRequestsCount: 1,
      lastCareRequestAtUtc: "2026-03-22T10:00:00Z",
      hasHistoricalCareRequests: true,
      canAdminCreateCareRequest: true,
      createdAtUtc: "2026-03-20T09:00:00Z",
      careRequestHistory: [
        {
          careRequestId: "request-1",
          careRequestDescription: "Seguimiento clinico",
          careRequestType: "domicilio_24h",
          status: "Pending",
          total: 3500,
          careRequestDate: "2026-03-25",
          createdAtUtc: "2026-03-22T09:00:00Z",
          updatedAtUtc: "2026-03-22T10:00:00Z",
          assignedNurseDisplayName: null,
          assignedNurseEmail: null,
        },
      ],
    });
    vi.mocked(updateAdminClient).mockResolvedValue({
      userId: "client-1",
      email: "carla.nueva@example.com",
      displayName: "Carla Jimenez",
      name: "Carla",
      lastName: "Jimenez",
      identificationNumber: "00122334455",
      phone: "8095550177",
      isActive: true,
      ownedCareRequestsCount: 1,
      lastCareRequestAtUtc: "2026-03-22T10:00:00Z",
      hasHistoricalCareRequests: true,
      canAdminCreateCareRequest: true,
      createdAtUtc: "2026-03-20T09:00:00Z",
      careRequestHistory: [],
    });
    vi.mocked(updateAdminClientActiveState).mockResolvedValue({
      userId: "client-1",
      email: "carla.nueva@example.com",
      displayName: "Carla Jimenez",
      name: "Carla",
      lastName: "Jimenez",
      identificationNumber: "00122334455",
      phone: "8095550177",
      isActive: false,
      ownedCareRequestsCount: 1,
      lastCareRequestAtUtc: "2026-03-22T10:00:00Z",
      hasHistoricalCareRequests: true,
      canAdminCreateCareRequest: false,
      createdAtUtc: "2026-03-20T09:00:00Z",
      careRequestHistory: [],
    });
  });

  it("loads client detail, saves edits, and handles administrative actions", async () => {
    renderWithTheme(<AdminClientDetailPage />);

    expect(await screen.findByText("Carla Jimenez")).toBeInTheDocument();
    expect(screen.getByText(/tiene historial de solicitudes/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Correo del cliente"), {
      target: { value: "carla.nueva@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(updateAdminClient).toHaveBeenCalledWith("client-1", {
        name: "Carla",
        lastName: "Jimenez",
        identificationNumber: "00122334455",
        phone: "8095550177",
        email: "carla.nueva@example.com",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear solicitud para este cliente" }));
    expect(navigate).toHaveBeenCalledWith("/admin/care-requests/new", {
      state: {
        presetClientUserId: "client-1",
        backPath: "/admin/clients/client-1",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Desactivar cliente" }));

    await waitFor(() => {
      expect(updateAdminClientActiveState).toHaveBeenCalledWith("client-1", false);
    });

    expect(await screen.findByRole("button", { name: "Activar cliente" })).toBeInTheDocument();
  }, 30000);
});
