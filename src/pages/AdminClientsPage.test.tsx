import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("loads the client module properly and handles interactions", async () => {
    renderWithTheme(<AdminClientsPage />);

    // Wait for initial content
    expect(await screen.findByText("Carla Jimenez")).toBeInTheDocument();
    
    // Check "Crear cliente" - in shell-actions
    fireEvent.click(screen.getByText("Crear cliente"));
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/admin/clients/new"));

    // Detail navigation click
    const viewButton = await screen.findByRole("button", { name: "Ver cliente" });
    fireEvent.click(viewButton);
    await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/admin/clients/client-1"), expect.anything());
    });

    // Search interaction
    const searchInput = screen.getByLabelText(/Buscar por correo/i);
    fireEvent.change(searchInput, { target: { value: "ana" } });
    
    const searchButton = screen.getByRole("button", { name: "Buscar" });
    fireEvent.click(searchButton);

    await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith(expect.stringContaining("search=ana"));
    });
  });
});
