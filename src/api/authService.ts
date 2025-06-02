import { businessDomainApi } from './api';
import { businessDomainService } from './businessDomainService';
import { LoginCredentials, RegistrationData, AuthResponse, User, UserPersonalInfo, UserPreferences } from '../types/auth';

const TOKEN_KEY = 'invaise_auth_token';
const USER_KEY = 'invaise_user';
const EXPIRY_KEY = 'invaise_token_expiry';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const data = await businessDomainService.login(credentials);
    
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(EXPIRY_KEY, data.expiresAt);
    
    return data;
  },
  
  // Register user
  register: async (registrationData: RegistrationData): Promise<AuthResponse> => {
    const data = await businessDomainService.register(registrationData);
    
    // Save auth data to local storage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(EXPIRY_KEY, data.expiresAt);
    
    return data;
  },
  
  // Forgot password
  forgotPassword: async (email: string): Promise<boolean> => {
    return await businessDomainService.forgotPassword(email);
  },
  
  // Refresh token
  refreshToken: async (): Promise<AuthResponse | null> => {
    try {
      // Get the current token and user email
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        return null;
      }

      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        return null;
      }
      
      // Call the token refresh endpoint with minimal credentials
      const data = await businessDomainService.refreshToken(token);
      
      // Save the new auth data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(EXPIRY_KEY, data.expiresAt);
      
      return data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  },
  
  // Get current user info
  getCurrentUserInfo: async (): Promise<User> => {
    const response = await businessDomainService.getCurrentUser();
    
    // Update user in local storage
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    
    return response;
  },
  
  // Update user personal info
  updatePersonalInfo: async (userId: string, personalInfo: UserPersonalInfo): Promise<UserPersonalInfo> => {
    const response = await businessDomainService.updateUserPersonalInfo(userId, personalInfo);
    
    // Update user in local storage
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, personalInfo: response };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    
    return response;
  },
  
  // Update user preferences
  updatePreferences: async (userId: string, preferences: UserPreferences): Promise<UserPreferences> => {
    const response = await businessDomainService.updateUserPreferences(userId, preferences);
    
    // Update user in local storage
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, preferences: response };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    
    return response;
  },
  
  // Logout user
  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryStr = localStorage.getItem(EXPIRY_KEY);
    
    if (!token || !expiryStr) {
      return false;
    }
    
    // Check if token is expired
    const expiry = new Date(expiryStr);
    const now = new Date();
    return now < expiry;
  },
  
  // Get token expiry time
  getTokenExpiry: (): Date | null => {
    const expiryStr = localStorage.getItem(EXPIRY_KEY);
    return expiryStr ? new Date(expiryStr) : null;
  },
  
  // Get current user
  getCurrentUser: (): User | null => {
    if (!authService.isAuthenticated()) {
      return null;
    }
    
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  }
};

// Add auth token to all requests if available
businessDomainApi.interceptors.request.use(config => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}); 