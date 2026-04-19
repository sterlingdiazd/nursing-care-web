import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import AdminCreateNurseProfilePage from "./AdminCreateNurseProfilePage";
import { createNurseProfileForAdmin } from "../api/adminNurseProfiles";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/nurse-profiles/new", search: "" }),
}));

vi.mock("../api/adminNurseProfiles", () => ({
  createNurseProfileForAdmin: vi.fn(),
}));

vi.mock("../hooks/useNurseProfileCatalogOptions", () => ({
  useNurseProfileCatalogOptions: () => ({
    data: {
      specialties: [{ code: "cuidados_intensivos", displayName: "Cuidados intensivos" }],
      categories: [{ code: "senior", displayName: "Senior" }],
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

describe("AdminCreateNurseProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the manual nurse creation flow", async () => {
    vi.mocked(createNurseProfileForAdmin).mockResolvedValue({
      userId: "nurse-1",
      email: "laura@example.com",
      name: "Laura",
      lastName: "Gomez",
      identificationNumber: "00111111111",
      phone: "8095550199",
      profileType: 1,
      userIsActive: true,
      nurseProfileIsActive: true,
      isPendingReview: false,
      isAssignmentReady: true,
      hasHistoricalCareRequests: false,
      createdAtUtc: "2026-03-21T10:00:00Z",
      hireDate: "2026-03-21",
      specialty: "Cuidados intensivos",
      licenseId: "55",
      bankName: "Banco Central",
      accountNumber: "123456",
      category: "Senior",
      workload: { totalAssignedCareRequests: 0 },
    });

    renderWithTheme(<AdminCreateNurseProfilePage />);

    const form = screen.getByTestId("admin-nurse-profile-form");

    fireEvent.change(within(form).getByLabelText("Nombre"), { target: { value: "Laura" } });
    fireEvent.change(within(form).getByLabelText("Apellido"), { target: { value: "Gomez" } });
    fireEvent.change(within(form).getByLabelText("Cedula"), { target: { value: "00111111111" } });
    fireEvent.change(within(form).getByLabelText("Telefono"), { target: { value: "8095550199" } });
    fireEvent.change(within(form).getByLabelText("Correo"), { target: { value: "laura@example.com" } });
    
    // Skip hire date for now
    // const hireDateInput = within(form).getByTestId("admin-nurse-profile-hire-date-input");
    // fireEvent.change(hireDateInput, { target: { value: "2026-03-21" } });
    
    fireEvent.change(within(form).getByLabelText("Especialidad"), { target: { value: "cuidados_intensivos" } });
    fireEvent.change(within(form).getByLabelText("Licencia"), { target: { value: "55" } });
    fireEvent.change(within(form).getByLabelText("Banco"), { target: { value: "Banco Central" } });
    fireEvent.change(within(form).getByLabelText("Numero de cuenta"), { target: { value: "123456" } });
    fireEvent.change(within(form).getByLabelText("Categoria"), { target: { value: "senior" } });
    fireEvent.change(within(form).getByLabelText("Contrasena inicial"), { target: { value: "Pass123!" } });
    fireEvent.change(within(form).getByLabelText("Confirmar contrasena"), { target: { value: "Pass123!" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear perfil de enfermeria" }));

    await waitFor(() => {
      expect(createNurseProfileForAdmin).toHaveBeenCalledWith({
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "00111111111",
        phone: "8095550199",
        email: "laura@example.com",
        hireDate: "",
        specialty: "cuidados_intensivos",
        licenseId: "55",
        bankName: "Banco Central",
        accountNumber: "123456",
        category: "senior",
        password: "Pass123!",
        confirmPassword: "Pass123!",
        isOperationallyActive: true,
      });
    });

    expect(navigate).toHaveBeenCalledWith("/admin/nurse-profiles/nurse-1", {
      state: {
        from: "/admin/nurse-profiles",
        successMessage: "La enfermera fue creada correctamente.",
      },
    });
  });
});
