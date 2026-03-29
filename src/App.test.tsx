import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { vi } from "vitest";
import { createTheme } from "@mui/material/styles";
import HomePage from "./pages/HomePage";
import CareRequestPage from "./pages/CareRequestPage";
import { createCareRequest } from "./api/careRequests";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/home" }),
  Link: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("./api/careRequests", () => ({
  createCareRequest: vi.fn(),
  getCareRequests: vi.fn().mockResolvedValue([]),
}));

vi.mock("./hooks/useCareRequestCatalogOptions", () => ({
  useCareRequestCatalogOptions: () => ({
    data: {
      careRequestCategories: [{ code: "domicilio", displayName: "Domicilio", categoryFactor: 1.2 }],
      careRequestTypes: [
        {
          code: "domicilio_24h",
          displayName: "Domicilio 24h",
          careRequestCategoryCode: "domicilio",
          unitTypeCode: "dia_completo",
          basePrice: 3500,
        },
      ],
      unitTypes: [{ code: "dia_completo", displayName: "Dia completo" }],
      distanceFactors: [{ code: "local", displayName: "Local", multiplier: 1 }],
      complexityLevels: [{ code: "estandar", displayName: "Estandar", multiplier: 1 }],
      volumeDiscountRules: [{ minimumCount: 5, discountPercent: 5 }],
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("./context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "token",
    userId: "11111111-1111-1111-1111-111111111111",
    email: "care@example.com",
    roles: ["Client"],
    profileType: 0,
    requiresAdminReview: false,
    requiresProfileCompletion: false,
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

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to the care request workspace from the primary action button", () => {
    renderWithTheme(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir cola de solicitudes" }));

    expect(navigate).toHaveBeenCalledWith("/care-requests");
  });
});

describe("CareRequestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits valid care requests and shows success feedback", async () => {
    vi.mocked(createCareRequest).mockResolvedValue({ id: "created-id-123" });

    renderWithTheme(<CareRequestPage />);

    fireEvent.change(screen.getByLabelText("Descripcion de la solicitud"), {
      target: { value: "Resident needs a morning wellness visit and medication support." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear solicitud" }));

    await waitFor(() => {
      expect(createCareRequest).toHaveBeenCalledWith(
        {
          careRequestDescription: "Resident needs a morning wellness visit and medication support.",
          careRequestType: "domicilio_24h",
          unit: 1,
          distanceFactor: "local",
          complexityLevel: "estandar",
        },
        expect.any(String),
      );
    });

    expect(navigate).toHaveBeenCalledWith("/care-requests/created-id-123");
  });
});
