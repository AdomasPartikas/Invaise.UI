import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Button,
  ButtonGroup,
  CircularProgress,
  Menu,
  MenuItem,
  FormControl,
  Select,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import { ArrowDropUp, ArrowDropDown, MoreVert, FilterList } from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { businessDomainService } from '../../api/businessDomainService';

const PortfolioHoldings: React.FC = () => {
  const theme = useTheme();
  const { currentPortfolio, portfolioStocks, portfolios, selectPortfolio, isLoading } = usePortfolio();
  const [viewFilter, setViewFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [dailyChanges, setDailyChanges] = useState<Record<string, number>>({});

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setViewFilter(filter);
  };

  // Handle portfolio change
  const handlePortfolioChange = (event: SelectChangeEvent) => {
    const portfolioId = event.target.value as string;
    selectPortfolio(portfolioId);
  };

  // Fetch daily price changes when portfolio stocks change
  useEffect(() => {
    if (portfolioStocks && portfolioStocks.length > 0) {
      fetchDailyPriceChanges();
    }
  }, [portfolioStocks]);

  // Fetch 24-hour price changes for all symbols in the portfolio
  const fetchDailyPriceChanges = async () => {
    if (!portfolioStocks || portfolioStocks.length === 0) return;
    
    const newDailyChanges: Record<string, number> = {};
    const symbols = portfolioStocks.map(stock => stock.symbol);
    
    // Process each symbol
    const promises = symbols.map(async (symbol) => {
      try {
        // Get the two most recent historical data points (today and yesterday)
        const histData = await businessDomainService.getLatestHistoricalMarketData(symbol, 2);
        
        if (histData.length >= 2 && histData[0].close && histData[1].close) {
          // Calculate 24-hour percentage change
          const currentPrice = histData[0].close;
          const previousPrice = histData[1].close;
          const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
          newDailyChanges[symbol] = percentChange;
        } else if (histData.length >= 1 && histData[0].close) {
          // If we only have today's data, use the existing percentage change
          const stockData = portfolioStocks.find(stock => stock.symbol === symbol);
          if (stockData) {
            newDailyChanges[symbol] = stockData.percentageChange;
          }
        }
      } catch (error) {
        console.error(`Error fetching daily price changes for ${symbol}:`, error);
        // Fallback to existing percentage change
        const stockData = portfolioStocks.find(stock => stock.symbol === symbol);
        if (stockData) {
          newDailyChanges[symbol] = stockData.percentageChange;
        }
      }
    });
    
    await Promise.all(promises);
    setDailyChanges(newDailyChanges);
  };

  // Apply filters
  const filteredHoldings = portfolioStocks.filter(stock => {
    const dailyChange = dailyChanges[stock.symbol] !== undefined ? dailyChanges[stock.symbol] : stock.percentageChange;
    
    if (viewFilter === 'all') return true;
    if (viewFilter === 'gainers') return dailyChange >= 0;
    if (viewFilter === 'losers') return dailyChange < 0;
    return true;
  });

  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortBy = (field: string) => {
    setSortField(field);
    handleFilterMenuClose();
  };

  // Sort holdings based on selected field
  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    if (!sortField) return 0;
    
    switch (sortField) {
      case 'symbol':
        return a.symbol.localeCompare(b.symbol);
      case 'quantity':
        return b.quantity - a.quantity;
      case 'baseValue':
        return b.totalBaseValue - a.totalBaseValue;
      case 'currentValue':
        return b.currentTotalValue - a.currentTotalValue;
      case 'change':
        // Use daily changes if available
        const changeA = dailyChanges[a.symbol] !== undefined ? dailyChanges[a.symbol] : a.percentageChange;
        const changeB = dailyChanges[b.symbol] !== undefined ? dailyChanges[b.symbol] : b.percentageChange;
        return changeB - changeA;
      case 'baseChange':
        // Sort by base change (from purchase price)
        return b.percentageChange - a.percentageChange;
      case 'lastUpdated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mr: 2 }}>
            Portfolio Holdings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <Button 
              variant={viewFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('all')}
            >
              All
            </Button>
            <Button 
              variant={viewFilter === 'gainers' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('gainers')}
            >
              Gainers
            </Button>
            <Button 
              variant={viewFilter === 'losers' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('losers')}
            >
              Losers
            </Button>
          </ButtonGroup>
          <IconButton size="small" onClick={handleFilterClick}>
            <FilterList fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterMenuClose}
          >
            <MenuItem onClick={() => handleSortBy('symbol')}>Sort by Symbol</MenuItem>
            <MenuItem onClick={() => handleSortBy('quantity')}>Sort by Quantity</MenuItem>
            <MenuItem onClick={() => handleSortBy('baseValue')}>Sort by Base Value</MenuItem>
            <MenuItem onClick={() => handleSortBy('currentValue')}>Sort by Current Value</MenuItem>
            <MenuItem onClick={() => handleSortBy('change')}>Sort by 24h Change %</MenuItem>
            <MenuItem onClick={() => handleSortBy('baseChange')}>Sort by Base Change %</MenuItem>
            <MenuItem onClick={() => handleSortBy('lastUpdated')}>Sort by Last Updated</MenuItem>
          </Menu>
        </Box>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Base Value</TableCell>
              <TableCell align="right">Current Value</TableCell>
              <TableCell align="right">
                <Tooltip title="Price change in the last 24 hours" arrow>
                  <span>24h Change</span>
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Change from base purchase price to current price" arrow>
                  <span>Base Change</span>
                </Tooltip>
              </TableCell>
              <TableCell align="right">Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedHoldings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No holdings found in this portfolio.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedHoldings.map((holding) => {
                // Get daily change value from state or fall back to stored value
                const dailyChange = dailyChanges[holding.symbol] !== undefined 
                  ? dailyChanges[holding.symbol] 
                  : holding.percentageChange;
                
                const isChangeUp = dailyChange >= 0;
                
                // Base change (from purchase price to current)
                const baseChange = holding.percentageChange;
                const isBaseChangeUp = baseChange >= 0;
                
                return (
                  <TableRow 
                    key={holding.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={`https://logo.clearbit.com/${holding.symbol.toLowerCase()}.com`}
                          alt={holding.symbol}
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 2,
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        >
                          {holding.symbol.charAt(0)}
                        </Avatar>
                        <Typography variant="body1" fontWeight="medium">
                          {holding.symbol}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {holding.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${holding.totalBaseValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ${holding.currentTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          color: isChangeUp 
                            ? theme.palette.success.main 
                            : theme.palette.error.main
                        }}
                      >
                        {isChangeUp ? (
                          <ArrowDropUp fontSize="small" />
                        ) : (
                          <ArrowDropDown fontSize="small" />
                        )}
                        <Typography variant="body2" component="span">
                          {Math.abs(dailyChange).toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          color: isBaseChangeUp 
                            ? theme.palette.success.main 
                            : theme.palette.error.main
                        }}
                      >
                        {isBaseChangeUp ? (
                          <ArrowDropUp fontSize="small" />
                        ) : (
                          <ArrowDropDown fontSize="small" />
                        )}
                        <Typography variant="body2" component="span">
                          {Math.abs(baseChange).toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {new Date(holding.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default PortfolioHoldings; 