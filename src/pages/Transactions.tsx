import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Tabs, 
  Tab, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  CircularProgress, 
  SelectChangeEvent,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Add, Close, Refresh, Cancel } from '@mui/icons-material';
import { useTransaction } from '../contexts/TransactionContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { businessDomainService } from '../api/businessDomainService';
import { TransactionType } from '../types/transactions';
import { useNotification } from '../context/NotificationContext';
import { useMarketStatus } from '../contexts/MarketStatusContext';

class TransactionsErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in Transactions component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3} color="error.main">
          <Typography variant="h4">Something went wrong</Typography>
          <Typography variant="body1">Error: {this.state.error && this.state.error.toString()}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

const TransactionsContainer = () => {
  return (
    <TransactionsErrorBoundary>
      <Transactions />
    </TransactionsErrorBoundary>
  );
};

const createStockMap = (stocks: any[]): Record<string, number> => {
  const stockMap: Record<string, number> = {};
  stocks.forEach(stock => {
    stockMap[stock.symbol] = stock.quantity;
  });
  return stockMap;
};

const Transactions: React.FC = () => {
  const { transactions, portfolioTransactions, isLoading, error, fetchUserTransactions, fetchPortfolioTransactions, cancelTransaction, createTransaction, optimizationGroups, cancelOptimization } = useTransaction();
  const { portfolios, currentPortfolio, portfolioStocks, fetchPortfolioStocks, fetchPortfolios } = usePortfolio();
  const { addNotification } = useNotification();
  const { isMarketOpen } = useMarketStatus();
  
  const [activeTab, setActiveTab] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  
  const [shouldUpdateCalculations, setShouldUpdateCalculations] = useState(false);
  
  const portfolioIdRef = useRef<string>('');
  const lastTransactionRequestTime = useRef<number>(0);
  const portfolioLoadingRef = useRef<boolean>(false);
  const lastPortfolioFetchRef = useRef<number>(0);
  
  const [formData, setFormData] = useState({
    portfolioId: currentPortfolio?.id || '',
    symbol: '',
    quantity: 1,
    pricePerShare: 100,
    type: TransactionType.Buy,
    investmentAmount: 100,
    investmentType: 'Shares' as 'Shares' | 'Amount'
  });
  
  const [ownedStocks, setOwnedStocks] = useState<Record<string, number>>({});
  
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    const fetchSymbols = async () => {
      setIsLoadingSymbols(true);
      try {
        const symbols = await businessDomainService.getAllUniqueSymbols();
        setAvailableSymbols(symbols);
      } catch (err) {
        console.error('Error fetching symbols:', err);
        addNotification('error', 'Failed to load stock symbols');
      } finally {
        setIsLoadingSymbols(false);
      }
    };
    
    fetchSymbols();
  }, [addNotification]);
  
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastTransactionRequestTime.current < 1000) {
      return;
    }
    
    lastTransactionRequestTime.current = now;
    
    if (activeTab === 0) {
      fetchUserTransactions();
    } else if (activeTab === 1) {
      if (selectedPortfolioId) {
        fetchPortfolioTransactions(selectedPortfolioId);
      } else if (currentPortfolio) {
        fetchPortfolioTransactions(currentPortfolio.id);
        setSelectedPortfolioId(currentPortfolio.id);
      }
    }
  }, [activeTab, currentPortfolio?.id, selectedPortfolioId, fetchUserTransactions, fetchPortfolioTransactions]);
  
  useEffect(() => {
    const now = Date.now();
    
    if (activeTab === 1 && (!portfolios || portfolios.length === 0) && 
        !portfolioLoadingRef.current && now - lastPortfolioFetchRef.current > 2000) {
      portfolioLoadingRef.current = true;
      lastPortfolioFetchRef.current = now;
      
      fetchPortfolios()
        .finally(() => {
          portfolioLoadingRef.current = false;
        });
    }
  }, [activeTab, portfolios, fetchPortfolios]);

  useEffect(() => {
    if (activeTab === 1 && portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(currentPortfolio?.id || portfolios[0].id);
    }
  }, [activeTab, portfolios, currentPortfolio, selectedPortfolioId]);
  
  useEffect(() => {
    if (currentPortfolio) {
      setFormData(prevData => {
        if (prevData.portfolioId !== currentPortfolio.id) {
          return {
            ...prevData,
            portfolioId: currentPortfolio.id
          };
        }
        return prevData;
      });
    }
  }, [currentPortfolio]);
  
  const updateOwnedStocks = useCallback(() => {
    setOwnedStocks(createStockMap(portfolioStocks));
  }, [portfolioStocks]);
  
  useEffect(() => {
    if (formData.portfolioId && formData.portfolioId !== portfolioIdRef.current) {
      portfolioIdRef.current = formData.portfolioId;
      
      fetchPortfolioStocks(formData.portfolioId)
        .catch(err => {
          console.warn('Failed to fetch portfolio stocks:', err);
        });
    }
  }, [formData.portfolioId, fetchPortfolioStocks]);
  
  useEffect(() => {
    updateOwnedStocks();
  }, [updateOwnedStocks]);
  
  useEffect(() => {
    if (!shouldUpdateCalculations || !latestPrice || latestPrice <= 0) return;
    
    if (formData.investmentType === 'Amount' && formData.investmentAmount > 0) {
      const calculatedQuantity = formData.investmentAmount / latestPrice;
      setFormData(prevData => ({
        ...prevData,
        quantity: Number(calculatedQuantity.toFixed(4))
      }));
    } else if (formData.investmentType === 'Shares' && formData.quantity > 0) {
      const calculatedAmount = formData.quantity * latestPrice;
      setFormData(prevData => ({
        ...prevData,
        investmentAmount: Number(calculatedAmount.toFixed(2))
      }));
    }
    
    setShouldUpdateCalculations(false);
  }, [shouldUpdateCalculations, latestPrice, formData.investmentType, formData.investmentAmount, formData.quantity]);
  
  const fetchLatestPrice = useCallback(async (symbol: string) => {
    if (!symbol) {
      setLatestPrice(null);
      return;
    }
    
    setIsLoadingPrice(true);
    try {
      let price = 0;
      
      try {
        const latestData = await businessDomainService.getLatestHistoricalMarketData(symbol, 1);
        if (latestData && latestData.length > 0 && latestData[0].close) {
          price = latestData[0].close;
        }
      } catch (apiErr) {
        console.error('Error fetching price from API:', apiErr);
        
        const existingStock = portfolioStocks.find(stock => stock.symbol === symbol);
        if (existingStock && existingStock.currentTotalValue && existingStock.quantity) {
          price = existingStock.currentTotalValue / existingStock.quantity;
        } else {
          price = 100;
        }
      }
      
      setLatestPrice(price);
      return price;
    } catch (err) {
      console.error('Error fetching latest price:', err);
      addNotification('error', 'Failed to fetch latest price');
      setLatestPrice(null);
      return null;
    } finally {
      setIsLoadingPrice(false);
    }
  }, [portfolioStocks, addNotification]);
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);
  
  const handleStatusFilterChange = useCallback((event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
  }, []);
  
  const handleCancelTransaction = async (transactionId: string, optimizationId?: string) => {
    setProcessing(true);
    
    try {
      let success = false;
      
      if (optimizationId) {
        success = await cancelOptimization(optimizationId);
        if (success) {
          addNotification('success', 'Optimization and associated transactions canceled successfully');
        } else {
          addNotification('error', 'Failed to cancel optimization');
        }
      } else {
        success = await cancelTransaction(transactionId);
        if (success) {
          addNotification('success', 'Transaction canceled successfully');
        } else {
          addNotification('error', 'Failed to cancel transaction');
        }
      }
      
      if (success) {
        if (activeTab === 0) {
          fetchUserTransactions();
        } else if (activeTab === 1 && selectedPortfolioId) {
          fetchPortfolioTransactions(selectedPortfolioId);
        }
      }
    } catch (error) {
      console.error('Error canceling transaction:', error);
      addNotification('error', 'Failed to cancel transaction');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleOpenCreateDialog = useCallback(() => {
    setFormData({
      portfolioId: currentPortfolio?.id || '',
      symbol: '',
      quantity: 1,
      pricePerShare: 100,
      type: TransactionType.Buy,
      investmentAmount: 100,
      investmentType: 'Shares'
    });
    
    setLatestPrice(null);
    
    setOpenCreateDialog(true);
  }, [currentPortfolio]);
  
  const handleCloseCreateDialog = useCallback(() => {
    setOpenCreateDialog(false);
  }, []);
  
  const handleFormChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<unknown>
  ) => {
    const name = event.target.name as string;
    const value = event.target.value;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: (name === 'quantity' || name === 'pricePerShare' || name === 'investmentAmount') 
          ? Number(value) 
          : value
      };
      
      if (name === 'investmentType') {
        if (value === 'Shares') {
          updatedData.quantity = 1;
          updatedData.investmentAmount = 0;
        } else {
          updatedData.investmentAmount = 100;
          updatedData.quantity = 0;
        }
      }
      
      if (name === 'symbol' && value) {
        updatedData.quantity = 1;
        updatedData.investmentAmount = 100;
        
        fetchLatestPrice(value as string).then(price => {
          if (price) {
            setFormData(currentData => ({
              ...currentData,
              pricePerShare: price
            }));
            
            setShouldUpdateCalculations(true);
          }
        });
      }
      
      if ((name === 'quantity' && updatedData.investmentType === 'Shares') || 
          (name === 'investmentAmount' && updatedData.investmentType === 'Amount')) {
        setTimeout(() => setShouldUpdateCalculations(true), 0);
      }
      
      return updatedData;
    });
  }, [fetchLatestPrice]);
  
  const handleCreateTransaction = useCallback(async () => {
    try {
      if (!formData.portfolioId) {
        addNotification('error', 'Please select a portfolio');
        return;
      }
      
      if (!formData.symbol) {
        addNotification('error', 'Please select a symbol');
        return;
      }
      
      if (formData.quantity <= 0) {
        addNotification('error', 'Quantity must be greater than 0');
        return;
      }
      
      if (formData.pricePerShare <= 0) {
        addNotification('error', 'Price per share must be greater than 0');
        return;
      }
      
      if (formData.type === TransactionType.Sell) {
        const ownedQuantity = ownedStocks[formData.symbol] || 0;
        if (formData.quantity > ownedQuantity) {
          addNotification('error', `You only own ${ownedQuantity} shares of ${formData.symbol}`);
          return;
        }
      }
      
      const transactionData = {
        portfolioId: formData.portfolioId,
        symbol: formData.symbol,
        quantity: formData.quantity,
        pricePerShare: formData.pricePerShare,
        type: formData.type
      };
      
      const success = await createTransaction(transactionData);
      
      if (success) {
        if (!isMarketOpen) {
          addNotification('warning', 'The market is currently closed. Your transaction has been created but will be put on hold until the market reopens.');
        } else {
          addNotification('success', 'Transaction created successfully');
        }
        handleCloseCreateDialog();
      } else {
        addNotification('error', 'Failed to create transaction');
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      addNotification('error', 'An error occurred while creating the transaction');
    }
  }, [formData, createTransaction, addNotification, handleCloseCreateDialog, ownedStocks, isMarketOpen]);
  
  const filteredTransactions = useMemo(() => {
    
    const matchesFilter = (t: any) => {
      if (statusFilter === 'all') return true;
      return String(t.status) === statusFilter;
    };
    
    return activeTab === 0
      ? transactions.filter(matchesFilter)
      : portfolioTransactions.filter(matchesFilter);
  }, [activeTab, statusFilter, transactions, portfolioTransactions]);
  
  const handleRetry = useCallback(() => {
    if (activeTab === 0) {
      fetchUserTransactions();
    } else if (activeTab === 1 && selectedPortfolioId) {
      fetchPortfolioTransactions(selectedPortfolioId);
    }
  }, [activeTab, selectedPortfolioId, fetchUserTransactions, fetchPortfolioTransactions]);
  
  const getQuantityOptions = useCallback(() => {
    if (formData.type === TransactionType.Sell) {
      const ownedQuantity = ownedStocks[formData.symbol] || 0;
      if (ownedQuantity === 0) return [1];
      
      return [
        Math.max(1, Math.ceil(ownedQuantity * 0.25)),
        Math.max(1, Math.ceil(ownedQuantity * 0.5)),
        Math.max(1, Math.ceil(ownedQuantity * 0.75)),
        Math.max(1, ownedQuantity)
      ];
    }
    
    return [1, 5, 10, 25, 50, 100];
  }, [formData.type, formData.symbol, ownedStocks]);
  
  const getAmountOptions = useCallback(() => {
    if (!latestPrice) return [100, 500, 1000, 2500, 5000, 10000];
    
    if (formData.type === TransactionType.Sell) {
      const ownedQuantity = ownedStocks[formData.symbol] || 0;
      if (ownedQuantity === 0) return [100];
      
      const totalValue = ownedQuantity * latestPrice;
      
      return [
        Math.max(100, Math.ceil(totalValue * 0.25)),
        Math.max(100, Math.ceil(totalValue * 0.5)),
        Math.max(100, Math.ceil(totalValue * 0.75)),
        Math.max(100, Math.ceil(totalValue))
      ];
    }
    
    return [100, 500, 1000, 2500, 5000, 10000];
  }, [latestPrice, formData.type, formData.symbol, ownedStocks]);
  
  const isQuantityValid = useCallback((quantity: number): boolean => {
    return Number.isInteger(quantity) && quantity > 0;
  }, []);

  const isAmountValid = useCallback((amount: number): boolean => {
    return !isNaN(amount) && amount > 0;
  }, []);
  
  const handlePortfolioChange = useCallback((event: SelectChangeEvent<string>) => {
    const newPortfolioId = event.target.value;
    setSelectedPortfolioId(newPortfolioId);
    fetchPortfolioTransactions(newPortfolioId);
  }, [fetchPortfolioTransactions]);
  
  return (
    <Box p={3} maxWidth="1200px" margin="0 auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Transactions</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          New Transaction
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Transactions" />
          <Tab 
            label="Portfolio Transactions" 
            disabled={!portfolios || portfolios.length === 0}
          />
        </Tabs>
      </Paper>
      
      <Box display="flex" justifyContent={activeTab === 1 ? "space-between" : "flex-end"} mb={3} alignItems="center">
        {activeTab === 1 && portfolios && portfolios.length > 0 && (
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="portfolio-select-label">Portfolio</InputLabel>
            <Select
              labelId="portfolio-select-label"
              id="portfolio-select"
              value={selectedPortfolioId}
              onChange={handlePortfolioChange}
              label="Portfolio"
            >
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Filter by Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="Filter by Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="OnHold">On Hold</MenuItem>
            <MenuItem value="Succeeded">Completed</MenuItem>
            <MenuItem value="Canceled">Canceled</MenuItem>
            <MenuItem value="Failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: '#FFF4F4' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            startIcon={<Refresh />} 
            onClick={handleRetry}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      ) : filteredTransactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No transactions found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {statusFilter !== 'all' 
              ? `No ${statusFilter.toLowerCase()} transactions found. Try changing the filter.` 
              : 'Start by creating a new transaction.'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filteredTransactions.map(transaction => {
            const statusStr = String(transaction.status);
            const isSuccess = statusStr === 'Succeeded';
            const isFailed = statusStr === 'Failed';
            const isCanceled = statusStr === 'Canceled';
            const isOnHold = statusStr === 'OnHold';
            
            let borderColor = '#FFC107';
            let bgColor = '#FFC107';
            
            if (isSuccess) {
              borderColor = '#4CAF50';
              bgColor = '#4CAF50';
            } else if (isFailed) {
              borderColor = '#F44336';
              bgColor = '#F44336';
            } else if (isCanceled) {
              borderColor = '#9E9E9E';
              bgColor = '#9E9E9E';
            }
            
            return (
              <Card 
                key={transaction.id}
                sx={{ 
                  borderLeft: '5px solid',
                  borderColor: borderColor
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h6">{transaction.symbol}</Typography>
                    <Typography 
                      variant="body2" 
                      sx={{
                        bgcolor: bgColor,
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1
                      }}
                    >
                      {transaction.status}{isSuccess ? ' ✓' : ''}
                    </Typography>
                  </Box>
                  
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={2}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Type</Typography>
                      <Typography variant="body2">{transaction.type}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Quantity</Typography>
                      <Typography variant="body2">{transaction.quantity}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Price per Share</Typography>
                      <Typography variant="body2">${transaction.pricePerShare.toFixed(2)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Total Value</Typography>
                      <Typography variant="body2">${transaction.transactionValue.toFixed(2)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Date</Typography>
                      <Typography variant="body2">
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Time</Typography>
                      <Typography variant="body2">
                        {new Date(transaction.transactionDate).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                
                {isOnHold && (
                  <CardActions>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<Cancel />}
                      onClick={() => handleCancelTransaction(transaction.id)}
                    >
                      Cancel
                    </Button>
                  </CardActions>
                )}
              </Card>
            );
          })}
        </Box>
      )}
      
      {/* Transaction Creation Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Transaction
          <IconButton
            onClick={handleCloseCreateDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!isMarketOpen && (
            <Box sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', p: 2, mb: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                <strong>Market is currently closed.</strong> Your transaction will be placed on hold until the market reopens.
              </Typography>
            </Box>
          )}
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="portfolio-select-label">Portfolio</InputLabel>
              <Select
                labelId="portfolio-select-label"
                id="portfolioId"
                name="portfolioId"
                value={formData.portfolioId}
                onChange={handleFormChange}
                label="Portfolio"
                disabled={activeTab === 1}
              >
                {portfolios.map(portfolio => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>{portfolio.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="type-select-label">Transaction Type</InputLabel>
              <Select
                labelId="type-select-label"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                label="Transaction Type"
              >
                <MenuItem value={TransactionType.Buy}>Buy</MenuItem>
                <MenuItem value={TransactionType.Sell} disabled={Object.keys(ownedStocks).length === 0}>Sell</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="symbol-select-label">Symbol</InputLabel>
              <Select
                labelId="symbol-select-label"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleFormChange}
                label="Symbol"
                disabled={isLoadingSymbols}
              >
                {formData.type === TransactionType.Sell
                  ? Object.keys(ownedStocks).map(symbol => (
                      <MenuItem key={symbol} value={symbol}>
                        {symbol} (Owned: {ownedStocks[symbol]})
                      </MenuItem>
                    ))
                  : availableSymbols.map(symbol => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))
                }
              </Select>
            </FormControl>
            
            {formData.symbol && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Latest Price:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {isLoadingPrice ? (
                      <CircularProgress size={16} />
                    ) : latestPrice ? (
                      `$${latestPrice.toFixed(2)}`
                    ) : (
                      'N/A'
                    )}
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel id="investment-type-label">Investment Type</InputLabel>
                  <Select
                    labelId="investment-type-label"
                    id="investmentType"
                    name="investmentType"
                    value={formData.investmentType}
                    onChange={handleFormChange}
                    label="Investment Type"
                  >
                    <MenuItem value="Shares">Number of Shares</MenuItem>
                    <MenuItem value="Amount">Investment Amount ($)</MenuItem>
                  </Select>
                </FormControl>
                
                {formData.investmentType === 'Shares' ? (
                  <FormControl fullWidth>
                    <TextField
                      id="quantity"
                      name="quantity"
                      label="Quantity (Shares)"
                      type="number"
                      value={formData.quantity || ''}
                      onChange={handleFormChange}
                      inputProps={{ min: 1, step: 1 }}
                      error={!!formData.quantity && !isQuantityValid(formData.quantity)}
                      helperText={
                        formData.quantity && !isQuantityValid(formData.quantity) 
                          ? "Quantity must be a whole number greater than 0" 
                          : `Estimated Value: $${((formData.quantity || 0) * (latestPrice || 0)).toFixed(2)}`
                      }
                      fullWidth
                    />
                  </FormControl>
                ) : (
                  <FormControl fullWidth>
                    <TextField
                      id="investmentAmount"
                      name="investmentAmount"
                      label="Investment Amount ($)"
                      type="number"
                      value={formData.investmentAmount || ''}
                      onChange={handleFormChange}
                      inputProps={{ 
                        min: 0.01, 
                        step: 0.01
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={!!formData.investmentAmount && !isAmountValid(formData.investmentAmount)}
                      helperText={
                        formData.investmentAmount && !isAmountValid(formData.investmentAmount)
                          ? "Amount must be greater than 0"
                          : latestPrice && latestPrice > 0 
                            ? `Estimated Shares: ${((formData.investmentAmount || 0) / (latestPrice || 1)).toFixed(4)}`
                            : ""
                      }
                      fullWidth
                    />
                  </FormControl>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateTransaction}
            disabled={isLoading || 
                     isLoadingPrice || 
                     !formData.symbol || 
                     !formData.portfolioId || 
                     (formData.investmentType === 'Shares' && !isQuantityValid(formData.quantity)) ||
                     (formData.investmentType === 'Amount' && !isAmountValid(formData.investmentAmount))}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Create Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsContainer; 