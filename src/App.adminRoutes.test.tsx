import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { UserProfileType } from "./types/auth";

vi.mock("./logging/clientLogger", () => ({
  logClientEvent: vi.fn(),
}));

vi.mock("./pages/LoginPage", () => ({
  default: () => <div>login page</div>,
}));

vi.mock("./pages/RegisterPage", () => ({
  default: () => <div>register page</div>,
}));

vi.mock("./pages/HomePage", () => ({
  default: () => <div>home page</div>,
}));

vi.mock("./pages/CareRequestPage", () => ({
  default: () => <div>care request page</div>,
}));

vi.mock("./pages/CareRequestsListPage", () => ({
  default: () => <div>care requests list page</div>,
}));

vi.mock("./pages/CareRequestDetailPage", () => ({
  default: () => <div>care request detail page</div>,
}));

vi.mock("./pages/AdminNurseProfilesPage", () => ({
  default: () => <div>admin nurse profiles page</div>,
}));

vi.mock("./pages/AdminActionQueuePage", () => ({
  default: () => <div>admin action queue page</div>,
}));

vi.mock("./pages/AdminCareRequestsPage", () => ({
  default: () => <div>admin care requests page</div>,
}));

vi.mock("./pages/AdminModulePlaceholderPage", () => ({
  default: () => <div>admin placeholder page</div>,
}));

vi.mock("./pages/AdminDashboardPage", () => ({
  default: () => <div>admin dashboard page</div>,
}));

function saveSession(roles: string[]) {
  window.localStorage.setItem(
    "authSession",
    JSON.stringify({
      token: "token",
      refreshToken: "refresh-token",
      expiresAtUtc: null,
      userId: "11111111-1111-1111-1111-111111111111",
      email: "admin@example.com",
      roles,
      profileType: UserProfileType.Client,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
    }),
  );
}

describe("Admin route boundaries", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the admin dashboard on admin sessions", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin dashboard page")).toBeInTheDocument();
    });
  });

  it("redirects non-admin sessions away from admin routes", async () => {
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });

    expect(screen.queryByText("admin dashboard page")).not.toBeInTheDocument();
  });

  it("protects the dedicated admin action queue route", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/action-items");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin action queue page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/action-items");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });
});
