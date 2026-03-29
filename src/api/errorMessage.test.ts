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
});
