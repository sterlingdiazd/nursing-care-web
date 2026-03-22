import { httpClient } from "./httpClient";
import { AuthResponse, RegisterRequest, LoginRequest, UserProfileType } from "../types/auth";
import { logClientEvent } from "../logging/clientLogger";
import { API_BASE_URL } from "../config/env";
import { extractApiErrorMessage } from "./errorMessage";

/**
 * Register a new user (Client or Nurse)
 * @param email User email
 * @param password User password
 * @param confirmPassword Password confirmation
 * @param profileType Client (0) or Nurse (1)
 * @returns AuthResponse with tokens and the current onboarding state
 */
export async function registerUser(
  name: string,
  lastName: string,
  identificationNumber: string,
 phone: string,
  email: string,
  password: string,
  confirmPassword: string,
  hireDate: string | null,
  specialty: string | null,
  licenseId: string | null,
  bankName: string | null,
  accountNumber: string | null,
  profileType: UserProfileType
): Promise<AuthResponse> {
  try {
    logClientEvent("web.auth", "User registration submitted", {
      email,
      identificationNumber,
      profileType: profileType === UserProfileType.Nurse ? "Nurse" : "Client",
    });

    const request: RegisterRequest = {
      name,
      lastName,
      identificationNumber,
      phone,
      email,
      password,
      confirmPassword,
      hireDate,
      specialty,
      licenseId,
      bankName,
      accountNumber,
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
    const errorMessage = extractApiErrorMessage(error, "No fue posible completar el registro.");

    logClientEvent(
      "web.auth",
      "User registration failed",
      {
        email,
        identificationNumber,
        errorMessage,
      },
      "error"
    );

    throw new Error(errorMessage);
  }
}

export async function completeProfile(
  name: string,
  lastName: string,
  identificationNumber: string,
  phone: string
): Promise<AuthResponse> {
  try {
    const response = await httpClient.post<AuthResponse>("/auth/complete-profile", {
      name,
      lastName,
      identificationNumber,
      phone,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "No fue posible completar el perfil."));
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
    const errorMessage = extractApiErrorMessage(error, "No fue posible iniciar sesion.");

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

export function getGoogleOAuthStartUrl(): string {
  return `${API_BASE_URL.replace(/\/$/, "")}/auth/google/start`;
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
      message: "La contrasena debe tener al menos 6 caracteres",
    };
  }
  return {
    isValid: true,
    message: "Contrasena valida",
  };
}
