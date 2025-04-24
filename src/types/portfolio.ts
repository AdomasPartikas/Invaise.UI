export enum PortfolioStrategy {
  Balanced = 'Balanced',
  Growth = 'Growth',
  Income = 'Income',
  Aggressive = 'Aggressive',
  Conservative = 'Conservative'
}

export enum InvestmentType {
  Shares = 'Shares',
  Money = 'Money'
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  strategyDescription: PortfolioStrategy;
  createdAt: string;
  lastUpdated?: string;
  portfolioStocks?: PortfolioStock[];
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
  purchaseDate?: string;
  investmentType?: InvestmentType;
  investmentAmount?: number;
}

export interface CreatePortfolioRequest {
  name: string;
  strategyDescription: PortfolioStrategy;
}

export interface UpdatePortfolioRequest {
  name?: string;
  strategyDescription?: PortfolioStrategy;
}

export interface CreatePortfolioStockRequest {
  portfolioId: string;
  symbol: string;
  quantity: number;
  currentTotalValue: number;
  totalBaseValue: number;
  percentageChange?: number;
  purchaseDate: string;
  investmentType: InvestmentType;
  investmentAmount?: number; // Only used when investmentType is Money
}

export interface UpdatePortfolioStockRequest {
  quantity?: number;
  currentTotalValue?: number;
  totalBaseValue?: number;
  percentageChange?: number;
  purchaseDate?: string;
  investmentType?: InvestmentType;
  investmentAmount?: number;
} 