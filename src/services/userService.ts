import { businessDomainService } from '../api/businessDomainService';
import { User } from '../types/auth';

// Define a complete UserDto interface that doesn't extend User
export interface UserDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
  lastLoginAt?: string;
  personalInfo?: {
    address?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  };
  preferences?: {
    riskTolerance?: number;
    investmentHorizon?: string;
  };
}

// Get all users (admin only)
export const getAllUsers = (includeInactive: boolean = true) => {
  console.log('getAllUsers called with includeInactive:', includeInactive);
  const result = businessDomainService.getAllUsers(includeInactive);
  console.log('getAllUsers result:', result);
  return result;
}

// Update user active status (admin only)
export const updateUserActiveStatus = (userId: string, isActive: boolean) => 
  businessDomainService.updateUserActiveStatus(userId, isActive); 