/**
 * Authentication and User Types
 */

export enum UserProfileType {
  Client = 0,
  Nurse = 1,
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
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
  email: string;
  roles: string[];
}

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  email: string | null;
  roles: string[];
  profileType: UserProfileType | null;
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface User {
  email: string;
  roles: string[];
}
