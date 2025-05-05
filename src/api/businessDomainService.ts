import { businessDomainApi } from './api';
import { LoginCredentials, RegistrationData, AuthResponse, UserPersonalInfo, UserPreferences } from '../types/auth';
import { TransactionType, TransactionStatus, TransactionTrigger, Transaction, CreateTransactionRequest } from '../types/transactions';

// Types based on backend entities
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
  // Authentication methods
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

  // User endpoints
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

  // User management endpoints (admin only)
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

  // Get historical market data for a symbol
  getHistoricalMarketData: async (symbol: string, start?: string, end?: string): Promise<MarketData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetHistoricalMarketData', {
      params: { symbol, start, end }
    });
    return response.data;
  },

  // Get intraday data for a symbol
  getIntradayMarketData: async (symbol: string, start?: string, end?: string): Promise<IntradayData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetIntradayMarketData', {
      params: { symbol, start, end }
    });
    return response.data;
  },

  // Get latest intraday data for a symbol with count
  getLatestIntradayMarketData: async (symbol: string, count: number = 2): Promise<IntradayData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetLatestIntradayMarketDataWithCount', {
      params: { symbol, count }
    });
    return response.data;
  },
  
  // Get latest historical market data for a symbol with count
  getLatestHistoricalMarketData: async (symbol: string, count: number = 2): Promise<MarketData[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetLatestHistoricalMarketDataWithCount', {
      params: { symbol, count }
    });
    return response.data;
  },

  // Get available symbols
  getAllUniqueSymbols: async (): Promise<string[]> => {
    const response = await businessDomainApi.get('/api/MarketData/GetAllUniqueSymbols');
    return response.data;
  },

  // Portfolio endpoints
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

  // Refresh portfolio data with new Gaia prediction
  refreshPortfolio: async (id: string): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await businessDomainApi.post(`/api/ModelPrediction/Portfolio/${id}/refresh`);
      return { success: true, message: response.data.message || 'New Gaia prediction generated' };
    } catch (error) {
      console.error('Error requesting new Gaia prediction:', error);
      return { success: false, message: 'Failed to generate new Gaia prediction' };
    }
  },

  // Portfolio Stock endpoints
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

  // Portfolio Optimization endpoints
  getPortfolioOptimization: async (portfolioId?: string): Promise<PortfolioOptimizationResult> => {
    const response = await businessDomainApi.get('/api/PortfolioOptimization/optimize', {
      params: { portfolioId }
    });
    
    // Sanitize the data
    const data = response.data;
    
    // Ensure recommendations are properly formatted
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
    
    // Ensure other fields have default values
    data.confidence = data.confidence !== undefined ? data.confidence : 0;
    data.explanation = data.explanation || 'No explanation provided';
    data.timestamp = data.timestamp || new Date().toISOString();
    data.successful = data.successful !== false;
    data.status = data.status || '';
    
    // Preserve metrics if they exist
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
      console.error('Error applying optimization:', error);
      // Handle 404 case specifically
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
      console.error('Error canceling optimization:', error);
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

  // Transaction endpoints
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

  // Update this method to use the dedicated endpoint
  isMarketOpen: async (): Promise<boolean> => {
    try {
      console.log("Checking market status via API endpoint...");
      const response = await businessDomainApi.get('/api/MarketData/IsMarketOpen');
      const isOpen = response.data;
      console.log(`Market is ${isOpen ? "OPEN" : "CLOSED"} according to API endpoint`);
      return isOpen;
    } catch (err) {
      console.error("Error checking market status:", err);
      // On error, assume market is open to avoid showing false "closed" indicators
      return true;
    }
  },

  // Admin related endpoints
  isAdmin: async (): Promise<boolean> => {
    try {
      console.log('Calling isAdmin endpoint...');
      const response = await businessDomainApi.get('/api/User/is-admin');
      console.log('isAdmin response:', response.data);
      
      // The backend is returning an object with a message, not a direct boolean
      if (typeof response.data === 'object' && response.data.message === "User is an admin") {
        return true;
      } else if (typeof response.data === 'boolean') {
        // Also handle case where API might return boolean directly in the future
        return response.data;
      }
      
      // Default to false if no match
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // AI Model endpoints
  getAllModels: async (): Promise<AIModel[]> => {
    try {
      console.log('Calling getAllModels endpoint...');
      const response = await businessDomainApi.get('/api/AIModel');
      console.log('getAllModels response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI models:', error);
      throw error;
    }
  },

  getModelById: async (id: number): Promise<AIModel> => {
    try {
      console.log(`Calling getModelById endpoint for id ${id}...`);
      const response = await businessDomainApi.get(`/api/AIModel/${id}`);
      console.log('getModelById response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching AI model with id ${id}:`, error);
      throw error;
    }
  },

  // Model Performance endpoints
  getTrainingStatus: async (): Promise<Record<number, boolean>> => {
    try {
      console.log('Calling getTrainingStatus endpoint...');
      const response = await businessDomainApi.get('/api/ModelPerformance/training-status');
      console.log('getTrainingStatus response:', response.data);
      
      // If we get an empty object, create a default one
      if (response.data && Object.keys(response.data).length === 0) {
        console.log('Empty training status, returning default status object');
        return {
          1: false, // Apollo
          2: false, // Ignis
          3: false  // Gaia
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching training status:', error);
      // Return a default status object on error
      return {
        1: false, // Apollo
        2: false, // Ignis
        3: false  // Gaia
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

  // Log endpoints
  getLogs: async (count: number = 50): Promise<LogEntry[]> => {
    try {
      console.log(`Fetching ${count} recent logs...`);
      const response = await businessDomainApi.get('/api/Log', {
        params: { count }
      });
      console.log('Logs response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }
}; 