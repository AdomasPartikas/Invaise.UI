import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  IconButton,
  Paper,
  ButtonGroup,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Add
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { businessDomainService } from '../../api/businessDomainService';
import { useNavigate } from 'react-router-dom';

interface PortfolioTotals {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
}

interface HistoricalDataPoint {
  date: string;
  value: number;
}

const PortfolioOverview = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentPortfolio, portfolioStocks, portfolios, selectPortfolio } = usePortfolio();
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState('1W');
  const [filter, setFilter] = useState('all');
  const [portfolioTotals, setPortfolioTotals] = useState<PortfolioTotals>({
    totalValue: 0,
    totalCost: 0,
    totalGain: 0,
    totalGainPercent: 0
  });
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [latestPrices, setLatestPrices] = useState<Record<string, number>>({});
  const [dailyChanges, setDailyChanges] = useState<Record<string, number>>({});
  const [portfolioDailyChange, setPortfolioDailyChange] = useState<number>(0);

  useEffect(() => {
    if (portfolioStocks && portfolioStocks.length > 0) {
      const totals = portfolioStocks.reduce((acc, stock) => {
        acc.totalValue += stock.currentTotalValue;
        acc.totalCost += stock.totalBaseValue;
        return acc;
      }, {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0
      });
      
      totals.totalGain = totals.totalValue - totals.totalCost;
      totals.totalGainPercent = totals.totalCost > 0 
        ? (totals.totalGain / totals.totalCost) * 100 
        : 0;
      
      setPortfolioTotals(totals);
      
      const newLatestPrices: Record<string, number> = {};
      portfolioStocks.forEach(stock => {
        if (stock.quantity > 0) {
          newLatestPrices[stock.symbol] = stock.currentTotalValue / stock.quantity;
        }
      });
      setLatestPrices(newLatestPrices);
      
      fetchDailyPriceChanges();
    } else {
      setPortfolioTotals({
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0
      });
      setPortfolioDailyChange(0);
    }
  }, [portfolioStocks]);

  useEffect(() => {
    if (Object.keys(dailyChanges).length === 0 || portfolioStocks.length === 0) {
      setPortfolioDailyChange(0);
      return;
    }

    let totalWeight = 0;
    let weightedChangeSum = 0;

    portfolioStocks.forEach(stock => {
      const dailyChange = dailyChanges[stock.symbol];
      
      if (dailyChange !== undefined && stock.currentTotalValue > 0) {
        weightedChangeSum += dailyChange * stock.currentTotalValue;
        totalWeight += stock.currentTotalValue;
      }
    });

    const averageDailyChange = totalWeight > 0 ? weightedChangeSum / totalWeight : 0;
    setPortfolioDailyChange(averageDailyChange);
  }, [dailyChanges, portfolioStocks]);

  const fetchDailyPriceChanges = async () => {
    if (!portfolioStocks || portfolioStocks.length === 0) return;
    
    const newDailyChanges: Record<string, number> = {};
    const symbols = portfolioStocks.map(stock => stock.symbol);
    
    const promises = symbols.map(async (symbol) => {
      try {
        const histData = await businessDomainService.getLatestHistoricalMarketData(symbol, 2);
        
        if (histData.length >= 2 && histData[0].close && histData[1].close) {
          const currentPrice = histData[0].close;
          const previousPrice = histData[1].close;
          const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
          newDailyChanges[symbol] = percentChange;
        } else if (histData.length >= 1 && histData[0].close) {
          const stockData = portfolioStocks.find(stock => stock.symbol === symbol);
          if (stockData) {
            newDailyChanges[symbol] = stockData.percentageChange;
          }
        }
      } catch (error) {
        console.error(`Error fetching daily price changes for ${symbol}:`, error);
        const stockData = portfolioStocks.find(stock => stock.symbol === symbol);
        if (stockData) {
          newDailyChanges[symbol] = stockData.percentageChange;
        }
      }
    });
    
    await Promise.all(promises);
    setDailyChanges(newDailyChanges);
  };

  useEffect(() => {
    if (portfolioStocks && portfolioStocks.length > 0) {
      fetchHistoricalData();
    }
  }, [timeRange, portfolioStocks]);

  const fetchHistoricalData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1W':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'ALL':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const symbolMap: Record<string, boolean> = {};
      const stocksMap: Record<string, { quantity: number, ratio: number }> = {};
      let totalPortfolioValue = 0;
      
      portfolioStocks.forEach(stock => {
        symbolMap[stock.symbol] = true;
        totalPortfolioValue += stock.currentTotalValue;
      });
      
      if (totalPortfolioValue === 0 || portfolioStocks.length === 0) {
        setHistoricalData([{
          date: new Date().toISOString().split('T')[0],
          value: 0
        }]);
        setIsLoading(false);
        return;
      }
      
      portfolioStocks.forEach(stock => {
        stocksMap[stock.symbol] = {
          quantity: stock.quantity,
          ratio: stock.currentTotalValue / totalPortfolioValue
        };
      });
      
      const symbols = Object.keys(symbolMap);
      
      const symbolHistoricalData: Record<string, Record<string, number>> = {};
      
      const promises = symbols.map(async (symbol) => {
        try {
          const data = await businessDomainService.getHistoricalMarketData(
            symbol, 
            startDateStr, 
            endDateStr
          );
          
          if (data.length > 0) {
            symbolHistoricalData[symbol] = {};
            data.forEach(point => {
              if (point.close) {
                const dateStr = new Date(point.date).toISOString().split('T')[0];
                symbolHistoricalData[symbol][dateStr] = point.close;
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching historical data for ${symbol}:`, error);
        }
      });
      
      await Promise.all(promises);
      
      const normalizedSymbolData: Record<string, Record<string, number>> = {};
      
      const latestPrices: Record<string, number> = {};
      symbols.forEach(symbol => {
        if (symbolHistoricalData[symbol]) {
          const dates = Object.keys(symbolHistoricalData[symbol]).sort();
          if (dates.length > 0) {
            const latestDate = dates[dates.length - 1];
            latestPrices[symbol] = symbolHistoricalData[symbol][latestDate];
          }
        }
      });
      
      symbols.forEach(symbol => {
        if (symbolHistoricalData[symbol] && latestPrices[symbol]) {
          normalizedSymbolData[symbol] = {};
          const latestPrice = latestPrices[symbol];
          
          Object.entries(symbolHistoricalData[symbol]).forEach(([date, price]) => {
            normalizedSymbolData[symbol][date] = price / latestPrice;
          });
        }
      });
      
      const portfolioHistory: Record<string, number> = {};
      
      const allDates = new Set<string>();
      
      symbols.forEach(symbol => {
        if (normalizedSymbolData[symbol]) {
          Object.keys(normalizedSymbolData[symbol]).forEach(date => {
            allDates.add(date);
          });
        }
      });
      
      Array.from(allDates).sort().forEach(date => {
        let dateTotal = 0;
        symbols.forEach(symbol => {
          if (normalizedSymbolData[symbol] && 
              normalizedSymbolData[symbol][date] !== undefined &&
              stocksMap[symbol]) {
            
            const currentContribution = portfolioTotals.totalValue * stocksMap[symbol].ratio;
            
            const historicalContribution = currentContribution * normalizedSymbolData[symbol][date];
            
            dateTotal += historicalContribution;
          }
        });
        
        if (dateTotal > 0) {
          portfolioHistory[date] = dateTotal;
        }
      });
      
      const chartData = Object.entries(portfolioHistory)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (chartData.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = chartData[chartData.length - 1].date;
        
        if (lastDate !== today) {
          chartData.push({
            date: today,
            value: portfolioTotals.totalValue
          });
        } else {
          chartData[chartData.length - 1].value = portfolioTotals.totalValue;
        }
        
        setHistoricalData(chartData);
      } else {
        setHistoricalData([{
          date: new Date().toISOString().split('T')[0],
          value: portfolioTotals.totalValue
        }]);
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      setHistoricalData([{
        date: new Date().toISOString().split('T')[0],
        value: portfolioTotals.totalValue
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  const handleTimeRangeChange = (event: React.MouseEvent<HTMLElement>, newTimeRange: string) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };
  
  const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: string) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const handlePortfolioChange = (event: SelectChangeEvent) => {
    const portfolioId = event.target.value as string;
    selectPortfolio(portfolioId);
  };

  const navigateToPortfolio = () => {
    if (currentPortfolio) {
      navigate(`/portfolio`);
    }
  };

  const filteredStocks = portfolioStocks.filter(stock => {
    if (filter === 'all') return true;
    if (filter === 'stocks') return !stock.symbol.includes('CRYPTO');
    if (filter === 'crypto') return stock.symbol.includes('CRYPTO');
    return true;
  });

  const formatChartTooltip = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatXAxisTick = (value: string) => {
    const date = new Date(value);
    
    switch (timeRange) {
      case '1W':
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '3M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1Y':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'ALL':
        return date.toLocaleDateString('en-US', { year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  const generateAllocationData = () => {
    if (!portfolioStocks || portfolioStocks.length === 0) {
      return [];
    }

    const allocationData = portfolioStocks.reduce((acc, stock) => {
      if (stock.currentTotalValue <= 0) return acc;
      
      const key = stock.symbol;
      
      if (!acc[key]) {
        acc[key] = {
          name: key,
          value: stock.currentTotalValue,
          color: getRandomColor(key)
        };
      } else {
        acc[key].value += stock.currentTotalValue;
      }
      
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);
    
    return Object.values(allocationData);
  };
  
  const getRandomColor = (symbol: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#ff8042',
      '#0088FE',
      '#00C49F',
      '#FFBB28',
      '#FF8042'
    ];
    
    const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };
  
  const allocationData = generateAllocationData();

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        height: '100%'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mr: 2 }}>
            Portfolio Overview
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              id="portfolio-select"
              value={currentPortfolio?.id || ''}
              size="small"
              onChange={handlePortfolioChange}
              sx={{ backgroundColor: theme.palette.background.paper }}
            >
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <IconButton size="small" sx={{ ml: 1 }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {/* Portfolio value and chart - Full width */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Total Portfolio Value
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography variant="h4" component="span" fontWeight="bold">
            ${portfolioTotals.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              ml: 2,
              color: portfolioDailyChange >= 0 ? theme.palette.success.main : theme.palette.error.main
            }}
          >
            {portfolioDailyChange >= 0 ? (
              <ArrowUpward fontSize="small" />
            ) : (
              <ArrowDownward fontSize="small" />
            )}
            <Typography variant="body2" fontWeight="medium">
              {Math.abs(portfolioDailyChange).toFixed(2)}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color={portfolioTotals.totalGain >= 0 ? theme.palette.success.main : theme.palette.error.main}>
          {portfolioTotals.totalGain >= 0 ? '+' : ''}
          ${portfolioTotals.totalGain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <ButtonGroup size="small" sx={{ mb: 2 }}>
          <Button 
            variant={timeRange === '1W' ? 'contained' : 'outlined'} 
            onClick={(e) => handleTimeRangeChange(e, '1W')}
          >
            1W
          </Button>
          <Button 
            variant={timeRange === '1M' ? 'contained' : 'outlined'} 
            onClick={(e) => handleTimeRangeChange(e, '1M')}
          >
            1M
          </Button>
          <Button 
            variant={timeRange === '3M' ? 'contained' : 'outlined'} 
            onClick={(e) => handleTimeRangeChange(e, '3M')}
          >
            3M
          </Button>
          <Button 
            variant={timeRange === '1Y' ? 'contained' : 'outlined'} 
            onClick={(e) => handleTimeRangeChange(e, '1Y')}
          >
            1Y
          </Button>
          <Button 
            variant={timeRange === 'ALL' ? 'contained' : 'outlined'} 
            onClick={(e) => handleTimeRangeChange(e, 'ALL')}
          >
            ALL
          </Button>
        </ButtonGroup>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 200, alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : historicalData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 200, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No historical data available for this portfolio
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatXAxisTick} 
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString('en-US', { notation: 'compact' })}`} 
                tick={{ fontSize: 12 }} 
              />
              <Tooltip 
                formatter={formatChartTooltip}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={theme.palette.primary.main} 
                dot={false} 
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
      
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Top Assets
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ButtonGroup size="small" sx={{ mr: 2 }}>
              <Button 
                variant={filter === 'all' ? 'contained' : 'outlined'} 
                onClick={(e) => handleFilterChange(e, 'all')}
              >
                All
              </Button>
              <Button 
                variant={filter === 'stocks' ? 'contained' : 'outlined'} 
                onClick={(e) => handleFilterChange(e, 'stocks')}
              >
                Stocks
              </Button>
              <Button 
                variant={filter === 'crypto' ? 'contained' : 'outlined'} 
                onClick={(e) => handleFilterChange(e, 'crypto')}
              >
                Crypto
              </Button>
            </ButtonGroup>
            <Button 
              size="small" 
              startIcon={<Add />} 
              variant="outlined"
              onClick={navigateToPortfolio}
            >
              Add Asset
            </Button>
          </Box>
        </Box>
        
        {filteredStocks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No assets found in this portfolio
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell align="right">1 Stock Price</TableCell>
                  <TableCell align="right">24h Price Change</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Allocation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStocks
                  .slice()
                  .sort((a, b) => b.currentTotalValue - a.currentTotalValue)
                  .map((stock) => {
                    const unitPrice = stock.quantity > 0 ? stock.currentTotalValue / stock.quantity : 0;
                    
                    const dailyChange = dailyChanges[stock.symbol] !== undefined 
                      ? dailyChanges[stock.symbol] 
                      : stock.percentageChange;
                    
                    const isChangeUp = dailyChange >= 0;
                    
                    const allocation = portfolioTotals.totalValue > 0 
                      ? (stock.currentTotalValue / portfolioTotals.totalValue) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={stock.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={`https://logo.clearbit.com/${stock.symbol.toLowerCase()}.com`}
                              sx={{ width: 24, height: 24, mr: 1 }}
                            >
                              {stock.symbol.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {stock.symbol}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          ${unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: isChangeUp 
                              ? theme.palette.success.main 
                              : theme.palette.error.main
                          }}
                        >
                          {isChangeUp ? '+' : ''}{dailyChange.toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          {stock.quantity.toLocaleString('en-US', { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: typeof stock.quantity === 'number' && stock.quantity < 1 ? 8 : 2 
                          })}
                        </TableCell>
                        <TableCell align="right">
                          ${stock.currentTotalValue.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {allocation.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
};

export default PortfolioOverview; 