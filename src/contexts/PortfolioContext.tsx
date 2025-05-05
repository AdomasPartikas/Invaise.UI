import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { businessDomainService, Portfolio, PortfolioStock, PortfolioOptimizationResult } from '../api/businessDomainService';
import { businessDomainApi } from '../api/api';

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

  // Add a ref to track in-progress requests
  const pendingRequests = useRef<Record<string, boolean>>({});
  const lastFetchTimestamp = useRef<Record<string, number>>({});
  
  // Minimum time between duplicate requests in milliseconds
  const REQUEST_THROTTLE_TIME = 2000; // 2 seconds

  // Extract optimization ID from error message
  const extractOptimizationId = (errorMessage: string): string | null => {
    const match = errorMessage.match(/Optimization ID: ([a-f0-9-]+)/i);
    return match ? match[1] : null;
  };

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
      
      // Reset optimization when changing portfolios
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

  // Fetch stocks for a portfolio
  const fetchPortfolioStocks = async (portfolioId: string) => {
    // Skip if we have a pending request for this portfolio
    if (pendingRequests.current[portfolioId]) {
      return;
    }
    
    // Check if we recently made this same request
    const now = Date.now();
    const lastFetch = lastFetchTimestamp.current[portfolioId] || 0;
    if (now - lastFetch < REQUEST_THROTTLE_TIME) {
      return;
    }
    
    // Mark this request as pending
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
      // Clear pending flag after a small delay to prevent immediate retry
      setTimeout(() => {
        pendingRequests.current[portfolioId] = false;
      }, 500);
    }
  };

  // Refresh portfolio to get latest Gaia prediction
  const refreshPortfolio = async (portfolioId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Request a new Gaia prediction for this portfolio
      const result = await businessDomainService.refreshPortfolio(portfolioId);
      
      if (result.success) {
        // Refresh the portfolio stocks after getting new prediction
        await fetchPortfolioStocks(portfolioId);
        return true;
      } else {
        console.warn('Failed to get new Gaia prediction:', result.message);
        return false;
      }
    } catch (err) {
      console.error('Error getting new Gaia prediction:', err);
      // We'll still continue even if getting a new prediction fails
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get portfolio optimization recommendation
  const getPortfolioOptimization = async (portfolioId?: string) => {
    setOptimizationLoading(true);
    setOptimizationError(null);
    try {
      // Use current portfolio ID if none provided
      const targetPortfolioId = portfolioId || currentPortfolio?.id;
      if (!targetPortfolioId) {
        throw new Error('No portfolio selected');
      }
      
      // First, ask Gaia for a fresh prediction for this portfolio
      try {
        console.log('Requesting fresh Gaia prediction before optimization...');
        await refreshPortfolio(targetPortfolioId);
      } catch (refreshErr) {
        console.warn('Failed to get fresh Gaia prediction before optimization, proceeding with existing data', refreshErr);
      }
      
      // Then get the optimization based on the latest prediction
      console.log('Getting portfolio optimization with latest Gaia prediction...');
      const result = await businessDomainService.getPortfolioOptimization(targetPortfolioId);
      
      // Process recommendations to ensure values are valid numbers
      if (result.recommendations && result.recommendations.length > 0) {
        result.recommendations = result.recommendations.map(rec => {
          // Use type assertion to access the raw properties from the API
          const rawRec = rec as any;
          const processedRec = {
            ...rec,
            // Use targetQuantity as recommendedQuantity if present
            currentQuantity: typeof rec.currentQuantity === 'number' && !isNaN(rec.currentQuantity) ? rec.currentQuantity : 0,
          };
          
          // Handle both targetQuantity and recommendedQuantity
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
      
      // Store the optimization result
      setOptimization(result);
      
      // Get the latest optimization from history if we need to
      if (!result.optimizationId) {
        try {
          console.log('Optimization missing ID, checking history for most recent optimization...');
          const history = await businessDomainService.getOptimizationHistory(targetPortfolioId);
          if (history && history.length > 0) {
            // Sort by timestamp descending to get the most recent one
            const sortedHistory = [...history].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            // Update with the latest optimization that has an ID
            const latestWithId = sortedHistory.find(item => item.optimizationId);
            if (latestWithId && latestWithId.optimizationId) {
              console.log(`Found optimization ID from history: ${latestWithId.optimizationId}`);
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
      
      // Special handling for conflict error (status 409)
      if (err.response && err.response.status === 409) {
        const errorMessage = err.response.data || "There is already an optimization in progress.";
        setOptimizationError(errorMessage);
        
        // Try to extract the optimization ID from the error message
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

  // Apply optimization recommendation
  const applyOptimizationRecommendation = async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.applyOptimizationRecommendation(optimizationId);
      
      if (result.successful) {
        // Refresh portfolio stocks after applying optimization
        if (currentPortfolio) {
          await fetchPortfolioStocks(currentPortfolio.id);
        }
        setOptimization(null); // Clear the optimization since it's been applied
        setInProgressOptimizationId(null); // Clear in-progress ID if set
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
  
  // Cancel an optimization
  const cancelOptimization = async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.cancelOptimization(optimizationId);
      
      if (result.successful) {
        // Refresh portfolio stocks after canceling optimization
        if (currentPortfolio) {
          await fetchPortfolioStocks(currentPortfolio.id);
        }
        
        // Clear optimizations
        if (inProgressOptimizationId === optimizationId) {
          setInProgressOptimizationId(null);
        }
        
        // If the current displayed optimization is the one being canceled, clear it
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