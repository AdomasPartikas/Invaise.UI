import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessDomainService } from '../api/businessDomainService';

interface MarketStatusContextType {
  isMarketOpen: boolean;
  isLoading: boolean;
  checkMarketStatus: () => Promise<boolean>;
}

const defaultContext: MarketStatusContextType = {
  isMarketOpen: true,
  isLoading: false,
  checkMarketStatus: async () => true
};

const MarketStatusContext = createContext<MarketStatusContextType>(defaultContext);

export const MarketStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number>(0);

  const checkMarketStatus = async (force = false) => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastChecked;
    
    if (!force && timeSinceLastCheck < 30000 && lastChecked !== 0) {
      return isMarketOpen;
    }
    
    setIsLoading(true);
    try {
      const isOpen = await businessDomainService.isMarketOpen();

      if (isMarketOpen !== isOpen) {
        setIsMarketOpen(isOpen);
      }
      
      setLastChecked(now);
      return isOpen;
    } catch (err) {
      console.error('MarketStatus: Error checking market status:', err);
      setLastChecked(now);
      
      if (isMarketOpen) {
        setIsMarketOpen(false);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkMarketStatus(true);
    
    const interval = setInterval(() => {
      checkMarketStatus(true);
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const contextValue = {
    isMarketOpen,
    isLoading,
    checkMarketStatus: () => checkMarketStatus(true)
  };

  return (
    <MarketStatusContext.Provider value={contextValue}>
      {children}
    </MarketStatusContext.Provider>
  );
};

export const useMarketStatus = () => {
  const context = useContext(MarketStatusContext);
  return context;
}; 