import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";
import { createCareRequest } from "./api/careRequests";

vi.mock("./api/careRequests", () => ({
  createCareRequest: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the care request and shows the created id", async () => {
    vi.mocked(createCareRequest).mockResolvedValue({ id: "created-id-123" });

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText("Paste a GUID here"), {
      target: { value: "550e8400-e29b-41d4-a716-446655440010" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe the care request"), {
      target: { value: "Assist the resident with medication." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Care Request" }));

    await waitFor(() => {
      expect(createCareRequest).toHaveBeenCalledWith({
        residentId: "550e8400-e29b-41d4-a716-446655440010",
        description: "Assist the resident with medication.",
      });
    });

    expect(
      await screen.findByText("Created CareRequest with ID: created-id-123"),
    ).toBeInTheDocument();
  });

  it("shows the normalized API error message when the request fails", async () => {
    vi.mocked(createCareRequest).mockRejectedValue(new Error("API error: Invalid email or password."));

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText("Paste a GUID here"), {
      target: { value: "550e8400-e29b-41d4-a716-446655440011" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe the care request"), {
      target: { value: "Follow up with the resident." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Care Request" }));

    expect(
      await screen.findByText("API error: Invalid email or password."),
    ).toBeInTheDocument();
  });
});
