import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import StockTicker from '../components/dashboard/StockTicker';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';
import PortfolioHoldings from '../components/dashboard/PortfolioHoldings';
import { usePortfolio } from '../contexts/PortfolioContext';

const Dashboard: React.FC = () => {
  const { isLoading } = usePortfolio();

  return (
    <>
      <StockTicker />
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mt: 3 }}>
            <PortfolioOverview />
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <PortfolioHoldings />
          </Box>
        </>
      )}
    </>
  );
};

export default Dashboard; 