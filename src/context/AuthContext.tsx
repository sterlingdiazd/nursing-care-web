import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AuthContextType,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UserProfileType,
} from "../types/auth";
import { completeProfile as completeProfileRequest, registerUser, loginUser } from "../api/auth";
import { logClientEvent } from "../logging/clientLogger";
import {
  clearAuthSession,
  getAuthSession,
  resolveUserIdFromToken,
  saveAuthSession,
  subscribeToAuthSession,
} from "../auth/sessionStorage";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveResponseUserId(response: AuthResponse) {
  if (response.userId?.trim().length) {
    return response.userId;
  }

  if (response.token?.trim().length) {
    return resolveUserIdFromToken(response.token);
  }

  return getAuthSession()?.userId ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profileType, setProfileType] = useState<UserProfileType | null>(null);
  const [requiresProfileCompletion, setRequiresProfileCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSession = () => {
    const session = getAuthSession();

    if (!session) {
      setToken(null);
      setUserId(null);
      setEmail(null);
      setRoles([]);
      setProfileType(null);
      setRequiresProfileCompletion(false);
      setIsAuthenticated(false);
      return;
    }

    setToken(session.token);
    setUserId(session.userId);
    setEmail(session.email);
    setRoles(session.roles);
    setProfileType(session.profileType);
    setRequiresProfileCompletion(session.requiresProfileCompletion);
    setIsAuthenticated(Boolean(session.token));
  };

  // Load auth from localStorage on mount
  useEffect(() => {
    syncSession();

    const unsubscribe = subscribeToAuthSession(syncSession);
    const session = getAuthSession();

    if (session) {
      logClientEvent("web.auth", "Auth restored from localStorage", { email: session.email });
    }

    return unsubscribe;
  }, []);

  const resolveProfileType = (response: AuthResponse, fallbackProfileType?: UserProfileType | null) => {
    if (response.roles.includes("Nurse")) {
      return UserProfileType.Nurse;
    }

    return fallbackProfileType ?? UserProfileType.Client;
  };

  const applyAuthResponse = (response: AuthResponse, fallbackProfileType?: UserProfileType | null) => {
    const detectedProfileType = resolveProfileType(response, fallbackProfileType);
    const resolvedUserId = resolveResponseUserId(response);

    if (!resolvedUserId) {
      throw new Error("No fue posible resolver el identificador del usuario autenticado.");
    }

    setToken(response.token);
    setUserId(resolvedUserId);
    setEmail(response.email);
    setRoles(response.roles);
    setProfileType(detectedProfileType);
    setRequiresProfileCompletion(response.requiresProfileCompletion);
    setIsAuthenticated(Boolean(response.token));

    saveAuthSession({
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAtUtc: response.expiresAtUtc,
      userId: resolvedUserId,
      email: response.email,
      roles: response.roles,
      profileType: detectedProfileType,
      requiresProfileCompletion: response.requiresProfileCompletion,
    });
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUser(
        data.name,
        data.lastName,
        data.identificationNumber,
        data.phone,
        data.email,
        data.password,
        data.confirmPassword,
        data.profileType
      );

      if (response.token) {
        // Client registration - token returned, user is active
        applyAuthResponse(response, data.profileType);

        logClientEvent("web.auth", "Client registration successful", {
          email: response.email,
        });
      } else {
        // Nurse registration - no token, account pending approval
        setEmail(data.email);
        setUserId(resolveResponseUserId(response));
        setProfileType(data.profileType);
        setRoles(response.roles);
        setIsAuthenticated(false);
        setToken(null);

        logClientEvent("web.auth", "Nurse registration successful - pending approval", {
          email: data.email,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Registration failed";
      setError(errorMsg);
      logClientEvent("web.auth", "Registration error caught in context", {}, "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeProfile = async (
    data: Omit<RegisterRequest, "email" | "password" | "confirmPassword" | "profileType">
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await completeProfileRequest(
        data.name,
        data.lastName,
        data.identificationNumber,
        data.phone
      );

      applyAuthResponse(response, UserProfileType.Client);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Profile completion failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser(data.email, data.password);
      applyAuthResponse(response);

      logClientEvent("web.auth", "Login successful", { email: response.email });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      logClientEvent("web.auth", "Login error caught in context", {}, "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOAuthLogin = (response: AuthResponse) => {
    setError(null);
    applyAuthResponse(response);

    logClientEvent("web.auth", "Google OAuth login successful", {
      email: response.email,
      roles: response.roles,
    });
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setEmail(null);
    setRoles([]);
    setProfileType(null);
    setRequiresProfileCompletion(false);
    setIsAuthenticated(false);
    setError(null);

    clearAuthSession();

    logClientEvent("web.auth", "User logged out");
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    token,
    userId,
    email,
    roles,
    profileType,
    requiresProfileCompletion,
    isLoading,
    error,
    register,
    completeProfile,
    login,
    completeOAuthLogin,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
