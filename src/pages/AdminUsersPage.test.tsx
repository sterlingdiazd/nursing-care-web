import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUsersPage from "./AdminUsersPage";
import { getAdminUsers } from "../api/adminUsers";

const navigate = vi.fn();
const logout = vi.fn();
let locationSearch = "?search=mario&role=CLIENT&profileType=CLIENT&status=Active";

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

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationSearch = "?search=mario&role=CLIENT&profileType=CLIENT&status=Active";

    vi.mocked(getAdminUsers).mockResolvedValue([
      {
        id: "user-1",
        email: "mario@example.com",
        displayName: "Mario Lopez",
        name: "Mario",
        lastName: "Lopez",
        identificationNumber: "00122334455",
        phone: "8095550177",
        profileType: "CLIENT",
        roleNames: ["CLIENT"],
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

    // Wait for initial load
    expect(await screen.findByText("Mario Lopez")).toBeInTheDocument();
    
    // Verify initial API call
    expect(getAdminUsers).toHaveBeenCalled();

    // Click "Ver cuenta" - use find to be safe
    const viewButton = await screen.findByText("Ver cuenta");
    fireEvent.click(viewButton);

    // Should navigate to detail
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/admin/users/user-1"));

    // Change search and click "Buscar"
    const searchInput = screen.getByLabelText("Buscar por correo, nombre, cedula o telefono");
    fireEvent.change(searchInput, { target: { value: "sandra" } });
    
    // Use find for the search button
    const searchButton = await screen.findByRole("button", { name: "Buscar" });
    fireEvent.click(searchButton);

    // Should navigate with new search
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("search=sandra"));
  });
});
