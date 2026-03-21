import { UserProfileType } from "../types/auth";

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresAtUtc: string | null;
  userId: string;
  email: string;
  roles: string[];
  profileType: UserProfileType | null;
  requiresProfileCompletion: boolean;
  requiresAdminReview: boolean;
}

const STORAGE_KEY = "authSession";
const listeners = new Set<() => void>();

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return window.atob(padded);
}

export function resolveUserIdFromToken(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const parsed = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
    const candidates = [
      parsed.userId,
      parsed.sub,
      parsed["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
    ];

    const resolved = candidates.find(
      (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
    );

    return typeof resolved === "string" ? resolved : null;
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession> & { token?: string };
    const userId = parsed.userId || (parsed.token ? resolveUserIdFromToken(parsed.token) : null);

    if (
      !parsed.token ||
      !parsed.refreshToken ||
      !Object.prototype.hasOwnProperty.call(parsed, "expiresAtUtc") ||
      !parsed.email ||
      !Array.isArray(parsed.roles) ||
      !userId
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const session: AuthSession = {
      token: parsed.token,
      refreshToken: parsed.refreshToken,
      expiresAtUtc: parsed.expiresAtUtc ?? null,
      userId,
      email: parsed.email,
      roles: parsed.roles,
      profileType: parsed.profileType ?? null,
      requiresProfileCompletion: parsed.requiresProfileCompletion ?? false,
      requiresAdminReview: parsed.requiresAdminReview ?? false,
    };

    if (parsed.userId !== userId) {
      saveAuthSession(session);
    }

    return session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notifyListeners();
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  notifyListeners();
}

export function subscribeToAuthSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}
