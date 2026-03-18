import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { vi } from "vitest";
import { createTheme } from "@mui/material/styles";
import HomePage from "./pages/HomePage";
import CareRequestPage from "./pages/CareRequestPage";
import { createCareRequest } from "./api/careRequests";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/home" }),
  Link: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("./api/careRequests", () => ({
  createCareRequest: vi.fn(),
}));

vi.mock("./context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "token",
    email: "care@example.com",
    roles: ["Client"],
    profileType: 0,
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

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to the care request workspace from the primary action button", () => {
    renderWithTheme(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Open Request Board" }));

    expect(navigate).toHaveBeenCalledWith("/care-requests");
  });
});

describe("CareRequestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks invalid resident ids before submitting", async () => {
    renderWithTheme(<CareRequestPage />);

    fireEvent.change(screen.getByLabelText("Resident ID"), {
      target: { value: "invalid-guid" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Resident needs support with a medication reminder." },
    });

    expect(
      screen.getByText("Enter a valid GUID in 8-4-4-4-12 format."),
    ).toBeInTheDocument();
    expect(createCareRequest).not.toHaveBeenCalled();
  });

  it("submits valid care requests and shows success feedback", async () => {
    vi.mocked(createCareRequest).mockResolvedValue({ id: "created-id-123" });

    renderWithTheme(<CareRequestPage />);

    fireEvent.change(screen.getByLabelText("Resident ID"), {
      target: { value: "550e8400-e29b-41d4-a716-446655440010" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Resident needs a morning wellness visit and medication support." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Care Request" }));

    await waitFor(() => {
      expect(createCareRequest).toHaveBeenCalledWith({
        residentId: "550e8400-e29b-41d4-a716-446655440010",
        description: "Resident needs a morning wellness visit and medication support.",
      });
    });

    expect(
      await screen.findByText("Care Request created successfully with ID created-id-123."),
    ).toBeInTheDocument();
  });
});
