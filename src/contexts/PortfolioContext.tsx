import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { businessDomainService, Portfolio, PortfolioStock, PortfolioOptimizationResult } from '../api/businessDomainService';

interface PortfolioContextType {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  portfolioStocks: PortfolioStock[];
  optimization: PortfolioOptimizationResult | null;
  optimizationLoading: boolean;
  optimizationError: string | null;
  inProgressOptimizationId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchPortfolios: () => Promise<void>;
  selectPortfolio: (portfolioId: string) => Promise<void>;
  fetchPortfolioStocks: (portfolioId: string) => Promise<void>;
  refreshPortfolio: (portfolioId: string) => Promise<boolean>;
  getPortfolioOptimization: (portfolioId?: string) => Promise<PortfolioOptimizationResult | null>;
  applyOptimizationRecommendation: (optimizationId: string) => Promise<boolean>;
  cancelOptimization: (optimizationId: string) => Promise<boolean>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [optimization, setOptimization] = useState<PortfolioOptimizationResult | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState<boolean>(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [inProgressOptimizationId, setInProgressOptimizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pendingRequests = useRef<Record<string, boolean>>({});
  const lastFetchTimestamp = useRef<Record<string, number>>({});
  
  const REQUEST_THROTTLE_TIME = 2000;

  const extractOptimizationId = (errorMessage: string): string | null => {
    const match = errorMessage.match(/Optimization ID: ([a-f0-9-]+)/i);
    return match ? match[1] : null;
  };

  const fetchPortfolios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await businessDomainService.getUserPortfolios();
      setPortfolios(data);
      
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

  const selectPortfolio = async (portfolioId: string) => {
    if (currentPortfolio?.id === portfolioId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const portfolio = await businessDomainService.getPortfolioById(portfolioId);
      setCurrentPortfolio(portfolio);
      await fetchPortfolioStocks(portfolioId);
      
      setOptimization(null);
      setOptimizationError(null);
      setInProgressOptimizationId(null);
    } catch (err) {
      console.error('Error selecting portfolio:', err);
      setError('Failed to select portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPortfolioStocks = async (portfolioId: string) => {
    if (pendingRequests.current[portfolioId]) {
      return;
    }
    
    const now = Date.now();
    const lastFetch = lastFetchTimestamp.current[portfolioId] || 0;
    if (now - lastFetch < REQUEST_THROTTLE_TIME) {
      return;
    }
    
    pendingRequests.current[portfolioId] = true;
    lastFetchTimestamp.current[portfolioId] = now;
    
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
      setTimeout(() => {
        pendingRequests.current[portfolioId] = false;
      }, 500);
    }
  };

  const refreshPortfolio = async (portfolioId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.refreshPortfolio(portfolioId);
      
      if (result.success) {
        await fetchPortfolioStocks(portfolioId);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Error getting new Gaia prediction:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getPortfolioOptimization = async (portfolioId?: string) => {
    setOptimizationLoading(true);
    setOptimizationError(null);
    try {
      const targetPortfolioId = portfolioId || currentPortfolio?.id;
      if (!targetPortfolioId) {
        throw new Error('No portfolio selected');
      }
      
      try {
        await refreshPortfolio(targetPortfolioId);
      } catch (refreshErr) {
        console.warn('Failed to get fresh Gaia prediction before optimization, proceeding with existing data', refreshErr);
      }
      
      const result = await businessDomainService.getPortfolioOptimization(targetPortfolioId);
      
      if (result.recommendations && result.recommendations.length > 0) {
        result.recommendations = result.recommendations.map(rec => {
          const rawRec = rec as any;
          const processedRec = {
            ...rec,
            currentQuantity: typeof rec.currentQuantity === 'number' && !isNaN(rec.currentQuantity) ? rec.currentQuantity : 0,
          };
          
          if (typeof rawRec.targetQuantity === 'number' && !isNaN(rawRec.targetQuantity)) {
            processedRec.recommendedQuantity = rawRec.targetQuantity;
          } else if (typeof rec.recommendedQuantity === 'number' && !isNaN(rec.recommendedQuantity)) {
            processedRec.recommendedQuantity = rec.recommendedQuantity;
          } else {
            processedRec.recommendedQuantity = 0;
          }
          
          return processedRec;
        });
      }
      
      setOptimization(result);
      
      if (!result.optimizationId) {
        try {
          const history = await businessDomainService.getOptimizationHistory(targetPortfolioId);
          if (history && history.length > 0) {
            const sortedHistory = [...history].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            const latestWithId = sortedHistory.find(item => item.optimizationId);
            if (latestWithId && latestWithId.optimizationId) {
              result.optimizationId = latestWithId.optimizationId;
              setOptimization(result);
            }
          }
        } catch (historyErr) {
          console.warn('Failed to get optimization history:', historyErr);
        }
      }
      
      return result;
    } catch (err: any) {
      console.error('Error fetching portfolio optimization:', err);
      
      if (err.response && err.response.status === 409) {
        const errorMessage = err.response.data || "There is already an optimization in progress.";
        setOptimizationError(errorMessage);
        
        const extractedId = extractOptimizationId(errorMessage);
        if (extractedId) {
          setInProgressOptimizationId(extractedId);
        }
      } else {
        setOptimizationError('Failed to get optimization recommendations');
      }
      
      return null;
    } finally {
      setOptimizationLoading(false);
    }
  };

  const applyOptimizationRecommendation = async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.applyOptimizationRecommendation(optimizationId);
      
      if (result.successful) {
        if (currentPortfolio) {
          await fetchPortfolioStocks(currentPortfolio.id);
        }
        setOptimization(null);
        setInProgressOptimizationId(null);
        return true;
      } else {
        setError(result.message || 'Failed to apply optimization');
        return false;
      }
    } catch (err) {
      console.error('Error applying optimization:', err);
      setError('Failed to apply optimization');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const cancelOptimization = async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.cancelOptimization(optimizationId);
      
      if (result.successful) {
        if (currentPortfolio) {
          await fetchPortfolioStocks(currentPortfolio.id);
        }
        
        if (inProgressOptimizationId === optimizationId) {
          setInProgressOptimizationId(null);
        }
        
        if (optimization?.optimizationId === optimizationId) {
          setOptimization(null);
        }
        
        return true;
      } else {
        setError(result.message || 'Failed to cancel optimization');
        return false;
      }
    } catch (err) {
      console.error('Error canceling optimization:', err);
      setError('Failed to cancel optimization');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const contextValue = {
    portfolios,
    currentPortfolio,
    portfolioStocks,
    optimization,
    optimizationLoading,
    optimizationError,
    inProgressOptimizationId,
    isLoading,
    error,
    fetchPortfolios,
    selectPortfolio,
    fetchPortfolioStocks,
    refreshPortfolio,
    getPortfolioOptimization,
    applyOptimizationRecommendation,
    cancelOptimization
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
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