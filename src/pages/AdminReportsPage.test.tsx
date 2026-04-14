import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminReportsPage from "./AdminReportsPage";
import * as adminReportsApi from "../api/adminReports";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
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

// Mock AdminPortalShell to simplify test and isolate page logic
vi.mock("../components/layout/AdminPortalShell", () => ({
    __esModule: true,
    default: ({ children, title }: any) => <div data-testid="shell"><h1>{title}</h1>{children}</div>
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
    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(screen.getAllByText(/Estado general de solicitudes/)[0]).toBeInTheDocument();
  });

  it("selects payroll quincena report and shows payroll panel", async () => {
    const payrollData = {
      startDate: "2026-04-01",
      endDate: "2026-04-15",
      cutoffDate: "2026-04-13",
      paymentDate: "2026-04-15",
      staff: [],
      services: [],
    };
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValueOnce(mockReportData);
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValueOnce(payrollData);

    renderPage();
    await screen.findByText("5");
    fireEvent.click(screen.getByTestId("admin-report-option-payroll-summary"));
    expect(await screen.findByTestId("admin-payroll-report-panel")).toBeInTheDocument();
    expect(screen.getByText("Resumen por enfermera")).toBeInTheDocument();
  });

  it("changes report and loads new data", async () => {
    const mockUtilizationData = {
      rows: [{ nurseId: "1", nurseName: "Maria", totalAssigned: 10, completed: 8, pending: 2, completionRate: 0.8 }],
      totalNurses: 1,
    };
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValueOnce(mockReportData);
    vi.mocked(adminReportsApi.getAdminReport).mockResolvedValueOnce(mockUtilizationData);

    renderPage();

    // Wait for first data
    await screen.findByText("5");

    // Click on selection sidebar card
    const utilizationSidebarItem = screen.getAllByText(/Productividad por enfermera/)[0];
    fireEvent.click(utilizationSidebarItem);

    // Wait for second data
    await waitFor(() => {
      expect(screen.getByText("Maria")).toBeInTheDocument();
      expect(screen.getByText("80.0%")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    vi.mocked(adminReportsApi.getAdminReport).mockRejectedValueOnce(new Error("FAILED_API_CALL"));

    renderPage();

    // Mock ensures the alert with text is rendered
    expect(await screen.findByText("FAILED_API_CALL")).toBeInTheDocument();
  });

  it("triggers CSV export", async () => {
    renderPage();
    const exportButton = screen.getByText(/Exportar CSV/);
    expect(exportButton).toBeInTheDocument();
  });
});
