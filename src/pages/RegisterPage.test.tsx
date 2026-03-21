import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import RegisterPage from "./RegisterPage";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useNavigate: () => navigate,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    register: vi.fn(),
    completeProfile: vi.fn(),
    isLoading: false,
    email: null,
    isAuthenticated: false,
    requiresProfileCompletion: false,
  }),
}));

vi.mock("../api/auth", async () => {
  const actual = await vi.importActual<typeof import("../api/auth")>("../api/auth");
  return {
    ...actual,
    getGoogleOAuthStartUrl: vi.fn(() => "https://example.com/oauth"),
  };
});

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("RegisterPage", () => {
  it("defaults to client profile and hides nurse-only fields", () => {
    renderWithTheme(<RegisterPage />);

    expect(screen.getByText("Perfil de cliente")).toBeInTheDocument();
    expect(screen.queryByText("Datos del perfil de enfermeria")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Fecha de contratacion")).not.toBeInTheDocument();
  });

  it("shows nurse-only fields when the nurse profile is selected", () => {
    renderWithTheme(<RegisterPage />);

    fireEvent.click(screen.getByRole("radio", { name: /enfermeria/i }));

    expect(screen.getByText("Perfil de enfermeria")).toBeInTheDocument();
    expect(screen.getByText("Datos del perfil de enfermeria")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha de contratacion")).toBeInTheDocument();
    expect(screen.getByLabelText("Especialidad")).toBeInTheDocument();
  });
});
