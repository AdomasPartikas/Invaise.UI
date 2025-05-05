import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../api/authService';
import { User, LoginCredentials, RegistrationData } from '../types/auth';

// Define token storage keys to match authService
const TOKEN_KEY = 'invaise_auth_token';
const USER_KEY = 'invaise_user';

interface PersonalInfo {
  age?: number;
  occupation?: string;
  incomeRange?: string;
  riskTolerance?: string;
  investmentGoals?: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  updatePersonalInfo: (userId: string, info: PersonalInfo) => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      const authResponse = await authService.register(data);
      setUser(authResponse.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password request failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePersonalInfo = async (userId: string, info: PersonalInfo) => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call to update user info
      // For demo purposes, we'll just simulate an API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Would normally update the user state with the new info
      console.log('Updated personal info for user', userId, info);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      register, 
      updatePersonalInfo, 
      forgotPassword,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 