import type { ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ResetPasswordPage from "./ResetPasswordPage";
import * as authApi from "../api/auth";

const navigate = vi.fn();
let locationState: { email?: string } = {};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => children,
    useNavigate: () => navigate,
    useLocation: () => ({ state: locationState }),
  };
});

vi.mock("../api/auth", async () => {
  const actual = await vi.importActual<typeof import("../api/auth")>("../api/auth");
  return {
    ...actual,
    resetPassword: vi.fn(),
  };
});

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    locationState = { email: "persona@example.com" };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("shows the server success message and redirects to login after resetting the password", async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue({
      message: "Tu contraseña fue actualizada correctamente. Redirigiendo al inicio de sesión...",
    });

    renderWithTheme(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("Código de verificación"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "Pass123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
      target: { value: "Pass123!" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Restablecer contraseña" }));
    });

    expect(
      screen.getByText("Tu contraseña fue actualizada correctamente. Redirigiendo al inicio de sesión...")
    ).toBeInTheDocument();
    expect(screen.getByText(/Usa tu nueva contraseña para iniciar sesión/i)).toBeInTheDocument();
    expect(authApi.resetPassword).toHaveBeenCalledWith("persona@example.com", "123456", "Pass123!");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
