import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("Admin create nurse profile page", () => {
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

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Laura" } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Gomez" } });
    fireEvent.change(screen.getByLabelText("Cedula"), { target: { value: "00111111111" } });
    fireEvent.change(screen.getByLabelText("Telefono"), { target: { value: "8095550199" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "laura@example.com" } });
    fireEvent.change(screen.getByLabelText("Fecha de contratacion"), { target: { value: "2026-03-21" } });
    fireEvent.change(screen.getByLabelText("Especialidad"), { target: { value: "Cuidados intensivos" } });
    fireEvent.change(screen.getByLabelText("Licencia"), { target: { value: "55" } });
    fireEvent.change(screen.getByLabelText("Banco"), { target: { value: "Banco Central" } });
    fireEvent.change(screen.getByLabelText("Numero de cuenta"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "Senior" } });
    fireEvent.change(screen.getByLabelText("Contrasena inicial"), { target: { value: "Pass123!" } });
    fireEvent.change(screen.getByLabelText("Confirmar contrasena"), { target: { value: "Pass123!" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear perfil de enfermeria" }));

    await waitFor(() => {
      expect(createNurseProfileForAdmin).toHaveBeenCalledWith({
        name: "Laura",
        lastName: "Gomez",
        identificationNumber: "00111111111",
        phone: "8095550199",
        email: "laura@example.com",
        hireDate: "2026-03-21",
        specialty: "Cuidados intensivos",
        licenseId: "55",
        bankName: "Banco Central",
        accountNumber: "123456",
        category: "Senior",
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
