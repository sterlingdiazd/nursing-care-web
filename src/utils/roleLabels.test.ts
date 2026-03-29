import { describe, expect, it } from "vitest";

import { formatRoleLabels, getRoleLabel } from "./roleLabels";

describe("roleLabels", () => {
  it("maps backend role codes to Spanish labels", () => {
    expect(formatRoleLabels(["ADMIN", "CLIENT", "NURSE"])).toBe(
      "Administración, Cliente, Enfermería",
    );
  });

  it("falls back to Usuario when the role list is empty", () => {
    expect(formatRoleLabels([])).toBe("Usuario");
  });

  it("never exposes raw backend role codes to end users", () => {
    expect(getRoleLabel("Supervisor")).toBe("Rol no reconocido");
  });
});
