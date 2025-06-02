import { businessDomainService } from '../api/businessDomainService';

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

export const getAllUsers = (includeInactive: boolean = true) => {
  const result = businessDomainService.getAllUsers(includeInactive);
  return result;
}

export const updateUserActiveStatus = (userId: string, isActive: boolean) => 
  businessDomainService.updateUserActiveStatus(userId, isActive); 