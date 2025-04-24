import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessDomainService, Portfolio, PortfolioStock } from '../api/businessDomainService';

interface PortfolioContextType {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  portfolioStocks: PortfolioStock[];
  isLoading: boolean;
  error: string | null;
  fetchPortfolios: () => Promise<void>;
  selectPortfolio: (portfolioId: string) => Promise<void>;
  fetchPortfolioStocks: (portfolioId: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all user portfolios
  const fetchPortfolios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await businessDomainService.getUserPortfolios();
      setPortfolios(data);
      
      // If we have portfolios but no current selection, select the first one
      if (data.length > 0 && !currentPortfolio) {
        setCurrentPortfolio(data[0]);
        await fetchPortfolioStocks(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError('Failed to fetch portfolios');
    } finally {
      setIsLoading(false);
    }
  };

  // Select a portfolio by ID
  const selectPortfolio = async (portfolioId: string) => {
    if (currentPortfolio?.id === portfolioId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const portfolio = await businessDomainService.getPortfolioById(portfolioId);
      setCurrentPortfolio(portfolio);
      await fetchPortfolioStocks(portfolioId);
    } catch (err) {
      console.error('Error selecting portfolio:', err);
      setError('Failed to select portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stocks for a portfolio
  const fetchPortfolioStocks = async (portfolioId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const stocks = await businessDomainService.getPortfolioStocks(portfolioId);
      setPortfolioStocks(stocks);
    } catch (err) {
      console.error('Error fetching portfolio stocks:', err);
      setError('Failed to fetch portfolio stocks');
    } finally {
      setIsLoading(false);
    }
  };

  // Load portfolios on mount
  useEffect(() => {
    fetchPortfolios();
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        currentPortfolio,
        portfolioStocks,
        isLoading,
        error,
        fetchPortfolios,
        selectPortfolio,
        fetchPortfolioStocks
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}; 