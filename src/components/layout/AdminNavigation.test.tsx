import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import AdminPortalShell, { getAdminNavigationItems } from "./AdminPortalShell";

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
  it("should include 'reports' in the resolved navigation items", () => {
    const t = (key: string) => key;
    const items = getAdminNavigationItems(t as any);
    const reportItem = items.find(item => item.path === "/admin/reports");
    expect(reportItem).toBeDefined();
    expect(reportItem?.label).toBe("nav.reports.label");
  });

  it("should render the translated navigation button in the sidebar", async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AdminPortalShell eyebrow="Test" title="Test" description="Test">
            <div>Content</div>
          </AdminPortalShell>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Reportes/)).toBeInTheDocument();
  });
});
