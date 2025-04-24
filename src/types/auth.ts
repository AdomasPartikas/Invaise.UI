export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

export interface UserPersonalInfo {
  address?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface UserPreferences {
  riskTolerance: number;
  investmentHorizon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  personalInfo?: UserPersonalInfo;
  preferences?: UserPreferences;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
} 