import { businessDomainApi } from '../api/api';
import { 
  Portfolio, 
  PortfolioStock, 
  CreatePortfolioRequest, 
  UpdatePortfolioRequest,
  CreatePortfolioStockRequest,
  UpdatePortfolioStockRequest
} from '../types/portfolio';

// Portfolio endpoints
export const getPortfolios = () => 
  businessDomainApi.get<Portfolio[]>('/api/portfolio');

export const getPortfolio = (id: string) => 
  businessDomainApi.get<Portfolio>(`/api/portfolio/${id}`);

export const createPortfolio = (data: CreatePortfolioRequest) => 
  businessDomainApi.post<Portfolio>('/api/portfolio', data);

export const updatePortfolio = (id: string, data: UpdatePortfolioRequest) => 
  businessDomainApi.put<Portfolio>(`/api/portfolio/${id}`, data);

export const deletePortfolio = (id: string) => 
  businessDomainApi.delete(`/api/portfolio/${id}`);

// Portfolio Stock endpoints
export const getPortfolioStocks = (portfolioId: string) => 
  businessDomainApi.get<PortfolioStock[]>(`/api/portfoliostock/portfolio/${portfolioId}`);

export const getPortfolioStock = (id: string) => 
  businessDomainApi.get<PortfolioStock>(`/api/portfoliostock/${id}`);

export const createPortfolioStock = (data: CreatePortfolioStockRequest) => 
  businessDomainApi.post<PortfolioStock>('/api/portfoliostock', data);

export const updatePortfolioStock = (id: string, data: UpdatePortfolioStockRequest) => 
  businessDomainApi.put<PortfolioStock>(`/api/portfoliostock/${id}`, data);

export const deletePortfolioStock = (id: string) => 
  businessDomainApi.delete(`/api/portfoliostock/${id}`);

// Market data endpoints
export const getHistoricalMarketData = (symbol: string, startDate?: string, endDate?: string) => 
  businessDomainApi.get(`/api/marketdata/gethistoricalmarketdata`, {
    params: { symbol, start: startDate, end: endDate }
  });

export const getIntradayMarketData = (symbol: string) => 
  businessDomainApi.get(`/api/marketdata/getintradaymarketdata`, {
    params: { symbol }
  });

export const getAllSymbols = () => 
  businessDomainApi.get<string[]>(`/api/marketdata/getalluniquesymbols`);

// Portfolio analytics
export const getPortfolioPerformance = (portfolioId: string, startDate: string, endDate: string) =>
  businessDomainApi.get(`/api/portfolio/${portfolioId}/performance`, {
    params: { startDate, endDate }
  });

export const getPortfolioValueHistory = (portfolioId: string, timeRange: string) =>
  businessDomainApi.get(`/api/portfolio/${portfolioId}/history`, {
    params: { timeRange }
  }); 