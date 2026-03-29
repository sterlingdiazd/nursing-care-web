import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

import AdminReportsPage from "./AdminReportsPage";
import * as adminReportsApi from "../api/adminReports";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/reports", search: "" }),
  BrowserRouter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../api/adminReports", () => ({
  getAdminReport: vi.fn(),
  getAdminReportExportUrl: vi.fn(() => "http://export-url"),
}));

vi.mock("../api/adminNotifications", () => ({
  getAdminNotificationSummary: vi.fn(() => Promise.resolve({ unread: 0 })),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "mock-token",
    roles: ["ADMIN"],
    profileType: "ADMIN",
  }),
}));

const theme = createTheme();

describe("AdminReportsPage", () => {
  const mockReportData = {
    pendingCount: 5,
    approvedCount: 10,
    completedCount: 15,
    rejectedCount: 2,
    unassignedCount: 3,
    overdueCount: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValue(mockReportData);
  });

  const renderPage = () => render(
    <ThemeProvider theme={theme}>
      <AdminReportsPage />
    </ThemeProvider>
  );

  it("loads and displays the initial report data", async () => {
    renderPage();

    expect(await screen.findByText(/Centro de Reportes/)).toBeInTheDocument();
    
    await waitFor(() => {
      // Metric Value
      expect(screen.getByText("5")).toBeInTheDocument();
      // Sidebar Label (at least one)
      expect(screen.getAllByText(/Estado general de solicitudes/)[0]).toBeInTheDocument();
    });
  });

  it("changes report and loads new data", async () => {
    const mockUtilizationData = {
      rows: [{ nurseId: "1", nurseName: "Maria", totalAssigned: 10, completed: 8, pending: 2, completionRate: 0.8 }],
      totalNurses: 1,
    };
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValueOnce(mockReportData);
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValueOnce(mockUtilizationData);

    renderPage();

    await waitFor(() => screen.getByText("5"));

    const utilizationSidebarItem = screen.getAllByText(/Productividad por enfermera/)[0];
    fireEvent.click(utilizationSidebarItem);

    await waitFor(() => {
      expect(screen.getByText("Maria")).toBeInTheDocument();
      expect(screen.getByText("80.0%")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    vi.mocked(adminReportsApi.getAdminReport).mockRejectedValueOnce(new Error("FAILED_API_CALL"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/FAILED_API_CALL/)).toBeInTheDocument();
    });
  });
});
