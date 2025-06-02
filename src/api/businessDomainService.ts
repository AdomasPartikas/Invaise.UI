import { businessDomainApi } from './api';
import { LoginCredentials, RegistrationData, AuthResponse, UserPersonalInfo, UserPreferences } from '../types/auth';
import { Transaction, CreateTransactionRequest } from '../types/transactions';

export interface MarketData {
  id: number;
  symbol: string;
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  createdAt: string;
}

export interface IntradayData {
  id: number;
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  current: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    risk_tolerance: number;
    investment_horizon: string;
  };
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  strategyDescription: string;
  createdAt: string;
  lastUpdated?: string;
}

export interface PortfolioStock {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  currentTotalValue: number;
  totalBaseValue: number;
  percentageChange: number;
  lastUpdated: string;
}

export interface PortfolioOptimizationResult {
  userId: string;
  optimizationId?: string;
  recommendations: PortfolioStockRecommendation[];
  explanation: string;
  confidence: number;
  timestamp: string;
  successful: boolean;
  errorMessage?: string;
  status?: string;
  metrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  sharpeRatio: number;
  meanReturn: number;
  variance: number;
  expectedReturn: number;
}

export interface PortfolioStockRecommendation {
  symbol: string;
  currentQuantity: number;
  recommendedQuantity: number;
  currentWeight?: number;
  targetWeight?: number;
  action: 'buy' | 'sell' | 'hold';
  reason?: string;
  explanation?: string;
}

export interface AIModel {
  id: number;
  name: string;
  accessUrl: string;
  description: string;
  modelStatus: string;
  createdAt: string;
  lastUpdated: string;
  lastTrainedAt: string;
  version: string;
}

export interface LogEntry {
  id: number;
  timeStamp: string;
  level: string;
  message: string;
  messageTemplate: string;
  processId: string;
  processName: string;
  properties: string;
  exception?: string;
}

