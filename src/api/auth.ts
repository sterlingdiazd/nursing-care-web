import { httpClient } from "./httpClient";
import { AuthResponse, RegisterRequest, LoginRequest, UserProfileType } from "../types/auth";
import { logClientEvent } from "../logging/clientLogger";

/**
 * Register a new user (Client or Nurse)
 * @param email User email
 * @param password User password
 * @param confirmPassword Password confirmation
 * @param profileType Client (0) or Nurse (1)
 * @returns AuthResponse with token (or empty for Nurse pending approval)
 */
export async function registerUser(
  email: string,
  password: string,
  confirmPassword: string,
  profileType: UserProfileType
): Promise<AuthResponse> {
  try {
    logClientEvent("web.auth", "User registration submitted", {
      email,
      profileType: profileType === UserProfileType.Nurse ? "Nurse" : "Client",
    });

    const request: RegisterRequest = {
      email,
      password,
      confirmPassword,
      profileType,
    };

    const response = await httpClient.post<AuthResponse>("/auth/register", request);
    
    logClientEvent("web.auth", "User registration successful", {
      email,
      profileType: profileType === UserProfileType.Nurse ? "Nurse" : "Client",
      hasToken: !!response.data.token,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      "Registration failed";

    logClientEvent(
      "web.auth",
      "User registration failed",
      {
        email,
        errorMessage,
      },
      "error"
    );

    throw new Error(errorMessage);
  }
}

/**
 * Login with email and password
 * @param email User email
 * @param password User password
 * @returns AuthResponse with token
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    logClientEvent("web.auth", "User login submitted", { email });

    const request: LoginRequest = {
      email,
      password,
    };

    const response = await httpClient.post<AuthResponse>("/auth/login", request);

    logClientEvent("web.auth", "User login successful", {
      email,
      roles: response.data.roles,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      "Login failed";

    logClientEvent(
      "web.auth",
      "User login failed",
      {
        email,
        errorMessage,
      },
      "error"
    );

    throw new Error(errorMessage);
  }
}

export async function refreshAuthToken(refreshToken: string): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>(
    "/auth/refresh",
    { refreshToken },
    {
      skipAuthRefresh: true,
    },
  );

  return response.data;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
} {
  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters",
    };
  }
  return {
    isValid: true,
    message: "Password is strong",
  };
}
