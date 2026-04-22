import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPayrollNurseDetailPage from "./AdminPayrollNurseDetailPage";
import { getAdminNursePayrollDetail } from "../api/adminPayroll";
import type { NursePayrollPeriodDetailDto } from "../api/adminPayroll";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useParams: () => ({ periodId: "period-1", nurseUserId: "nurse-1" }),
}));

vi.mock("../api/adminPayroll", () => ({
  getAdminNursePayrollDetail: vi.fn(),
}));

vi.mock("../components/layout/AdminPortalShell", () => ({
  default: ({ children, title }: { children: ReactNode; title: string }) => (
    <div data-testid="admin-portal-shell">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const sampleDetail: NursePayrollPeriodDetailDto = {
  nurseUserId: "nurse-1",
  nurseDisplayName: "Maria Santos",
  periodId: "period-1",
  periodStartDate: "2026-04-01",
  periodEndDate: "2026-04-30",
  periodStatus: "Closed",
  services: [
    {
      serviceExecutionId: "svc-1",
      description: "Cuidado en domicilio 24h",
      baseCompensation: 2000,
      transportIncentive: 200,
      complexityBonus: 100,
      medicalSuppliesCompensation: 50,
      adjustmentsTotal: 0,
      deductionsTotal: 0,
      netCompensation: 2350,
      serviceDate: "2026-04-05T00:00:00",
    },
  ],
  deductions: [
    {
      id: "ded-1",
      label: "Seguro Medico",
      amount: 300,
      deductionType: "HealthInsurance",
    },
  ],
  grossCompensation: 2350,
  transportIncentives: 200,
  adjustmentsTotal: 0,
  deductionsTotal: 300,
  netCompensation: 2050,
};

const emptyDetail: NursePayrollPeriodDetailDto = {
  ...sampleDetail,
  services: [],
  deductions: [],
  grossCompensation: 0,
  transportIncentives: 0,
  adjustmentsTotal: 0,
  deductionsTotal: 0,
  netCompensation: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderPage() {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <AdminPayrollNurseDetailPage />
    </ThemeProvider>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AdminPayrollNurseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UC-008: Admin Views Nurse Payroll Detail on Web", () => {
    it("renders the nurse-payroll-detail-panel container", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(sampleDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-detail-panel")).toBeInTheDocument()
      );
    });

    it("shows loading spinner while fetching and then loaded container", async () => {
      let resolve: (v: NursePayrollPeriodDetailDto) => void;
      vi.mocked(getAdminNursePayrollDetail).mockReturnValue(
        new Promise((r) => { resolve = r; })
      );
      renderPage();
      expect(screen.queryByTestId("nurse-payroll-detail-loaded")).not.toBeInTheDocument();
      resolve!(sampleDetail);
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-detail-loaded")).toBeInTheDocument()
      );
    });

    it("renders nurse-payroll-services-table with service rows (UC-008 step 3)", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(sampleDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-services-table")).toBeInTheDocument()
      );
      expect(screen.getByText("Cuidado en domicilio 24h")).toBeInTheDocument();
    });

    it("renders nurse-payroll-deductions-table with deduction rows (UC-008 step 4)", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(sampleDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-deductions-table")).toBeInTheDocument()
      );
      expect(screen.getByText("Seguro Medico")).toBeInTheDocument();
    });

    it("shows empty state message when nurse has no services", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(emptyDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-services-table")).toBeInTheDocument()
      );
      expect(
        screen.getByText("No hay servicios registrados para este periodo.")
      ).toBeInTheDocument();
    });

    it("shows empty state message when nurse has no deductions", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(emptyDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-deductions-table")).toBeInTheDocument()
      );
      expect(
        screen.getByText("No hay deducciones registradas para este periodo.")
      ).toBeInTheDocument();
    });

    it("displays nurse display name in page title", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(sampleDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByText("Detalle de Nomina — Maria Santos")).toBeInTheDocument()
      );
    });

    it("displays formatted currency totals in the summary section", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockResolvedValue(sampleDetail);
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("nurse-payroll-detail-loaded")).toBeInTheDocument()
      );
      // Net compensation label is shown
      expect(screen.getByText("Compensacion Neta")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("shows error-toast alert when API call fails", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockRejectedValue(
        new Error("Error de conexion al servidor")
      );
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("error-toast")).toBeInTheDocument()
      );
      expect(screen.getByText("Error de conexion al servidor")).toBeInTheDocument();
    });

    it("does not show loaded container when API fails", async () => {
      vi.mocked(getAdminNursePayrollDetail).mockRejectedValue(new Error("fail"));
      renderPage();
      await waitFor(() =>
        expect(screen.getByTestId("error-toast")).toBeInTheDocument()
      );
      expect(screen.queryByTestId("nurse-payroll-detail-loaded")).not.toBeInTheDocument();
    });
  });
});
