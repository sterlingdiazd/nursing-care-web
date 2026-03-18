import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  subscribeToAuthSession,
} from "./sessionStorage";
import { UserProfileType } from "../types/auth";

describe("sessionStorage helpers", () => {
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
      email: "care@example.com",
      roles: ["Admin"],
      profileType: UserProfileType.Nurse,
    });

    expect(getAuthSession()).toEqual({
      token: "access-token",
      refreshToken: "refresh-token",
      expiresAtUtc: "2026-03-18T18:00:00Z",
      email: "care@example.com",
      roles: ["Admin"],
      profileType: UserProfileType.Nurse,
    });
  });

  it("notifies subscribers when the session changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthSession(listener);

    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      expiresAtUtc: null,
      email: "care@example.com",
      roles: ["Nurse"],
      profileType: UserProfileType.Nurse,
    });

    clearAuthSession();
    unsubscribe();
    saveAuthSession({
      token: "second-token",
      refreshToken: "second-refresh-token",
      expiresAtUtc: null,
      email: "care@example.com",
      roles: ["Nurse"],
      profileType: UserProfileType.Nurse,
    });

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
