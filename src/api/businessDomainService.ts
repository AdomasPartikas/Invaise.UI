import { businessDomainApi } from './api';
import { LoginCredentials, RegistrationData, AuthResponse } from '../types/auth';

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
  }
}; 