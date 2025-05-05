import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { businessDomainService } from '../api/businessDomainService';
import { Transaction, CreateTransactionRequest, TransactionTrigger } from '../types/transactions';

// Define a type for grouped optimization transactions
export interface OptimizationTransactionGroup {
  optimizationId: string;
  transactions: Transaction[];
}

interface TransactionContextType {
  transactions: Transaction[];
  portfolioTransactions: Transaction[];
  optimizationGroups: OptimizationTransactionGroup[];
  isLoading: boolean;
  error: string | null;
  fetchUserTransactions: () => Promise<void>;
  fetchPortfolioTransactions: (portfolioId: string) => Promise<void>;
  createTransaction: (transaction: CreateTransactionRequest) => Promise<boolean>;
  cancelTransaction: (transactionId: string) => Promise<boolean>;
  cancelOptimization: (optimizationId: string) => Promise<boolean>;
}

// Initialize with empty values instead of undefined
const defaultContext: TransactionContextType = {
  transactions: [],
  portfolioTransactions: [],
  optimizationGroups: [],
  isLoading: false,
  error: null,
  fetchUserTransactions: async () => {},
  fetchPortfolioTransactions: async () => {},
  createTransaction: async () => false,
  cancelTransaction: async () => false,
  cancelOptimization: async () => false
};

// Create context with default values
const TransactionContext = createContext<TransactionContextType>(defaultContext);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioTransactions, setPortfolioTransactions] = useState<Transaction[]>([]);
  const [optimizationGroups, setOptimizationGroups] = useState<OptimizationTransactionGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add refs to track requests and prevent duplicate calls
  const pendingRequests = useRef<Record<string, boolean>>({});
  const lastFetchTimestamp = useRef<Record<string, number>>({});
  
  // Minimum time between duplicate requests in milliseconds
  const REQUEST_THROTTLE_TIME = 2000; // 2 seconds

  // Helper to group transactions by optimization ID
  const processOptimizationGroups = useCallback((transactionList: Transaction[]) => {
    // Find all optimization transactions
    const optimizationTransactions = transactionList.filter(
      t => t.triggeredBy === TransactionTrigger.Optimization && t.optimizationId
    );
    
    // Group by optimization ID
    const groupedById: Record<string, Transaction[]> = {};
    
    optimizationTransactions.forEach(transaction => {
      if (transaction.optimizationId) {
        if (!groupedById[transaction.optimizationId]) {
          groupedById[transaction.optimizationId] = [];
        }
        groupedById[transaction.optimizationId].push(transaction);
      }
    });
    
    // Convert to array of groups
    const groups: OptimizationTransactionGroup[] = Object.keys(groupedById).map(optimizationId => ({
      optimizationId,
      transactions: groupedById[optimizationId]
    }));
    
    setOptimizationGroups(groups);
  }, []);

  // Fetch all user transactions
  const fetchUserTransactions = useCallback(async () => {
    // Skip if we have a pending request
    if (pendingRequests.current['user']) {
      return;
    }
    
    // Check if we recently made this request
    const now = Date.now();
    const lastFetch = lastFetchTimestamp.current['user'] || 0;
    if (now - lastFetch < REQUEST_THROTTLE_TIME) {
      return;
    }
    
    // Mark this request as pending
    pendingRequests.current['user'] = true;
    lastFetchTimestamp.current['user'] = now;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await businessDomainService.getUserTransactions();
      setTransactions(data);
      processOptimizationGroups(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
      // Clear pending flag after a small delay to prevent immediate retry
      setTimeout(() => {
        pendingRequests.current['user'] = false;
      }, 500);
    }
  }, [processOptimizationGroups]);

  // Fetch transactions for a specific portfolio
  const fetchPortfolioTransactions = useCallback(async (portfolioId: string) => {
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
      const data = await businessDomainService.getPortfolioTransactions(portfolioId);
      setPortfolioTransactions(data);
      processOptimizationGroups(data);
    } catch (err) {
      console.error('Error fetching portfolio transactions:', err);
      setError('Failed to fetch portfolio transactions');
    } finally {
      setIsLoading(false);
      // Clear pending flag after a small delay to prevent immediate retry
      setTimeout(() => {
        pendingRequests.current[portfolioId] = false;
      }, 500);
    }
  }, [processOptimizationGroups]);

  // Create a new transaction
  const createTransaction = useCallback(async (transaction: CreateTransactionRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await businessDomainService.createTransaction(transaction);
      
      // Refresh the transactions for the portfolio
      await fetchPortfolioTransactions(transaction.portfolioId);
      
      // Also refresh all user transactions
      await fetchUserTransactions();
      
      return true;
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPortfolioTransactions, fetchUserTransactions]);

  // Cancel a transaction
  const cancelTransaction = useCallback(async (transactionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await businessDomainService.cancelTransaction(transactionId);
      
      // Refresh transactions after cancellation
      await fetchUserTransactions();
      
      // Also refresh portfolio transactions if we have any currently loaded
      if (portfolioTransactions.length > 0) {
        const portfolioId = portfolioTransactions[0].portfolioId;
        await fetchPortfolioTransactions(portfolioId);
      }
      
      return true;
    } catch (err) {
      console.error('Error cancelling transaction:', err);
      setError('Failed to cancel transaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserTransactions, fetchPortfolioTransactions, portfolioTransactions]);

  // Cancel an optimization
  const cancelOptimization = useCallback(async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.cancelOptimization(optimizationId);
      
      if (!result.successful) {
        setError(result.message);
        return false;
      }
      
      // Refresh transactions after cancellation
      await fetchUserTransactions();
      
      // Also refresh portfolio transactions if we have any currently loaded
      if (portfolioTransactions.length > 0) {
        const portfolioId = portfolioTransactions[0].portfolioId;
        await fetchPortfolioTransactions(portfolioId);
      }
      
      return true;
    } catch (err) {
      console.error('Error cancelling optimization:', err);
      setError('Failed to cancel optimization');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserTransactions, fetchPortfolioTransactions, portfolioTransactions]);

  // Load user transactions on mount
  useEffect(() => {
    fetchUserTransactions();
  }, [fetchUserTransactions]);

  const contextValue = {
    transactions,
    portfolioTransactions,
    optimizationGroups,
    isLoading,
    error,
    fetchUserTransactions,
    fetchPortfolioTransactions,
    createTransaction,
    cancelTransaction,
    cancelOptimization
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  return context;
}; 