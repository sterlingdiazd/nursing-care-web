import { describe, expect, it } from "vitest";

import { extractApiErrorMessage } from "./errorMessage";

describe("errorMessage", () => {
  it("prefers problem details detail text when present", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        data: {
          detail: "La cedula debe tener exactamente 11 digitos.",
          title: "La solicitud contiene datos invalidos.",
        },
      },
    };

    expect(extractApiErrorMessage(error, "No fue posible completar la solicitud.")).toBe(
      "La cedula debe tener exactamente 11 digitos.",
    );
  });

  it("falls back to the first validation message when detail is missing", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        data: {
          errors: {
            identificationNumber: ["La cedula debe tener exactamente 11 digitos."],
          },
        },
      },
    };

    expect(extractApiErrorMessage(error, "No fue posible completar la solicitud.")).toBe(
      "La cedula debe tener exactamente 11 digitos.",
    );
  });

  it("returns a concrete login message for unauthorized responses without detail", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 401",
      response: {
        status: 401,
        data: {},
      },
    };

    expect(extractApiErrorMessage(error, "No fue posible iniciar sesion.")).toBe(
      "Correo o contrasena invalidos. Verifica tus datos e intenta de nuevo.",
    );
  });

  it("returns a concrete throttling message for rate-limited responses without detail", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 429",
      response: {
        status: 429,
        data: {},
      },
    };

    expect(extractApiErrorMessage(error, "No fue posible iniciar sesion.")).toBe(
      "Has excedido temporalmente los intentos permitidos. Intenta de nuevo en unos minutos.",
    );
  });
});
