import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCareRequestsPage from "./AdminCareRequestsPage";
import {
  exportAdminCareRequestsCsv,
  getAdminCareRequests,
} from "../api/adminCareRequests";

const navigate = vi.fn();
const logout = vi.fn();
let locationSearch = "?view=pending&scheduledFrom=2026-03-20&selected=request-2";

Object.defineProperty(window.URL, "createObjectURL", {
  configurable: true,
  writable: true,
  value: vi.fn(() => "blob:admin-care-requests"),
});

Object.defineProperty(window.URL, "revokeObjectURL", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/care-requests", search: locationSearch }),
}));

vi.mock("../api/adminCareRequests", () => ({
  getAdminCareRequests: vi.fn(),
  exportAdminCareRequestsCsv: vi.fn(),
}));

vi.mock("../hooks/useCareRequestCatalogOptions", () => ({
  useCareRequestCatalogOptions: () => ({
    data: {
      careRequestCategories: [{ code: "hogar", displayName: "Hogar", categoryFactor: 1 }],
      careRequestTypes: [
        { code: "hogar_premium", displayName: "Hogar premium", careRequestCategoryCode: "hogar", unitTypeCode: "mes", basePrice: 65000 },
      ],
      unitTypes: [{ code: "mes", displayName: "Mes" }],
      distanceFactors: [],
      complexityLevels: [],
      volumeDiscountRules: [],
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
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

describe("AdminCareRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationSearch = "?view=pending&scheduledFrom=2026-03-20&selected=request-2";

    vi.mocked(getAdminCareRequests).mockResolvedValue([
      {
        id: "request-1",
        clientUserId: "client-1",
        clientDisplayName: "Carla Jimenez",
        clientEmail: "carla@example.com",
        assignedNurseUserId: null,
        assignedNurseDisplayName: null,
        assignedNurseEmail: null,
        careRequestDescription: "Seguimiento en hogar premium",
        careRequestType: "hogar_premium",
        unit: 1,
        unitType: "mes",
        total: 65000,
        careRequestDate: "2026-03-20",
        status: "Pending",
        createdAtUtc: "2026-03-20T10:00:00Z",
        updatedAtUtc: "2026-03-20T10:00:00Z",
        rejectedAtUtc: null,
        isOverdueOrStale: false,
      },
      {
        id: "request-2",
        clientUserId: "client-2",
        clientDisplayName: "Mario Lopez",
        clientEmail: "mario@example.com",
        assignedNurseUserId: "nurse-1",
        assignedNurseDisplayName: "Luisa Martinez",
        assignedNurseEmail: "luisa@example.com",
        careRequestDescription: "Curas postoperatorias",
        careRequestType: "curas",
        unit: 2,
        unitType: "sesion",
        total: 6000,
        careRequestDate: "2026-03-21",
        status: "Pending",
        createdAtUtc: "2026-03-20T11:00:00Z",
        updatedAtUtc: "2026-03-20T12:00:00Z",
        rejectedAtUtc: null,
        isOverdueOrStale: true,
      },
    ]);
    vi.mocked(exportAdminCareRequestsCsv).mockResolvedValue({
      blob: new Blob(["csv"], { type: "text/csv" }),
      fileName: "solicitudes-admin.csv",
    });
  });

  it("loads the admin list, updates search navigation, exports CSV, and opens detail preserving filters", async () => {
    renderWithTheme(<AdminCareRequestsPage />);

    expect(await screen.findByText("Seguimiento en hogar premium")).toBeInTheDocument();
    expect(getAdminCareRequests).toHaveBeenCalledWith({
      view: "pending",
      sort: "newest",
      search: undefined,
      scheduledFrom: "2026-03-20",
      scheduledTo: undefined,
    });

    fireEvent.change(screen.getByLabelText("Buscar por id, cliente, enfermera, tipo o texto"), {
      target: { value: "critica" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(navigate).toHaveBeenCalledWith("/admin/care-requests?view=pending&search=critica&scheduledFrom=2026-03-20");

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

    await waitFor(() => {
      expect(exportAdminCareRequestsCsv).toHaveBeenCalledWith({
        view: "pending",
        sort: "newest",
        search: undefined,
        scheduledFrom: "2026-03-20",
        scheduledTo: undefined,
      });
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ver detalle" })[0]);

    expect(navigate).toHaveBeenCalledWith("/admin/care-requests/request-1?view=pending&scheduledFrom=2026-03-20&selected=request-1");
  }, 30000);
});
