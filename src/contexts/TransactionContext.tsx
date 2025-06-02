import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { businessDomainService } from '../api/businessDomainService';
import { Transaction, CreateTransactionRequest, TransactionTrigger } from '../types/transactions';

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

const TransactionContext = createContext<TransactionContextType>(defaultContext);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioTransactions, setPortfolioTransactions] = useState<Transaction[]>([]);
  const [optimizationGroups, setOptimizationGroups] = useState<OptimizationTransactionGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const pendingRequests = useRef<Record<string, boolean>>({});
  const lastFetchTimestamp = useRef<Record<string, number>>({});
  
  const REQUEST_THROTTLE_TIME = 2000;

  const processOptimizationGroups = useCallback((transactionList: Transaction[]) => {
    const optimizationTransactions = transactionList.filter(
      t => t.triggeredBy === TransactionTrigger.Optimization && t.optimizationId
    );
    
    const groupedById: Record<string, Transaction[]> = {};
    
    optimizationTransactions.forEach(transaction => {
      if (transaction.optimizationId) {
        if (!groupedById[transaction.optimizationId]) {
          groupedById[transaction.optimizationId] = [];
        }
        groupedById[transaction.optimizationId].push(transaction);
      }
    });
    
    const groups: OptimizationTransactionGroup[] = Object.keys(groupedById).map(optimizationId => ({
      optimizationId,
      transactions: groupedById[optimizationId]
    }));
    
    setOptimizationGroups(groups);
  }, []);

  const fetchUserTransactions = useCallback(async () => {
    if (pendingRequests.current['user']) {
      return;
    }
    
    const now = Date.now();
    const lastFetch = lastFetchTimestamp.current['user'] || 0;
    if (now - lastFetch < REQUEST_THROTTLE_TIME) {
      return;
    }
    
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
      setTimeout(() => {
        pendingRequests.current['user'] = false;
      }, 500);
    }
  }, [processOptimizationGroups]);

  const fetchPortfolioTransactions = useCallback(async (portfolioId: string) => {
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
      const data = await businessDomainService.getPortfolioTransactions(portfolioId);
      setPortfolioTransactions(data);
      processOptimizationGroups(data);
    } catch (err) {
      console.error('Error fetching portfolio transactions:', err);
      setError('Failed to fetch portfolio transactions');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        pendingRequests.current[portfolioId] = false;
      }, 500);
    }
  }, [processOptimizationGroups]);

  const createTransaction = useCallback(async (transaction: CreateTransactionRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await businessDomainService.createTransaction(transaction);
      
      await fetchPortfolioTransactions(transaction.portfolioId);
      
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

  const cancelTransaction = useCallback(async (transactionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await businessDomainService.cancelTransaction(transactionId);
      
      await fetchUserTransactions();
      
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

  const cancelOptimization = useCallback(async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessDomainService.cancelOptimization(optimizationId);
      
      if (!result.successful) {
        setError(result.message);
        return false;
      }
      
      await fetchUserTransactions();
      
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