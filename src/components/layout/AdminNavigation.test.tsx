import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import AdminPortalShell, { adminPortalNavigationItems } from "./AdminPortalShell";

// Mock dependencies
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    email: "admin@test.com",
    logout: vi.fn(),
    roles: ["ADMIN"],
  }),
}));

vi.mock("../../api/adminNotifications", () => ({
  getAdminNotificationSummary: vi.fn(() => Promise.resolve({ unread: 0 })),
}));

const theme = createTheme();

describe("AdminPortal Navigation", () => {
  it("should include 'Reportes' in the static navigation items", () => {
    const reportItem = adminPortalNavigationItems.find(item => item.label === "Reportes");
    expect(reportItem).toBeDefined();
    expect(reportItem?.path).toBe("/admin/reports");
  });

  it("should render the 'Reportes' navigation button in the sidebar", async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AdminPortalShell eyebrow="Test" title="Test" description="Test">
            <div>Content</div>
          </AdminPortalShell>
        </ThemeProvider>
      </BrowserRouter>
    );

    // Sidebar items are rendered as buttons with labels
    expect(screen.getByText("Reportes")).toBeInTheDocument();
    expect(screen.getByText(/Indicadores operativos y exportacion de datos/)).toBeInTheDocument();
  });
});
