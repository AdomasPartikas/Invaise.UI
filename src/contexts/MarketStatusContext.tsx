import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessDomainService } from '../api/businessDomainService';

interface MarketStatusContextType {
  isMarketOpen: boolean;
  isLoading: boolean;
  checkMarketStatus: () => Promise<boolean>;
}

// Default context values
const defaultContext: MarketStatusContextType = {
  isMarketOpen: true, // Default to open to avoid showing closed messages unnecessarily
  isLoading: false,
  checkMarketStatus: async () => true
};

// Create the context
const MarketStatusContext = createContext<MarketStatusContextType>(defaultContext);

export const MarketStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number>(0);

  // Function to check if market is open
  const checkMarketStatus = async (force = false) => {
    // Throttle checks to prevent excessive API calls
    const now = Date.now();
    const timeSinceLastCheck = now - lastChecked;
    
    // Don't check if we checked in the last 30 seconds and not forced
    if (!force && timeSinceLastCheck < 30000 && lastChecked !== 0) {
      console.log(`MarketStatus: Skipping check (checked ${Math.round(timeSinceLastCheck/1000)}s ago)`);
      return isMarketOpen;
    }
    
    console.log("MarketStatus: Checking market status...");
    setIsLoading(true);
    try {
      // Use the dedicated market status check endpoint
      const isOpen = await businessDomainService.isMarketOpen();
      console.log(`MarketStatus: Market status is ${isOpen ? "OPEN" : "CLOSED"}`);
      
      // Only update state if there's a change to prevent rerenders
      if (isMarketOpen !== isOpen) {
        console.log(`MarketStatus: Updating market status from ${isMarketOpen ? "OPEN" : "CLOSED"} to ${isOpen ? "OPEN" : "CLOSED"}`);
        setIsMarketOpen(isOpen);
      }
      
      setLastChecked(now);
      return isOpen;
    } catch (err) {
      console.error('MarketStatus: Error checking market status:', err);
      setLastChecked(now);
      
      // Only update on error if we were previously showing open
      if (isMarketOpen) {
        console.log("MarketStatus: Setting market to CLOSED due to error");
        setIsMarketOpen(false);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check market status on mount and periodically
  useEffect(() => {
    console.log("MarketStatus: Component mounted, performing initial check");
    
    // Immediately check when component mounts
    checkMarketStatus(true);
    
    // Set up regular interval checks - check every 5 minutes
    // This is a reasonable interval since the market status doesn't change frequently
    const interval = setInterval(() => {
      console.log("MarketStatus: Performing scheduled check");
      checkMarketStatus(true);
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const contextValue = {
    isMarketOpen,
    isLoading,
    checkMarketStatus: () => checkMarketStatus(true) // Force update when called externally
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