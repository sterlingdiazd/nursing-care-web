import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCareRequestDetailPage from "./AdminCareRequestDetailPage";
import { getActiveNurseProfiles } from "../api/adminNurseProfiles";
import {
  getAdminCareRequestDetail,
  invoiceCareRequest,
  payCareRequest,
  voidCareRequest,
  generateReceipt,
} from "../api/adminCareRequests";
import { assignCareRequestNurse, transitionCareRequest } from "../api/careRequests";

const navigate = vi.fn();
const logout = vi.fn();
let routeSearch = "?view=unassigned&selected=request-1";

const pendingDetail = {
  id: "request-1",
  clientUserId: "client-1",
  clientDisplayName: "Carla Jimenez",
  clientEmail: "carla@example.com",
  clientIdentificationNumber: "00122334455",
  assignedNurseUserId: null,
  assignedNurseDisplayName: null,
  assignedNurseEmail: null,
  careRequestDescription: "Solicitud de cuidado en domicilio",
  careRequestType: "domicilio_24h",
  unit: 1,
  unitType: "dia_completo",
  price: 3500,
  total: 4200,
  distanceFactor: "local",
  complexityLevel: "estandar",
  clientBasePrice: null,
  medicalSuppliesCost: 0,
  careRequestDate: "2026-03-22",
  suggestedNurse: "Luisa",
  status: "Pending" as const,
  createdAtUtc: "2026-03-22T10:00:00Z",
  updatedAtUtc: "2026-03-22T10:00:00Z",
  approvedAtUtc: null,
  rejectedAtUtc: null,
  completedAtUtc: null,
  invoiceNumber: null,
  invoicedAtUtc: null,
  paidAtUtc: null,
  voidedAtUtc: null,
  voidReason: null,
  isOverdueOrStale: false,
  pricingBreakdown: {
    category: "domicilio",
    basePrice: 3500,
    categoryFactor: 1.2,
    distanceFactor: "local",
    distanceFactorValue: 1,
    complexityLevel: "estandar",
    complexityFactorValue: 1,
    volumeDiscountPercent: 0,
    subtotalBeforeSupplies: 4200,
    medicalSuppliesCost: 0,
    total: 4200,
  },
  payrollCompensation: null,
  shifts: [],
  timeline: [
    {
      id: "created:request-1",
      title: "Solicitud creada",
      description: "La solicitud entro en la cola administrativa.",
      occurredAtUtc: "2026-03-22T10:00:00Z",
    },
  ],
};

const assignedDetail = {
  ...pendingDetail,
  assignedNurseUserId: "nurse-1",
  assignedNurseDisplayName: "Luisa Martinez",
  assignedNurseEmail: "luisa@example.com",
};

const approvedDetail = {
  ...assignedDetail,
  status: "Approved" as const,
  approvedAtUtc: "2026-03-22T11:00:00Z",
  updatedAtUtc: "2026-03-22T11:00:00Z",
  timeline: [
    ...assignedDetail.timeline,
    {
      id: "approved:request-1",
      title: "Solicitud aprobada",
      description: "Administracion aprobo la solicitud para ejecucion operativa.",
      occurredAtUtc: "2026-03-22T11:00:00Z",
    },
  ],
};

const completedDetail = {
  ...assignedDetail,
  status: "Completed" as const,
  completedAtUtc: "2026-03-22T12:00:00Z",
  updatedAtUtc: "2026-03-22T12:00:00Z",
  timeline: [
    ...assignedDetail.timeline,
    {
      id: "completed:request-1",
      title: "Servicio completado",
      description: "La enfermera marco el servicio como completado.",
      occurredAtUtc: "2026-03-22T12:00:00Z",
    },
  ],
};

const invoicedDetail = {
  ...completedDetail,
  status: "Invoiced" as const,
  invoiceNumber: "FAC-2026-0001",
  invoicedAtUtc: "2026-03-22T13:00:00Z",
  updatedAtUtc: "2026-03-22T13:00:00Z",
};

