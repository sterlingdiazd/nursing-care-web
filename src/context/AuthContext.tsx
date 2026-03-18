import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AuthContextType,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UserProfileType,
} from "../types/auth";
import { registerUser, loginUser } from "../api/auth";
import { logClientEvent } from "../logging/clientLogger";
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  subscribeToAuthSession,
} from "../auth/sessionStorage";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profileType, setProfileType] = useState<UserProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSession = () => {
    const session = getAuthSession();

    if (!session) {
      setToken(null);
      setEmail(null);
      setRoles([]);
      setProfileType(null);
      setIsAuthenticated(false);
      return;
    }

    setToken(session.token);
    setEmail(session.email);
    setRoles(session.roles);
    setProfileType(session.profileType);
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

    setToken(response.token);
    setEmail(response.email);
    setRoles(response.roles);
    setProfileType(detectedProfileType);
    setIsAuthenticated(Boolean(response.token));

    saveAuthSession({
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAtUtc: response.expiresAtUtc,
      email: response.email,
      roles: response.roles,
      profileType: detectedProfileType,
    });
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUser(
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
    setEmail(null);
    setRoles([]);
    setProfileType(null);
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
    email,
    roles,
    profileType,
    isLoading,
    error,
    register,
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
