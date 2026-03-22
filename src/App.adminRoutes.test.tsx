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

vi.mock("./pages/AdminNurseProfileDetailPage", () => ({
  default: () => <div>admin nurse profile detail page</div>,
}));

vi.mock("./pages/AdminCreateNurseProfilePage", () => ({
  default: () => <div>admin create nurse profile page</div>,
}));

vi.mock("./pages/AdminEditNurseProfilePage", () => ({
  default: () => <div>admin edit nurse profile page</div>,
}));

vi.mock("./pages/AdminReviewNurseProfilePage", () => ({
  default: () => <div>admin review nurse profile page</div>,
}));

vi.mock("./pages/AdminActionQueuePage", () => ({
  default: () => <div>admin action queue page</div>,
}));

vi.mock("./pages/AdminCareRequestsPage", () => ({
  default: () => <div>admin care requests page</div>,
}));

vi.mock("./pages/AdminCareRequestDetailPage", () => ({
  default: () => <div>admin care request detail page</div>,
}));

vi.mock("./pages/AdminCreateCareRequestPage", () => ({
  default: () => <div>admin create care request page</div>,
}));

vi.mock("./pages/AdminCreateAdminPage", () => ({
  default: () => <div>admin create admin page</div>,
}));

vi.mock("./pages/AdminUsersPage", () => ({
  default: () => <div>admin users page</div>,
}));

vi.mock("./pages/AdminUserDetailPage", () => ({
  default: () => <div>admin user detail page</div>,
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

  it("renders admin care-request detail routes only for admin sessions", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/care-requests/request-1");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin care request detail page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/care-requests/request-1");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });

  it("protects the admin care-request creation route", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/care-requests/new");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin create care request page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/care-requests/new");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });

  it("renders the admin users list route only for admin sessions", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/users");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin users page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/users");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });

  it("protects the admin create-admin route", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/users/create-admin");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin create admin page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/users/create-admin");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });

  it("protects the nurse administration create route", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/nurse-profiles/new");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin create nurse profile page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/nurse-profiles/new");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });

  it("protects nurse administration detail and workflow routes", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/nurse-profiles/nurse-1");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin nurse profile detail page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.history.pushState({}, "", "/admin/nurse-profiles/nurse-1/edit");

    const editView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin edit nurse profile page")).toBeInTheDocument();
    });

    editView.unmount();
    window.history.pushState({}, "", "/admin/nurse-profiles/nurse-1/review");

    const reviewView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin review nurse profile page")).toBeInTheDocument();
    });

    reviewView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/nurse-profiles/nurse-1");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });

  it("protects the admin user detail route", async () => {
    saveSession(["Admin"]);
    window.history.pushState({}, "", "/admin/users/user-1");

    const adminView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("admin user detail page")).toBeInTheDocument();
    });

    adminView.unmount();
    window.localStorage.clear();
    saveSession(["Client"]);
    window.history.pushState({}, "", "/admin/users/user-1");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });
});
