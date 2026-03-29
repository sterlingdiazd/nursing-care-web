/**
 * Authentication and User Types
 */

export enum UserProfileType {
  ADMIN = "ADMIN",
  NURSE = "NURSE",
  CLIENT = "CLIENT",
}

export interface RegisterRequest {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  hireDate?: string | null;
  specialty?: string | null;
  licenseId?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  profileType: UserProfileType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAtUtc: string | null;
  userId: string;
  email: string;
  roles: string[];
  requiresProfileCompletion: boolean;
  requiresAdminReview: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  email: string | null;
  roles: string[];
  profileType: UserProfileType | null;
  requiresProfileCompletion: boolean;
  requiresAdminReview: boolean;
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterRequest) => Promise<void>;
  completeProfile: (data: Omit<RegisterRequest, "email" | "password" | "confirmPassword" | "profileType">) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  applyAuthResponse: (response: AuthResponse, forcedProfileType?: UserProfileType) => void;
  completeOAuthLogin: (response: AuthResponse) => void;
  logout: () => void;
  clearError: () => void;
}

export interface User {
  userId: string;
  email: string;
  roles: string[];
}
