import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminReport, getAdminReportExportUrl } from "./adminReports";
import { httpClient } from "./httpClient";
import { extractApiErrorMessage } from "./errorMessage";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    defaults: {
      baseURL: "http://api.test",
    },
  },
}));

vi.mock("./errorMessage", () => ({
  extractApiErrorMessage: vi.fn((err, fallback) => fallback),
}));

describe("adminReports API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAdminReport calls httpClient.get with correct path and params", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { count: 10 } });
    
    const result = await getAdminReport("care-request-pipeline", { from: "2024-01-01" });
    
    expect(httpClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/admin/reports/care-request-pipeline"),
      expect.objectContaining({
        params: { from: "2024-01-01" },
      })
    );
    expect(result).toEqual({ count: 10 });
  });

  it("getAdminReportExportUrl constructs correct full URL", () => {
    const from = "2024-03-01";
    const url = getAdminReportExportUrl("active-inactive-users", { from });
    
    expect(url).toContain("http://api.test/admin/reports/active-inactive-users/export");
    expect(url).toContain("from=2024-03-01");
  });

  it("propagates errors via extractApiErrorMessage", async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error("AXIOS_ERROR"));
    vi.mocked(extractApiErrorMessage).mockReturnValue("CUSTOM_ERROR_MSG");
    
    await expect(getAdminReport("care-request-pipeline")).rejects.toThrow("CUSTOM_ERROR_MSG");
  });
});
