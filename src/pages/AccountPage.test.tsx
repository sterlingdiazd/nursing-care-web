import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "./AccountPage";

import { useAuth } from "../context/AuthContext";
import { UserProfileType } from "../types/auth";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    token: "test-token-12345678901234567890",
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
  })),
}));

vi.mock("../logging/clientLogger", () => ({
  logClientEvent: vi.fn(),
}));

vi.mock("../utils/roleLabels", () => ({
  formatRoleLabels: (roles: string[]) => roles.join(", "),
}));

vi.mock("../config/env", () => ({
  API_BASE_URL: "https://api.example.com",
}));

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      token: "test-token-12345678901234567890",
      userId: "11111111-1111-1111-1111-111111111111",
      email: "admin@example.com",
      roles: ["ADMIN"],
      profileType: UserProfileType.ADMIN,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
      isLoading: false,
      error: null,
      logout,
      register: vi.fn(),
      login: vi.fn(),
      clearError: vi.fn(),
      completeProfile: vi.fn(),
      applyAuthResponse: vi.fn(),
      completeOAuthLogin: vi.fn(),
    });
  });

  describe("Session Display", () => {
    it("should display user email", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });

    it("should display user roles", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("ADMIN")).toBeInTheDocument();
    });

    it("should display truncated token", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText(/test-token-1234567/)).toBeInTheDocument();
    });

    it("should display API base URL", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText(/api\.example\.com/i)).toBeInTheDocument();
    });

    it("should display active session message when authenticated", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Tu sesion esta activa.")).toBeInTheDocument();
    });
  });

  describe("Access Actions", () => {
    it("should display Google OAuth button", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Cambiar cuenta con Google")).toBeInTheDocument();
    });

    it("should display logout button when authenticated", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Cerrar sesion")).toBeInTheDocument();
    });

    it("should call logout when logout button is clicked", async () => {
      renderWithTheme(<AccountPage />);
      const logoutButton = screen.getByText("Cerrar sesion");
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(logout).toHaveBeenCalled();
      });
    });

    it("should navigate to home after logout", async () => {
      renderWithTheme(<AccountPage />);
      const logoutButton = screen.getByText("Cerrar sesion");
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith("/");
      });
    });

    it("should navigate to login when Google button is clicked", () => {
      renderWithTheme(<AccountPage />);
      const googleButton = screen.getByText("Cambiar cuenta con Google");
      fireEvent.click(googleButton);

      expect(navigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("Spanish Labels", () => {
    it("should display title in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Gestiona acceso, sesion y cambio de cuenta.")).toBeInTheDocument();
    });

    it("should display session section title in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Sesion")).toBeInTheDocument();
    });

    it("should display access section title in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Acceso")).toBeInTheDocument();
    });

    it("should display description in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(
        screen.getByText(
          "Este espacio se concentra solo en identidad y autenticacion. El diagnostico y las herramientas se movieron a secciones dedicadas.",
        ),
      ).toBeInTheDocument();
    });

    it("should display roles label in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Roles:")).toBeInTheDocument();
    });

    it("should display token label in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText(/Token:/)).toBeInTheDocument();
    });

    it("should display API label in Spanish", () => {
      renderWithTheme(<AccountPage />);
      expect(screen.getByText(/API:/)).toBeInTheDocument();
    });
  });

  describe("Unauthenticated State", () => {
    it("should display login and register buttons when not authenticated", () => {
      vi.mocked(useAuth).mockReturnValueOnce({
          isAuthenticated: false,
          token: null,
          userId: null,
          email: null,
          roles: [],
          profileType: null,
          requiresProfileCompletion: false,
          requiresAdminReview: false,
          isLoading: false,
          error: null,
          logout: vi.fn(),
          register: vi.fn(),
          login: vi.fn(),
          clearError: vi.fn(),
          completeProfile: vi.fn(),
          applyAuthResponse: vi.fn(),
          completeOAuthLogin: vi.fn(),
      });

      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Continuar con Google")).toBeInTheDocument();
      expect(screen.getByText("Iniciar sesion")).toBeInTheDocument();
      expect(screen.getByText("Registrar")).toBeInTheDocument();
    });

    it("should display no active session message when not authenticated", () => {
      vi.mocked(useAuth).mockReturnValueOnce({
          isAuthenticated: false,
          token: null,
          userId: null,
          email: null,
          roles: [],
          profileType: null,
          requiresProfileCompletion: false,
          requiresAdminReview: false,
          isLoading: false,
          error: null,
          logout: vi.fn(),
          register: vi.fn(),
          login: vi.fn(),
          clearError: vi.fn(),
          completeProfile: vi.fn(),
          applyAuthResponse: vi.fn(),
          completeOAuthLogin: vi.fn(),
      });

      renderWithTheme(<AccountPage />);
      expect(screen.getByText("No hay una sesion activa.")).toBeInTheDocument();
    });

    it("should display choose how to enter message when not authenticated", () => {
      vi.mocked(useAuth).mockReturnValueOnce({
          isAuthenticated: false,
          token: null,
          userId: null,
          email: null,
          roles: [],
          profileType: null,
          requiresProfileCompletion: false,
          requiresAdminReview: false,
          isLoading: false,
          error: null,
          logout: vi.fn(),
          register: vi.fn(),
          login: vi.fn(),
          clearError: vi.fn(),
          completeProfile: vi.fn(),
          applyAuthResponse: vi.fn(),
          completeOAuthLogin: vi.fn(),
      });

      renderWithTheme(<AccountPage />);
      expect(screen.getByText("Elige como entrar.")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to login when login button is clicked", () => {
      vi.mocked(useAuth).mockReturnValueOnce({
          isAuthenticated: false,
          token: null,
          userId: null,
          email: null,
          roles: [],
          profileType: null,
          requiresProfileCompletion: false,
          requiresAdminReview: false,
          isLoading: false,
          error: null,
          logout: vi.fn(),
          register: vi.fn(),
          login: vi.fn(),
          clearError: vi.fn(),
          completeProfile: vi.fn(),
          applyAuthResponse: vi.fn(),
          completeOAuthLogin: vi.fn(),
      });

      renderWithTheme(<AccountPage />);
      const loginButton = screen.getByText("Iniciar sesion");
      fireEvent.click(loginButton);

      expect(navigate).toHaveBeenCalledWith("/login");
    });

    it("should navigate to register when register button is clicked", () => {
      vi.mocked(useAuth).mockReturnValueOnce({
          isAuthenticated: false,
          token: null,
          userId: null,
          email: null,
          roles: [],
          profileType: null,
          requiresProfileCompletion: false,
          requiresAdminReview: false,
          isLoading: false,
          error: null,
          logout: vi.fn(),
          register: vi.fn(),
          login: vi.fn(),
          clearError: vi.fn(),
          completeProfile: vi.fn(),
          applyAuthResponse: vi.fn(),
          completeOAuthLogin: vi.fn(),
      });

      renderWithTheme(<AccountPage />);
      const registerButton = screen.getByText("Registrar");
      fireEvent.click(registerButton);

      expect(navigate).toHaveBeenCalledWith("/register");
    });
  });

  describe("Loading State", () => {
    it("should show loading text on logout button when logging out", async () => {
      vi.mocked(logout).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)));

      renderWithTheme(<AccountPage />);
      const logoutButton = screen.getByText("Cerrar sesion");
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByText("Cerrando sesion...")).toBeInTheDocument();
      });
    });
  });
});
