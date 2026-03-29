import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCareRequestsPage from "./AdminCareRequestsPage";
import { getAdminCareRequests, exportAdminCareRequestsCsv, type AdminCareRequestListItem } from "../api/adminCareRequests";
import { useCareRequestCatalogOptions } from "../hooks/useCareRequestCatalogOptions";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/care-requests", search: "" }),
}));

vi.mock("../api/adminCareRequests", () => ({
  getAdminCareRequests: vi.fn(),
  exportAdminCareRequestsCsv: vi.fn(),
}));

vi.mock("../hooks/useCareRequestCatalogOptions", () => ({
  useCareRequestCatalogOptions: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    email: "admin@example.com",
    roles: ["ADMIN"],
    logout,
  }),
}));

// Mock AdminPortalShell to isolate page content
vi.mock("../components/layout/AdminPortalShell", () => ({
    default: ({ children, actions }: any) => (
      <div data-testid="admin-shell">
        <div data-testid="shell-actions">{actions}</div>
        {children}
      </div>
    )
}));

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("AdminCareRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCareRequestCatalogOptions).mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        careRequestTypes: [{ code: "T1", displayName: "Type 1", basePrice: 100, careRequestCategoryCode: "C1" }],
        unitTypes: [{ code: "U1", displayName: "Unit 1" }],
        careRequestCategories: [{ code: "C1", displayName: "Category 1", categoryFactor: 1 }],
        distanceFactors: [{ code: "local", displayName: "Local", multiplier: 1 }],
        complexityLevels: [{ code: "estandar", displayName: "Standard", multiplier: 1 }],
        volumeDiscountRules: [],
      },
      refetch: vi.fn(),
    } as any);

    vi.mocked(getAdminCareRequests).mockResolvedValue([
      {
        id: "request-1",
        clientUserId: "client-1",
        clientDisplayName: "Juan Perez",
        clientEmail: "juan@example.com",
        assignedNurseUserId: null,
        assignedNurseDisplayName: null,
        assignedNurseEmail: null,
        careRequestDescription: "Test Request",
        careRequestType: "T1",
        unit: 1,
        unitType: "U1",
        total: 1500,
        careRequestDate: "2026-03-25T10:00:00Z",
        status: "Pending",
        createdAtUtc: "2026-03-22T09:00:00Z",
        updatedAtUtc: "2026-03-22T09:00:00Z",
        rejectedAtUtc: null,
        isOverdueOrStale: false,
      } as AdminCareRequestListItem,
    ]);
  });

  it("loads the admin list and performs basic actions", async () => {
    renderWithTheme(<AdminCareRequestsPage />);

    // Wait for content (Spanish label)
    expect(await screen.findByText(/Juan Perez/)).toBeInTheDocument();
    
    // Check "Crear solicitud" navigation - in shell-actions
    fireEvent.click(screen.getByText(/Crear solicitud/i));
    expect(navigate).toHaveBeenCalledWith("/admin/care-requests/new");

    // Detail navigation on item button click
    const viewButton = await screen.findByRole("button", { name: "Ver detalle" });
    fireEvent.click(viewButton);
    await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/admin/care-requests/request-1"));
    }, { timeout: 3000 });

    // Export interaction
    const exportButton = await screen.findByRole("button", { name: "Exportar CSV" });
    
    // Wait for the button to be enabled (async state updates after data load)
    await waitFor(() => expect(exportButton).not.toBeDisabled(), { timeout: 3000 });
    
    fireEvent.click(exportButton);
    
    await waitFor(() => {
        expect(exportAdminCareRequestsCsv).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
