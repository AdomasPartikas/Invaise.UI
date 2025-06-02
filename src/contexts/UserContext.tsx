import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../api/authService';
import { User, UserPersonalInfo, UserPreferences } from '../types/auth';

interface UserContextType {
  user: User | null;
  personalInfo: UserPersonalInfo | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  fetchUserInfo: () => Promise<void>;
  updatePersonalInfo: (info: UserPersonalInfo) => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [personalInfo, setPersonalInfo] = useState<UserPersonalInfo | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.getCurrentUserInfo();
      setUser(userData);
      setPersonalInfo(userData.personalInfo || null);
      setPreferences(userData.preferences || null);
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError('Failed to fetch user information');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePersonalInfo = async (info: UserPersonalInfo) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.updatePersonalInfo(user.id, info);
      setPersonalInfo(response);
      
      const updatedUser = { ...user, personalInfo: response };
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating personal info:', err);
      setError('Failed to update personal information');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (prefs: UserPreferences) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.updatePreferences(user.id, prefs);
      setPreferences(response);
      
      const updatedUser = { ...user, preferences: response };
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update user preferences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchUserInfo();
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        personalInfo,
        preferences,
        isLoading,
        error,
        fetchUserInfo,
        updatePersonalInfo,
        updatePreferences
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 