const paidDetail = {
  ...invoicedDetail,
  status: "Paid" as const,
  paidAtUtc: "2026-03-22T14:00:00Z",
  updatedAtUtc: "2026-03-22T14:00:00Z",
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/admin/care-requests/request-1", search: routeSearch }),
  useParams: () => ({ id: "request-1" }),
}));

vi.mock("../api/adminCareRequests", () => ({
  getAdminCareRequestDetail: vi.fn(),
  invoiceCareRequest: vi.fn(),
  payCareRequest: vi.fn(),
  voidCareRequest: vi.fn(),
  generateReceipt: vi.fn(),
  registerAdminCareRequestShift: vi.fn(),
  recordAdminCareRequestShiftChange: vi.fn(),
}));

vi.mock("../hooks/useCareRequestCatalogOptions", () => ({
  useCareRequestCatalogOptions: () => ({
    data: {
      careRequestCategories: [{ code: "domicilio", displayName: "Domicilio", categoryFactor: 1.2 }],
      careRequestTypes: [
        { code: "domicilio_24h", displayName: "Domicilio 24h", careRequestCategoryCode: "domicilio", unitTypeCode: "dia_completo", basePrice: 3500 },
      ],
      unitTypes: [{ code: "dia_completo", displayName: "Dia completo" }],
      distanceFactors: [{ code: "local", displayName: "Local", multiplier: 1 }],
      complexityLevels: [{ code: "estandar", displayName: "Estandar", multiplier: 1 }],
      volumeDiscountRules: [],
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("../api/adminNurseProfiles", () => ({
  getActiveNurseProfiles: vi.fn(),
}));

vi.mock("../api/careRequests", () => ({
  assignCareRequestNurse: vi.fn(),
  transitionCareRequest: vi.fn(),
  verifyCareRequestPricing: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "token",
    userId: "11111111-1111-1111-1111-111111111111",
    email: "admin@example.com",
    roles: ["ADMIN"],
    profileType: "ADMIN",
    requiresProfileCompletion: false,
    requiresAdminReview: false,
    isLoading: false,
    error: null,
    logout,
    register: vi.fn(),
    login: vi.fn(),
    clearError: vi.fn(),
  }),
}));

const theme = createTheme();

function renderWithTheme(element: ReactNode) {
  return render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
}

describe("AdminCareRequestDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeSearch = "?view=unassigned&selected=request-1";
    vi.mocked(getAdminCareRequestDetail)
      .mockResolvedValueOnce(pendingDetail)
      .mockResolvedValueOnce(assignedDetail)
      .mockResolvedValueOnce(approvedDetail);
    vi.mocked(getActiveNurseProfiles).mockResolvedValue([
      {
        userId: "nurse-1",
        email: "luisa@example.com",
        name: "Luisa",
        lastName: "Martinez",
        specialty: "Atencion domiciliaria",
        category: "Senior",
      },
    ]);
    vi.mocked(assignCareRequestNurse).mockResolvedValue({
      id: "request-1",
      userID: "client-1",
      careRequestDescription: "Solicitud de cuidado en domicilio",
      status: "Pending",
      createdAtUtc: "2026-03-22T10:00:00Z",
      updatedAtUtc: "2026-03-22T10:30:00Z",
      approvedAtUtc: null,
      rejectedAtUtc: null,
      completedAtUtc: null,
      cancelledAtUtc: null,
      rejectionReason: null,
      assignedNurse: "nurse-1",
    });
    vi.mocked(transitionCareRequest).mockResolvedValue({
      id: "request-1",
      userID: "client-1",
      careRequestDescription: "Solicitud de cuidado en domicilio",
      status: "Approved",
      createdAtUtc: "2026-03-22T10:00:00Z",
      updatedAtUtc: "2026-03-22T11:00:00Z",
      approvedAtUtc: "2026-03-22T11:00:00Z",
      rejectedAtUtc: null,
      completedAtUtc: null,
      cancelledAtUtc: null,
      rejectionReason: null,
      assignedNurse: "nurse-1",
    });
  });

  it("renders pricing and timeline details, then runs assignment and approval actions", async () => {
    renderWithTheme(<AdminCareRequestDetailPage />);

    expect(await screen.findByText("Desglose de precios")).toBeInTheDocument();
    expect(screen.getByText("Linea de tiempo actual")).toBeInTheDocument();
    expect(screen.getByText("Solicitud creada")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Enfermera asignada"), {
      target: { value: "nurse-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Asignar enfermera" }));

    await waitFor(() => {
      expect(assignCareRequestNurse).toHaveBeenCalledWith("request-1", {
        assignedNurse: "nurse-1",
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reasignar enfermera" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Aprobar solicitud" }));

    await waitFor(() => {
      expect(transitionCareRequest).toHaveBeenCalledWith("request-1", "approve");
    });

    expect(await screen.findByText("Solicitud aprobada")).toBeInTheDocument();
    expect(await screen.findByText("La completacion corresponde exclusivamente a la enfermera asignada.")).toBeInTheDocument();
  }, 30000);
});

describe("AdminCareRequestDetailPage — billing modal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveNurseProfiles).mockResolvedValue([
      {
        userId: "nurse-1",
        email: "luisa@example.com",
        name: "Luisa",
        lastName: "Martinez",
        specialty: "Atencion domiciliaria",
        category: "Senior",
      },
    ]);
  });

  it("renders invoice button and opens modal for Completed status", async () => {
    vi.mocked(getAdminCareRequestDetail).mockResolvedValue(completedDetail);

    renderWithTheme(<AdminCareRequestDetailPage />);

    const invoiceButton = await screen.findByTestId("invoice-care-request-button");
    expect(invoiceButton).toBeInTheDocument();

    fireEvent.click(invoiceButton);

    await waitFor(() => {
      expect(screen.getByTestId("invoice-modal")).toBeInTheDocument();
    });

    expect(screen.getByTestId("invoice-number-input")).toBeInTheDocument();
    expect(screen.getByTestId("invoice-submit-button")).toBeInTheDocument();
  }, 15000);

  it("renders pay button and opens modal for Invoiced status", async () => {
    vi.mocked(getAdminCareRequestDetail).mockResolvedValue(invoicedDetail);

    renderWithTheme(<AdminCareRequestDetailPage />);

    const payButton = await screen.findByTestId("pay-care-request-button");
    expect(payButton).toBeInTheDocument();

    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByTestId("payment-modal")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bank-reference-input")).toBeInTheDocument();
    expect(screen.getByTestId("payment-submit-button")).toBeInTheDocument();
  }, 15000);

  it("renders void button and opens modal for Completed status", async () => {
    vi.mocked(getAdminCareRequestDetail).mockResolvedValue(completedDetail);

    renderWithTheme(<AdminCareRequestDetailPage />);

    const voidButton = await screen.findByTestId("void-care-request-button");
    expect(voidButton).toBeInTheDocument();

    fireEvent.click(voidButton);

    await waitFor(() => {
      expect(screen.getByTestId("void-modal")).toBeInTheDocument();
    });

    expect(screen.getByTestId("void-reason-input")).toBeInTheDocument();
    expect(screen.getByTestId("void-submit-button")).toBeInTheDocument();
  }, 15000);

  it("renders generate receipt button for Paid status", async () => {
    vi.mocked(getAdminCareRequestDetail).mockResolvedValue(paidDetail);
    vi.mocked(generateReceipt).mockResolvedValue({
      receiptId: "receipt-1",
      receiptNumber: "REC-20260322-0001",
      receiptContentBase64: btoa("fake-pdf-content"),
    });

    renderWithTheme(<AdminCareRequestDetailPage />);

    const receiptButton = await screen.findByTestId("generate-receipt-button");
    expect(receiptButton).toBeInTheDocument();
    expect(screen.getByTestId("receipt-details-section")).toBeInTheDocument();
  }, 15000);
});
