import { businessDomainApi } from './api';
import { businessDomainService } from './businessDomainService';
import { LoginCredentials, RegistrationData, AuthResponse, User, UserPersonalInfo, UserPreferences } from '../types/auth';

// Local storage keys
const TOKEN_KEY = 'invaise_auth_token';
const USER_KEY = 'invaise_user';
const EXPIRY_KEY = 'invaise_token_expiry';

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const data = await businessDomainService.login(credentials);
    
    // Save auth data to local storage
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
  
  // Update user personal info
  updatePersonalInfo: async (userId: string, personalInfo: UserPersonalInfo): Promise<User> => {
    const response = await businessDomainApi.put(`/api/user/${userId}/personal-info`, personalInfo);
    
    // Update user in local storage
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, personalInfo: response.data };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  },
  
  // Update user preferences
  updatePreferences: async (userId: string, preferences: UserPreferences): Promise<User> => {
    const response = await businessDomainApi.put(`/api/user/${userId}/preferences`, preferences);
    
    // Update user in local storage
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const updatedUser = { ...currentUser, preferences: response.data };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  },
  
  // Get current user info
  getCurrentUserInfo: async (): Promise<User> => {
    const response = await businessDomainApi.get('/api/user/me');
    
    // Update user in local storage
    localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    
    return response.data;
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