import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";

import CareRequestDetailPage from "./CareRequestDetailPage";
import CareRequestsListPage from "./CareRequestsListPage";
import {
  getCareRequestById,
  getCareRequests,
  transitionCareRequest,
} from "../api/careRequests";

const navigate = vi.fn();
const logout = vi.fn();

const listResponse = [
  {
    id: "request-1",
    residentId: "11111111-1111-1111-1111-111111111111",
    description: "Morning medication support",
    status: "Pending" as const,
    createdAtUtc: "2026-03-18T10:00:00Z",
    updatedAtUtc: "2026-03-18T10:00:00Z",
    approvedAtUtc: null,
    rejectedAtUtc: null,
    completedAtUtc: null,
  },
  {
    id: "request-2",
    residentId: "22222222-2222-2222-2222-222222222222",
    description: "Post-visit follow-up",
    status: "Completed" as const,
    createdAtUtc: "2026-03-18T11:00:00Z",
    updatedAtUtc: "2026-03-18T12:00:00Z",
    approvedAtUtc: "2026-03-18T11:20:00Z",
    rejectedAtUtc: null,
    completedAtUtc: "2026-03-18T12:00:00Z",
  },
];

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/care-requests" }),
  useParams: () => ({ id: "request-1" }),
}));

vi.mock("../api/careRequests", () => ({
  getCareRequests: vi.fn(),
  getCareRequestById: vi.fn(),
  transitionCareRequest: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "token",
    email: "admin@example.com",
    roles: ["Admin"],
    profileType: 1,
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

describe("Care request pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders request board summaries from the API response", async () => {
    vi.mocked(getCareRequests).mockResolvedValue(listResponse);

    renderWithTheme(<CareRequestsListPage />);

    expect(await screen.findByText("Morning medication support")).toBeInTheDocument();
    expect(screen.getByText("Post-visit follow-up")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Review Detail" })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Review Detail" })[0]);
    expect(navigate).toHaveBeenCalledWith("/care-requests/request-1");
  });

  it("shows admin actions and runs transitions from request detail", async () => {
    vi.mocked(getCareRequestById).mockResolvedValue(listResponse[0]);
    vi.mocked(transitionCareRequest).mockResolvedValue({
      ...listResponse[0],
      status: "Approved",
      approvedAtUtc: "2026-03-18T12:30:00Z",
      updatedAtUtc: "2026-03-18T12:30:00Z",
    });

    renderWithTheme(<CareRequestDetailPage />);

    expect(await screen.findByRole("button", { name: "Approve Request" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approve Request" }));

    await waitFor(() => {
      expect(transitionCareRequest).toHaveBeenCalledWith("request-1", "approve");
    });

    expect(await screen.findByRole("button", { name: "Mark As Completed" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve Request" })).not.toBeInTheDocument();
  });
});
