import type { ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPage from "./ForgotPasswordPage";
import * as authApi from "../api/auth";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => children,
    useNavigate: () => navigate,
  };
});

vi.mock("../api/auth", async () => {
  const actual = await vi.importActual<typeof import("../api/auth")>("../api/auth");
  return {
    ...actual,
    forgotPassword: vi.fn(),
  };
});

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("shows recovery guidance and a resend countdown after a successful request", async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue({
      message: "Si el correo está registrado, se ha enviado un código de recuperación.",
    });

    renderWithTheme(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "persona@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código de recuperación" }));
    });

    expect(screen.getByText(/hemos enviado un código de 6 dígitos/i)).toBeInTheDocument();
    expect(screen.getByText(/¿No recibiste el código\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reenviar código en 01:00/i })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("button", { name: /Reenviar código en 00:59/i })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(59000);
    });

    expect(screen.getByRole("button", { name: "Reenviar código" })).not.toBeDisabled();
    expect(
      screen.getByText("Si no recibiste el correo, ya puedes solicitar un nuevo código con el mismo correo.")
    ).toBeInTheDocument();
  });
});
