import { describe, expect, it } from "vitest";

import { formatRoleLabels } from "./roleLabels";

describe("formatRoleLabels", () => {
  it("maps backend role codes to Spanish labels", () => {
    expect(formatRoleLabels(["Admin", "Client", "Nurse"])).toBe(
      "Administracion, Cliente, Enfermeria",
    );
  });

  it("falls back to Usuario when the role list is empty", () => {
    expect(formatRoleLabels([])).toBe("Usuario");
  });
});
