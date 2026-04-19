import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  subscribeToAuthSession,
} from "./sessionStorage";
import { UserProfileType } from "../types/auth";

describe("sessionStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists and restores the auth session payload", () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      expiresAtUtc: "2026-03-18T18:00:00Z",
      userId: "11111111-1111-1111-1111-111111111111",
      email: "care@example.com",
      roles: ["ADMIN"],
      profileType: UserProfileType.NURSE,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
    });

    expect(getAuthSession()).toEqual({
      token: "access-token",
      refreshToken: "refresh-token",
      expiresAtUtc: "2026-03-18T18:00:00Z",
      userId: "11111111-1111-1111-1111-111111111111",
      email: "care@example.com",
      roles: ["ADMIN"],
      profileType: UserProfileType.NURSE,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
    });
  });

  it("notifies subscribers when the session changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthSession(listener);

    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      expiresAtUtc: null,
      userId: "11111111-1111-1111-1111-111111111111",
      email: "care@example.com",
      roles: ["NURSE"],
      profileType: UserProfileType.NURSE,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
    });

    clearAuthSession();
    unsubscribe();
    saveAuthSession({
      token: "second-token",
      refreshToken: "second-refresh-token",
      expiresAtUtc: null,
      userId: "11111111-1111-1111-1111-111111111111",
      email: "care@example.com",
      roles: ["NURSE"],
      profileType: UserProfileType.NURSE,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
    });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("hydrates a legacy session by deriving userId from the jwt", () => {
    const tokenPayload = {
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier":
        "22222222-2222-2222-2222-222222222222",
    };
    const token = [
      "header",
      btoa(JSON.stringify(tokenPayload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
      "signature",
    ].join(".");

    window.localStorage.setItem(
      "authSession",
      JSON.stringify({
        token,
        refreshToken: "refresh-token",
        expiresAtUtc: null,
        email: "legacy@example.com",
        roles: ["ADMIN"],
        profileType: UserProfileType.NURSE,
        requiresProfileCompletion: false,
        requiresAdminReview: false,
      }),
    );

    expect(getAuthSession()).toEqual({
      token,
      refreshToken: "refresh-token",
      expiresAtUtc: null,
      userId: "22222222-2222-2222-2222-222222222222",
      email: "legacy@example.com",
      roles: ["ADMIN"],
      profileType: UserProfileType.NURSE,
      requiresProfileCompletion: false,
      requiresAdminReview: false,
    });
  });
});