export const businessDomainService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await businessDomainApi.post('/auth/login', credentials);
    return response.data;
  },

  register: async (registrationData: RegistrationData): Promise<AuthResponse> => {
    const response = await businessDomainApi.post('/auth/register', registrationData);
    return response.data;
  },

  refreshToken: async (token: string): Promise<AuthResponse> => {
    const response = await businessDomainApi.post('/auth/refresh-token', { token });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    const response = await businessDomainApi.post('/auth/forgot-password', { email });
    return response.status === 200;
  },

  getCurrentUser: async () => {
    const response = await businessDomainApi.get('/api/user/me');
    return response.data;
  },

  updateUserPersonalInfo: async (userId: string, personalInfo: UserPersonalInfo) => {
    const response = await businessDomainApi.put(`/api/user/${userId}/personal-info`, personalInfo);
    return response.data;
  },

  updateUserPreferences: async (userId: string, preferences: UserPreferences) => {
    const response = await businessDomainApi.put(`/api/user/${userId}/preferences`, preferences);
    return response.data;
  },

  getAllUsers: async (includeInactive: boolean = true) => {
    const response = await businessDomainApi.get('/api/user', {
      params: { includeInactive }
    });
    return response;
  },

  updateUserActiveStatus: async (userId: string, isActive: boolean) => {
    const response = await businessDomainApi.put(`/api/user/${userId}/active-status`, null, {
      params: { isActive }
    });
    return response.data;
  },

  getHistoricalMarketData: async (symbol: string, start?: string, end?: string): Promise<MarketData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetHistoricalMarketData', {
      params: { symbol, start, end }
    });
    return response.data;
  },

  getIntradayMarketData: async (symbol: string, start?: string, end?: string): Promise<IntradayData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetIntradayMarketData', {
      params: { symbol, start, end }
    });
    return response.data;
  },

  getLatestIntradayMarketData: async (symbol: string, count: number = 2): Promise<IntradayData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetLatestIntradayMarketDataWithCount', {
      params: { symbol, count }
    });
    return response.data;
  },
  
  getLatestHistoricalMarketData: async (symbol: string, count: number = 2): Promise<MarketData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetLatestHistoricalMarketDataWithCount', {
      params: { symbol, count }
    });
    return response.data;
  },

  getAllUniqueSymbols: async (): Promise<string[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetAllUniqueSymbols');
    return response.data;
  },

  getUserPortfolios: async (): Promise<Portfolio[]> => {
    const response = await businessDomainApi.get('/api/Portfolio');
    return response.data;
  },

  getPortfolioById: async (id: string): Promise<Portfolio> => {
    const response = await businessDomainApi.get(`/api/Portfolio/${id}`);
    return response.data;
  },

  createPortfolio: async (portfolio: { name: string, strategyDescription: string }): Promise<Portfolio> => {
    const response = await businessDomainApi.post('/api/Portfolio', portfolio);
    return response.data;
  },

  updatePortfolio: async (id: string, updates: { name: string, strategyDescription: string }): Promise<Portfolio> => {
    const response = await businessDomainApi.put(`/api/Portfolio/${id}`, updates);
    return response.data;
  },

  deletePortfolio: async (id: string): Promise<void> => {
    await businessDomainApi.delete(`/api/Portfolio/${id}`);
  },

  refreshPortfolio: async (id: string): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await businessDomainApi.post(`/api/ModelPrediction/Portfolio/${id}/refresh`);
      return { success: true, message: response.data.message || 'New Gaia prediction generated' };
    } catch (error) {
      console.error('Error requesting new Gaia prediction:', error);
      return { success: false, message: 'Failed to generate new Gaia prediction' };
    }
  },

  getPortfolioStocks: async (portfolioId: string): Promise<PortfolioStock[]> => {
    const response = await businessDomainApi.get(`/api/PortfolioStock/portfolio/${portfolioId}`);
    return response.data;
  },

  getPortfolioStockById: async (id: string): Promise<PortfolioStock> => {
    const response = await businessDomainApi.get(`/api/PortfolioStock/${id}`);
    return response.data;
  },

  addPortfolioStock: async (portfolioStock: Omit<PortfolioStock, 'id' | 'lastUpdated'>): Promise<PortfolioStock> => {
    const response = await businessDomainApi.post('/api/PortfolioStock', portfolioStock);
    return response.data;
  },

  updatePortfolioStock: async (id: string, updates: Partial<PortfolioStock>): Promise<PortfolioStock> => {
    const response = await businessDomainApi.put(`/api/PortfolioStock/${id}`, updates);
    return response.data;
  },

  deletePortfolioStock: async (id: string): Promise<void> => {
    await businessDomainApi.delete(`/api/PortfolioStock/${id}`);
  },

  getPortfolioOptimization: async (portfolioId?: string): Promise<PortfolioOptimizationResult> => {
    const response = await businessDomainApi.get('/api/PortfolioOptimization/optimize', {
      params: { portfolioId }
    });
    
    const data = response.data;
    
    if (data.recommendations && Array.isArray(data.recommendations)) {
      data.recommendations = data.recommendations.map((rec: any) => ({
        symbol: rec.symbol || '',
        currentQuantity: parseFloat(rec.currentQuantity) || 0,
        recommendedQuantity: parseFloat(rec.targetQuantity || rec.recommendedQuantity) || 0,
        currentWeight: parseFloat(rec.currentWeight) || 0,
        targetWeight: parseFloat(rec.targetWeight) || 0,
        action: rec.action || 'hold',
        reason: rec.reason || '',
        explanation: rec.explanation || ''
      }));
    } else {
      data.recommendations = [];
    }
    
    data.confidence = data.confidence !== undefined ? data.confidence : 0;
    data.explanation = data.explanation || 'No explanation provided';
    data.timestamp = data.timestamp || new Date().toISOString();
    data.successful = data.successful !== false;
    data.status = data.status || '';
    
    if (data.metrics) {
      data.metrics = {
        sharpeRatio: parseFloat(data.metrics.sharpeRatio) || 0,
        meanReturn: parseFloat(data.metrics.meanReturn) || 0,
        variance: parseFloat(data.metrics.variance) || 0,
        expectedReturn: parseFloat(data.metrics.expectedReturn) || 0
      };
    }
    
    return data;
  },

  getOptimizationHistory: async (portfolioId?: string, startDate?: string, endDate?: string): Promise<PortfolioOptimizationResult[]> => {
    const response = await businessDomainApi.get('/api/PortfolioOptimization/history', {
      params: { portfolioId, startDate, endDate }
    });
    return response.data;
  },

  applyOptimizationRecommendation: async (optimizationId: string): Promise<{ successful: boolean, message: string }> => {
    try {
      const response = await businessDomainApi.post(`/api/PortfolioOptimization/apply/${optimizationId}`);
      return { 
        successful: response.data.successful !== false, 
        message: response.data.message || 'Optimization applied successfully' 
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return { 
          successful: false, 
          message: 'Optimization not found. It may have expired or been applied already.'
        };
      }
      return { 
        successful: false, 
        message: error.response?.data?.message || 'Failed to apply optimization'
      };
    }
  },

  cancelOptimization: async (optimizationId: string): Promise<{ successful: boolean, message: string }> => {
    try {
      const response = await businessDomainApi.post(`/api/PortfolioOptimization/cancel/${optimizationId}`);
      return { 
        successful: response.data.successful !== false, 
        message: response.data.message || 'Optimization canceled successfully' 
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return { 
          successful: false, 
          message: 'Optimization not found. It may have already been canceled or applied.'
        };
      }
      return { 
        successful: false, 
        message: error.response?.data?.message || 'Failed to cancel optimization'
      };
    }
  },

  getUserTransactions: async (): Promise<Transaction[]> => {
    const response = await businessDomainApi.get('/api/Transaction');
    return response.data;
  },

  getPortfolioTransactions: async (portfolioId: string): Promise<Transaction[]> => {
    const response = await businessDomainApi.get(`/api/Transaction/portfolio/${portfolioId}`);
    return response.data;
  },

  createTransaction: async (transaction: CreateTransactionRequest): Promise<Transaction> => {
    const response = await businessDomainApi.post('/api/Transaction', transaction);
    return response.data;
  },

  cancelTransaction: async (transactionId: string): Promise<void> => {
    await businessDomainApi.delete(`/api/Transaction/${transactionId}`);
  },

  isMarketOpen: async (): Promise<boolean> => {
    try {
      const response = await businessDomainApi.get('/api/MarketData/IsMarketOpen');
      const isOpen = response.data;
      return isOpen;
    } catch (err) {
      console.error('Error checking market status:', err);
      return true;
    }
  },

  isAdmin: async (): Promise<boolean> => {
    try {
      const response = await businessDomainApi.get('/api/User/is-admin');
      
      if (typeof response.data === 'object' && response.data.message === "User is an admin") {
        return true;
      } else if (typeof response.data === 'boolean') {
        return response.data;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  getAllModels: async (): Promise<AIModel[]> => {
    try {
      const response = await businessDomainApi.get('/api/AIModel');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI models:', error);
      throw error;
    }
  },

  getModelById: async (id: number): Promise<AIModel> => {
    try {
      const response = await businessDomainApi.get(`/api/AIModel/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching AI model with id ${id}:`, error);
      throw error;
    }
  },

  getTrainingStatus: async (): Promise<Record<number, boolean>> => {
    try {
      const response = await businessDomainApi.get('/api/ModelPerformance/training-status');
      
      if (response.data && Object.keys(response.data).length === 0) {
        return {
          1: false,
          2: false,
          3: false
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching training status:', error);
      return {
        1: false,
        2: false,
        3: false
      };
    }
  },

  initiateModelRetraining: async (modelId: number): Promise<boolean> => {
    const response = await businessDomainApi.post(`/api/ModelPerformance/${modelId}/retrain`);
    return response.data;
  },

  checkAndRetrainAllModels: async (): Promise<Record<number, boolean>> => {
    const response = await businessDomainApi.post('/api/ModelPerformance/check-and-retrain-all');
    return response.data;
  },

  getLogs: async (count: number = 50): Promise<LogEntry[]> => {
    try {
      const response = await businessDomainApi.get('/api/Log', {
        params: { count }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }
}; 