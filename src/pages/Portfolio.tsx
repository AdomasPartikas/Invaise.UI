import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Stack,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  ExpandMore,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioStocks,
  createPortfolioStock,
  updatePortfolioStock,
  deletePortfolioStock,
} from '../services/portfolioService';
import {
  Portfolio as PortfolioType,
  PortfolioStrategy,
  CreatePortfolioRequest,
  PortfolioStock,
  CreatePortfolioStockRequest,
  InvestmentType,
} from '../types/portfolio';
import { businessDomainService } from '../api/businessDomainService';

// Create a modified type that allows string values for quantity and investmentAmount
type StockFormData = Omit<CreatePortfolioStockRequest, 'quantity' | 'investmentAmount'> & {
  quantity: number | string;
  investmentAmount: number | string;
};

const Portfolio: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioType[]>([]);
  const [expandedPortfolio, setExpandedPortfolio] = useState<string | false>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [stocksLoading, setStocksLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [openPortfolioDialog, setOpenPortfolioDialog] = useState<boolean>(false);
  const [openStockDialog, setOpenStockDialog] = useState<boolean>(false);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioType | null>(null);
  const [currentPortfolio, setCurrentPortfolio] = useState<PortfolioType | null>(null);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [symbolsLoading, setSymbolsLoading] = useState<boolean>(false);
  
  const [portfolioFormData, setPortfolioFormData] = useState<CreatePortfolioRequest>({
    name: '',
    strategyDescription: PortfolioStrategy.Balanced,
  });
  
  const [stockFormData, setStockFormData] = useState<StockFormData>({
    portfolioId: '',
    symbol: '',
    quantity: '',
    currentTotalValue: 0,
    totalBaseValue: 0,
    percentageChange: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    investmentType: InvestmentType.Shares,
    investmentAmount: '',
  });
  
  const [editingStock, setEditingStock] = useState<PortfolioStock | null>(null);
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch portfolios on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolios();
      fetchSymbols();
    }
  }, [isAuthenticated]);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const response = await getPortfolios();
      setPortfolios(response.data);
      setError(null);
      
      // If a portfolio is expanded, also refresh its stocks
      if (expandedPortfolio) {
        fetchPortfolioStocks(expandedPortfolio.toString());
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError('Failed to load portfolios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbols = async () => {
    setSymbolsLoading(true);
    try {
      // Get all available stock symbols from the CompanyController endpoint
      const symbols = await businessDomainService.getAllUniqueSymbols();
      setAvailableSymbols(symbols);
    } catch (err) {
      console.error('Error fetching symbols:', err);
    } finally {
      setSymbolsLoading(false);
    }
  };

  const fetchPortfolioStocks = async (portfolioId: string) => {
    setStocksLoading(prev => ({ ...prev, [portfolioId]: true }));
    try {
      const response = await getPortfolioStocks(portfolioId);
      
      // Update the portfolio with the stocks
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(portfolio => 
          portfolio.id === portfolioId 
            ? { ...portfolio, portfolioStocks: response.data }
            : portfolio
        )
      );
    } catch (err) {
      console.error(`Error fetching stocks for portfolio ${portfolioId}:`, err);
      setSnackbar({
        open: true,
        message: 'Failed to load portfolio stocks',
        severity: 'error',
      });
    } finally {
      setStocksLoading(prev => ({ ...prev, [portfolioId]: false }));
    }
  };

  const handleAccordionChange = (portfolioId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPortfolio(isExpanded ? portfolioId : false);
    
    if (isExpanded) {
      fetchPortfolioStocks(portfolioId);
    }
  };

  // Portfolio Dialog Handlers
  const handleOpenPortfolioDialog = (portfolio?: PortfolioType) => {
    if (portfolio) {
      setEditingPortfolio(portfolio);
      setPortfolioFormData({
        name: portfolio.name,
        strategyDescription: portfolio.strategyDescription,
      });
    } else {
      setEditingPortfolio(null);
      setPortfolioFormData({
        name: '',
        strategyDescription: PortfolioStrategy.Balanced,
      });
    }
    setOpenPortfolioDialog(true);
  };

  const handleClosePortfolioDialog = () => {
    setOpenPortfolioDialog(false);
  };

  const handlePortfolioFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPortfolioFormData({
      ...portfolioFormData,
      [name]: value,
    });
  };

  const handlePortfolioSubmit = async () => {
    try {
      if (editingPortfolio) {
        // Update existing portfolio
        await updatePortfolio(editingPortfolio.id, portfolioFormData);
        setSnackbar({
          open: true,
          message: 'Portfolio updated successfully',
          severity: 'success',
        });
      } else {
        // Create new portfolio
        await createPortfolio(portfolioFormData);
        setSnackbar({
          open: true,
          message: 'Portfolio created successfully',
          severity: 'success',
        });
      }
      fetchPortfolios();
      handleClosePortfolioDialog();
    } catch (err) {
      console.error('Error saving portfolio:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${editingPortfolio ? 'update' : 'create'} portfolio`,
        severity: 'error',
      });
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await deletePortfolio(id);
        setSnackbar({
          open: true,
          message: 'Portfolio deleted successfully',
          severity: 'success',
        });
        fetchPortfolios();
      } catch (err) {
        console.error('Error deleting portfolio:', err);
        setSnackbar({
          open: true,
          message: 'Failed to delete portfolio',
          severity: 'error',
        });
      }
    }
  };

  // Stock Dialog Handlers
  const handleOpenStockDialog = (portfolio: PortfolioType, stock?: PortfolioStock) => {
    setCurrentPortfolio(portfolio);
    
    if (stock) {
      setEditingStock(stock);
      setStockFormData({
        portfolioId: portfolio.id,
        symbol: stock.symbol,
        quantity: stock.quantity,
        currentTotalValue: stock.currentTotalValue,
        totalBaseValue: stock.totalBaseValue,
        percentageChange: stock.percentageChange,
        purchaseDate: stock.purchaseDate || new Date().toISOString().split('T')[0],
        investmentType: stock.investmentType || InvestmentType.Shares,
        investmentAmount: stock.investmentAmount || '',
      });
    } else {
      setEditingStock(null);
      setStockFormData({
        portfolioId: portfolio.id,
        symbol: '',
        quantity: '',
        currentTotalValue: 0,
        totalBaseValue: 0,
        percentageChange: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        investmentType: InvestmentType.Shares,
        investmentAmount: '',
      });
    }
    setOpenStockDialog(true);
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setEditingStock(null);
  };

  const handleStockFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let newFormData = {
      ...stockFormData,
      [name]: name === 'quantity' || name === 'investmentAmount' 
        ? value === '' ? '' : Number(value) 
        : value,
    };
    
    // If investment type changes, reset quantity or investment amount
    if (name === 'investmentType') {
      if (value === InvestmentType.Shares) {
        newFormData.investmentAmount = '';
      } else if (value === InvestmentType.Money) {
        // Keep the quantity but we'll calculate it later based on price and investment amount
        newFormData.investmentAmount = '';
      }
    }
    
    setStockFormData(newFormData);
    
    // Fetch historical price data when symbol or purchase date changes
    if ((name === 'symbol' || name === 'purchaseDate' || name === 'quantity' || name === 'investmentAmount') && 
        newFormData.symbol && newFormData.purchaseDate) {
      const amountValue = (
        newFormData.investmentType === InvestmentType.Shares 
          ? (typeof newFormData.quantity === 'string' ? newFormData.quantity === '' ? 0 : Number(newFormData.quantity) : newFormData.quantity) 
          : (typeof newFormData.investmentAmount === 'string' ? newFormData.investmentAmount === '' ? 0 : Number(newFormData.investmentAmount) : newFormData.investmentAmount)
      );
      
      fetchHistoricalStockPrice(
        newFormData.symbol, 
        newFormData.purchaseDate, 
        newFormData.investmentType, 
        amountValue
      );
    }
  };

  const fetchHistoricalStockPrice = async (
    symbol: string, 
    date: string, 
    investmentType: InvestmentType, 
    amount: number
  ) => {
    if (!symbol || !date || amount <= 0) return;
    
    try {
      // Check if the selected date is today
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isToday = date === today;
      
      // Fetch historical price data for the purchase date
      const historicalData = await businessDomainService.getHistoricalMarketData(
        symbol, 
        date,  // Start date
        date   // End date
      );
      
      let historicalPrice = 0;
      let currentPrice = 0;
      let usedIntradayData = false;
      
      // Handle historical price (purchase date price)
      if (historicalData && historicalData.length > 0) {
        const priceData = historicalData[0];
        historicalPrice = priceData.close || 0;
      } else {
        // No historical data for the selected date
        if (!isToday) {
          // For past dates, we need historical data
          setSnackbar({
            open: true,
            message: `No historical data found for ${symbol} on ${date}. Try a different date.`,
            severity: 'warning',
          });
          return; // Don't proceed as we can't calculate without historical price
        } else {
          // For today, we can use intraday data for both historical and current
          const intradayData = await businessDomainService.getIntradayMarketData(symbol);
          if (intradayData && intradayData.length > 0) {
            historicalPrice = intradayData[0].current;
            usedIntradayData = true;
          } else {
            // No intraday data available for today
            setSnackbar({
              open: true,
              message: `No data available for ${symbol} today. Try a different date.`,
              severity: 'warning',
            });
            return;
          }
        }
      }
      
      // Fetch or determine current price
      if (isToday) {
        // For today's purchase, current price = historical price we just got
        currentPrice = historicalPrice;
      } else {
        // For past purchases, get the current price (today's price)
        const currentPriceData = await businessDomainService.getHistoricalMarketData(
          symbol,
          today,
          today
        );
        
        if (currentPriceData && currentPriceData.length > 0) {
          currentPrice = currentPriceData[0].close || 0;
        } else {
          // If we can't get today's historical data, use intraday
          const intradayData = await businessDomainService.getIntradayMarketData(symbol);
          if (intradayData && intradayData.length > 0) {
            currentPrice = intradayData[0].current;
            usedIntradayData = true;
          } else {
            // No data available for current price
            setSnackbar({
              open: true,
              message: `Could not determine current price for ${symbol}. Using estimated values.`,
              severity: 'warning',
            });
            // Use historical price as fallback
            currentPrice = historicalPrice;
          }
        }
      }
      
      // Calculate values based on prices
      let quantity: number = 0;
      let totalBaseValue: number = 0;
      let currentTotalValue: number = 0;
      let percentageChange: number = 0;
      
      if (investmentType === InvestmentType.Shares) {
        // User is buying a specific number of shares
        quantity = amount;
        totalBaseValue = historicalPrice * quantity;
        currentTotalValue = currentPrice * quantity;
      } else {
        // User is investing a specific amount of money
        const investmentAmount = amount;
        quantity = investmentAmount / historicalPrice;
        totalBaseValue = investmentAmount;
        currentTotalValue = quantity * currentPrice;
      }
      
      percentageChange = ((currentTotalValue - totalBaseValue) / totalBaseValue) * 100;
      
      setStockFormData(prev => ({
        ...prev,
        quantity,
        currentTotalValue: parseFloat(currentTotalValue.toFixed(2)),
        totalBaseValue: parseFloat(totalBaseValue.toFixed(2)),
        percentageChange: parseFloat(percentageChange.toFixed(2)),
      }));
      
      if (usedIntradayData) {
        setSnackbar({
          open: true,
          message: `Using latest real-time data for ${symbol} as today's closing data is not available yet.`,
          severity: 'info',
        });
      }
    } catch (error) {
      console.error('Error fetching historical stock price:', error);
      // If API call fails, use a fallback mock method
      setSnackbar({
        open: true,
        message: `Error fetching data for ${symbol}. Using estimated values.`,
        severity: 'error',
      });
      generateMockStockData(symbol, amount);
    }
  };

  // Fallback function if the API call fails
  const generateMockStockData = (symbol: string, amount: number) => {
    try {
      // Mock implementation for demonstration or fallback
      const mockCurrentPrice = Math.random() * 500 + 50; // Random price between $50-550
      const mockBasePrice = mockCurrentPrice * (1 - (Math.random() * 0.2 - 0.1)); // Base price +/- 10%
      
      let quantity: number = 0;
      let currentTotalValue: number = 0;
      let totalBaseValue: number = 0;
      
      if (stockFormData.investmentType === InvestmentType.Shares) {
        quantity = amount;
        currentTotalValue = mockCurrentPrice * quantity;
        totalBaseValue = mockBasePrice * quantity;
      } else {
        const investmentAmount = amount;
        quantity = investmentAmount / mockBasePrice;
        totalBaseValue = investmentAmount;
        currentTotalValue = quantity * mockCurrentPrice;
      }
      
      const percentageChange = ((currentTotalValue - totalBaseValue) / totalBaseValue) * 100;
      
      setStockFormData(prev => ({
        ...prev,
        quantity,
        currentTotalValue: parseFloat(currentTotalValue.toFixed(2)),
        totalBaseValue: parseFloat(totalBaseValue.toFixed(2)),
        percentageChange: parseFloat(percentageChange.toFixed(2)),
      }));
    } catch (error) {
      console.error('Error generating mock stock data:', error);
    }
  };

  const handleStockSubmit = async () => {
    if (!currentPortfolio) return;
    
    // Convert string quantities to numbers for submission
    const quantityValue = typeof stockFormData.quantity === 'string' ? 
      (stockFormData.quantity === '' ? 0 : Number(stockFormData.quantity)) : 
      stockFormData.quantity;
      
    const investmentAmountValue = typeof stockFormData.investmentAmount === 'string' ? 
      (stockFormData.investmentAmount === '' ? 0 : Number(stockFormData.investmentAmount)) : 
      stockFormData.investmentAmount;
    
    try {
      if (editingStock) {
        // Update existing stock
        await updatePortfolioStock(editingStock.id, {
          quantity: quantityValue,
          currentTotalValue: stockFormData.currentTotalValue,
          totalBaseValue: stockFormData.totalBaseValue,
          percentageChange: stockFormData.percentageChange,
          purchaseDate: stockFormData.purchaseDate,
          investmentType: stockFormData.investmentType,
          investmentAmount: investmentAmountValue,
        });
        setSnackbar({
          open: true,
          message: 'Stock updated successfully',
          severity: 'success',
        });
      } else {
        // Create new stock
        await createPortfolioStock({
          ...stockFormData,
          quantity: quantityValue,
          investmentAmount: investmentAmountValue,
        });
        setSnackbar({
          open: true,
          message: 'Stock added successfully',
          severity: 'success',
        });
      }
      // Refresh the stocks in the portfolio
      fetchPortfolioStocks(currentPortfolio.id);
      handleCloseStockDialog();
    } catch (err) {
      console.error('Error saving stock:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${editingStock ? 'update' : 'add'} stock`,
        severity: 'error',
      });
    }
  };

  const handleDeleteStock = async (portfolioId: string, stockId: string) => {
    if (window.confirm('Are you sure you want to delete this stock?')) {
      try {
        await deletePortfolioStock(stockId);
        setSnackbar({
          open: true,
          message: 'Stock removed successfully',
          severity: 'success',
        });
        // Refresh the stocks in the portfolio
        fetchPortfolioStocks(portfolioId);
      } catch (err) {
        console.error('Error deleting stock:', err);
        setSnackbar({
          open: true,
          message: 'Failed to remove stock',
          severity: 'error',
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper function to get a color based on portfolio strategy
  const getStrategyColor = (strategy: PortfolioStrategy) => {
    switch (strategy) {
      case PortfolioStrategy.Aggressive:
        return 'error';
      case PortfolioStrategy.Growth:
        return 'warning';
      case PortfolioStrategy.Balanced:
        return 'info';
      case PortfolioStrategy.Income:
        return 'success';
      case PortfolioStrategy.Conservative:
        return 'default';
      default:
        return 'default';
    }
  };

  // Calculate portfolio statistics
  const calculatePortfolioStats = (portfolio: PortfolioType) => {
    const stocks = portfolio.portfolioStocks || [];
    
    const totalCurrentValue = stocks.reduce((sum, stock) => sum + stock.currentTotalValue, 0);
    const totalBaseValue = stocks.reduce((sum, stock) => sum + stock.totalBaseValue, 0);
    const totalGainLoss = totalCurrentValue - totalBaseValue;
    const percentageChange = totalBaseValue > 0 
      ? (totalGainLoss / totalBaseValue) * 100 
      : 0;
    
    return {
      totalCurrentValue,
      totalBaseValue,
      totalGainLoss,
      percentageChange,
      stockCount: stocks.length,
    };
  };

  if (loading && portfolios.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Your Portfolios
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            onClick={fetchPortfolios}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenPortfolioDialog()}
          >
            New Portfolio
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {portfolios.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You don't have any portfolios yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create your first portfolio to start tracking your investments
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenPortfolioDialog()}
          >
            Create Portfolio
          </Button>
        </Paper>
      ) : (
        <Box>
          {portfolios.map((portfolio) => {
            const stats = calculatePortfolioStats(portfolio);
            
            return (
              <Accordion 
                key={portfolio.id}
                expanded={expandedPortfolio === portfolio.id}
                onChange={handleAccordionChange(portfolio.id)}
                sx={{
                  mb: 2,
                  '&::before': { display: 'none' }, // Remove the default disclosure bar
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`panel-${portfolio.id}-content`}
                  id={`panel-${portfolio.id}-header`}
                  sx={{ 
                    px: 2, 
                    py: 1,
                    '&.Mui-expanded': {
                      borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                    }
                  }}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                          {portfolio.name}
                        </Typography>
                        <Chip
                          label={portfolio.strategyDescription}
                          color={getStrategyColor(portfolio.strategyDescription) as any}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Grid>
                    <Grid sx={{ gridColumn: { xs: 'span 3', md: 'span 2' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {stats.stockCount} Stocks
                      </Typography>
                    </Grid>
                    <Grid sx={{ gridColumn: { xs: 'span 3', md: 'span 3' } }}>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        ${stats.totalCurrentValue.toFixed(2)}
                      </Typography>
                      <Box display="flex" alignItems="center">
                        {stats.totalGainLoss >= 0 ? (
                          <>
                            <TrendingUp fontSize="small" color="success" />
                            <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                              +${stats.totalGainLoss.toFixed(2)} (+{stats.percentageChange.toFixed(2)}%)
                            </Typography>
                          </>
                        ) : (
                          <>
                            <TrendingDown fontSize="small" color="error" />
                            <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                              ${stats.totalGainLoss.toFixed(2)} ({stats.percentageChange.toFixed(2)}%)
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                    <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' }, display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPortfolioDialog(portfolio);
                        }}
                        aria-label="edit"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePortfolio(portfolio.id);
                        }}
                        aria-label="delete"
                        sx={{ ml: 1 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  {stocksLoading[portfolio.id] ? (
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress />
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Portfolio Details</Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                            <Paper sx={{ p: 2, borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Total Value
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                                ${stats.totalCurrentValue.toFixed(2)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                            <Paper sx={{ p: 2, borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Investment Cost
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                                ${stats.totalBaseValue.toFixed(2)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                            <Paper sx={{ p: 2, borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Total Gain/Loss
                              </Typography>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  mt: 1,
                                  color: stats.totalGainLoss >= 0 ? 'success.main' : 'error.main'
                                }}
                              >
                                {stats.totalGainLoss >= 0 ? '+' : ''}${stats.totalGainLoss.toFixed(2)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                            <Paper sx={{ p: 2, borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Performance
                              </Typography>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  mt: 1,
                                  color: stats.percentageChange >= 0 ? 'success.main' : 'error.main'
                                }}
                              >
                                {stats.percentageChange >= 0 ? '+' : ''}{stats.percentageChange.toFixed(2)}%
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Holdings</Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleOpenStockDialog(portfolio)}
                        >
                          Add Stock
                        </Button>
                      </Box>
                      
                      {portfolio.portfolioStocks && portfolio.portfolioStocks.length > 0 ? (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Symbol</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Base Cost</TableCell>
                                <TableCell align="right">Current Value</TableCell>
                                <TableCell align="right">Gain/Loss</TableCell>
                                <TableCell align="right">Change %</TableCell>
                                <TableCell align="right">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {portfolio.portfolioStocks.map((stock) => {
                                const gainLoss = stock.currentTotalValue - stock.totalBaseValue;
                                const gainLossPercent = stock.percentageChange;
                                
                                return (
                                  <TableRow key={stock.id}>
                                    <TableCell component="th" scope="row">
                                      <Typography variant="body2" fontWeight="medium">
                                        {stock.symbol}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      {stock.quantity}
                                    </TableCell>
                                    <TableCell align="right">
                                      ${stock.totalBaseValue.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">
                                      ${stock.currentTotalValue.toFixed(2)}
                                    </TableCell>
                                    <TableCell 
                                      align="right"
                                      sx={{ color: gainLoss >= 0 ? 'success.main' : 'error.main' }}
                                    >
                                      {gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(2)}
                                    </TableCell>
                                    <TableCell 
                                      align="right"
                                      sx={{ color: gainLossPercent >= 0 ? 'success.main' : 'error.main' }}
                                    >
                                      {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                                    </TableCell>
                                    <TableCell align="right">
                                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenStockDialog(portfolio, stock)}
                                        >
                                          <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDeleteStock(portfolio.id, stock.id)}
                                        >
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                          <Typography variant="body1" color="text.secondary">
                            This portfolio doesn't have any stocks yet.
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Add />}
                            sx={{ mt: 2 }}
                            onClick={() => handleOpenStockDialog(portfolio)}
                          >
                            Add Your First Stock
                          </Button>
                        </Paper>
                      )}
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Create/Edit Portfolio Dialog */}
      <Dialog open={openPortfolioDialog} onClose={handleClosePortfolioDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPortfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Portfolio Name"
            type="text"
            fullWidth
            variant="outlined"
            value={portfolioFormData.name}
            onChange={handlePortfolioFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            name="strategyDescription"
            label="Investment Strategy"
            fullWidth
            variant="outlined"
            value={portfolioFormData.strategyDescription}
            onChange={handlePortfolioFormChange}
          >
            {Object.values(PortfolioStrategy).map((strategy) => (
              <MenuItem key={strategy} value={strategy}>
                {strategy}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePortfolioDialog}>Cancel</Button>
          <Button onClick={handlePortfolioSubmit} variant="contained" color="primary">
            {editingPortfolio ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Stock Dialog */}
      <Dialog open={openStockDialog} onClose={handleCloseStockDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStock ? 'Edit Stock' : 'Add Stock to Portfolio'}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            name="symbol"
            label="Stock Symbol"
            fullWidth
            variant="outlined"
            value={stockFormData.symbol}
            onChange={handleStockFormChange}
            disabled={!!editingStock}
            sx={{ mb: 2 }}
          >
            {symbolsLoading ? (
              <MenuItem disabled>Loading symbols...</MenuItem>
            ) : (
              availableSymbols.map((symbol) => (
                <MenuItem key={symbol} value={symbol}>
                  {symbol}
                </MenuItem>
              ))
            )}
          </TextField>
          
          <TextField
            margin="dense"
            name="purchaseDate"
            label="Purchase Date"
            type="date"
            fullWidth
            variant="outlined"
            value={stockFormData.purchaseDate}
            onChange={handleStockFormChange}
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <FormLabel component="legend">Investment Type</FormLabel>
            <RadioGroup
              row
              name="investmentType"
              value={stockFormData.investmentType}
              onChange={handleStockFormChange}
            >
              <FormControlLabel 
                value={InvestmentType.Shares} 
                control={<Radio />} 
                label="Buy specific number of shares" 
              />
              <FormControlLabel 
                value={InvestmentType.Money} 
                control={<Radio />} 
                label="Invest a specific amount" 
              />
            </RadioGroup>
          </FormControl>
          
          {stockFormData.investmentType === InvestmentType.Shares ? (
            <TextField
              margin="dense"
              name="quantity"
              label="Number of Shares"
              type="number"
              fullWidth
              variant="outlined"
              value={stockFormData.quantity === 0 ? '' : stockFormData.quantity}
              onChange={handleStockFormChange}
              sx={{ mb: 2 }}
              InputProps={{
                inputProps: { min: 0, step: 0.0001 }
              }}
            />
          ) : (
            <TextField
              margin="dense"
              name="investmentAmount"
              label="Investment Amount ($)"
              type="number"
              fullWidth
              variant="outlined"
              value={stockFormData.investmentAmount === 0 ? '' : stockFormData.investmentAmount}
              onChange={handleStockFormChange}
              sx={{ mb: 2 }}
              InputProps={{
                inputProps: { min: 0, step: 0.01 },
                startAdornment: <Typography variant="body2">$</Typography>,
              }}
            />
          )}
          
          <Divider sx={{ my: 2 }}>
            <Chip label="Calculated Values" />
          </Divider>
          <Grid container spacing={2}>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                margin="dense"
                name="totalBaseValue"
                label="Purchase Value"
                type="number"
                fullWidth
                variant="outlined"
                value={stockFormData.totalBaseValue}
                InputProps={{
                  readOnly: true,
                  startAdornment: <Typography variant="body2">$</Typography>,
                }}
                disabled
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                margin="dense"
                name="currentTotalValue"
                label="Current Value"
                type="number"
                fullWidth
                variant="outlined"
                value={stockFormData.currentTotalValue}
                InputProps={{
                  readOnly: true,
                  startAdornment: <Typography variant="body2">$</Typography>,
                }}
                disabled
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                margin="dense"
                name="percentageChange"
                label="Percentage Change"
                type="number"
                fullWidth
                variant="outlined"
                value={stockFormData.percentageChange}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="body2">%</Typography>,
                }}
                disabled
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                margin="dense"
                name="finalQuantity"
                label="Final Share Quantity"
                type="number"
                fullWidth
                variant="outlined"
                value={typeof stockFormData.quantity === 'string' && stockFormData.quantity === '' 
                  ? '0' 
                  : stockFormData.quantity}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStockDialog}>Cancel</Button>
          <Button 
            onClick={handleStockSubmit} 
            variant="contained" 
            color="primary"
            disabled={!stockFormData.symbol || (typeof stockFormData.quantity === 'string' ? stockFormData.quantity === '' : stockFormData.quantity <= 0)}
          >
            {editingStock ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Portfolio;