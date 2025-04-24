import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, ButtonGroup, Button, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { businessDomainService } from '../../api/businessDomainService';

interface HistoricalDataPoint {
  date: string;
  value: number;
}

interface PortfolioChartProps {
  title?: string;
  portfolioId: string;
  initialData?: HistoricalDataPoint[];
  currentPortfolioValue?: number; // Add current value prop for consistency
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ 
  title = 'Portfolio Value', 
  portfolioId,
  initialData = [],
  currentPortfolioValue
}) => {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const [portfolioData, setPortfolioData] = useState<HistoricalDataPoint[]>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(initialData.length === 0);
  const [currentValue, setCurrentValue] = useState<number>(currentPortfolioValue || 0);

  // Update current value when prop changes
  useEffect(() => {
    if (currentPortfolioValue !== undefined) {
      setCurrentValue(currentPortfolioValue);
    }
  }, [currentPortfolioValue]);

  // Fetch historical data when component mounts or time range changes
  useEffect(() => {
    if (!portfolioId) return;
    fetchHistoricalData();
  }, [portfolioId, timeRange, currentValue]);

  // Fetch historical data from API
  const fetchHistoricalData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range based on selected time range
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
        case '6M':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'ALL':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }
      
      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get portfolio stocks
      const portfolioStocks = await businessDomainService.getPortfolioStocks(portfolioId);
      
      // Ensure we have the current portfolio value
      let portfolioTotal = currentValue;
      if (portfolioTotal === 0 && portfolioStocks.length > 0) {
        portfolioTotal = portfolioStocks.reduce(
          (total, stock) => total + stock.currentTotalValue, 
          0
        );
        setCurrentValue(portfolioTotal);
      }
      
      // If no stocks or zero total value, exit early
      if (portfolioTotal === 0 || portfolioStocks.length === 0) {
        setPortfolioData([{
          date: new Date().toISOString().split('T')[0],
          value: 0
        }]);
        setIsLoading(false);
        return;
      }
      
      // Get unique symbols and calculate their contribution ratios
      const symbolMap: Record<string, boolean> = {};
      const stocksMap: Record<string, { quantity: number, ratio: number }> = {};
      
      // Calculate the current ratio of each stock in the portfolio
      portfolioStocks.forEach(stock => {
        symbolMap[stock.symbol] = true;
      });
      
      // Calculate ratio for each stock (how much it contributes to the total portfolio)
      portfolioStocks.forEach(stock => {
        stocksMap[stock.symbol] = {
          quantity: stock.quantity,
          ratio: stock.currentTotalValue / portfolioTotal
        };
      });
      
      const symbols = Object.keys(symbolMap);
      
      // First, get the historical relative performance of each symbol
      const symbolHistoricalData: Record<string, Record<string, number>> = {};
      
      // Fetch historical price data for each symbol
      const promises = symbols.map(async (symbol) => {
        try {
          const data = await businessDomainService.getHistoricalMarketData(
            symbol, 
            startDateStr, 
            endDateStr
          );
          
          if (data.length > 0) {
            // Store each day's closing price for this symbol
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
      
      // Create normalized price index for each symbol 
      // where today's price = 1.0 (normalized to today's price)
      const normalizedSymbolData: Record<string, Record<string, number>> = {};
      
      // 1. Get the latest available price for each symbol
      const latestPrices: Record<string, number> = {};
      symbols.forEach(symbol => {
        if (symbolHistoricalData[symbol]) {
          // Get all dates we have data for this symbol
          const dates = Object.keys(symbolHistoricalData[symbol]).sort();
          if (dates.length > 0) {
            // Use the most recent price as the normalizer
            const latestDate = dates[dates.length - 1];
            latestPrices[symbol] = symbolHistoricalData[symbol][latestDate];
          }
        }
      });
      
      // 2. Calculate normalized prices (relative to the latest price)
      symbols.forEach(symbol => {
        if (symbolHistoricalData[symbol] && latestPrices[symbol]) {
          normalizedSymbolData[symbol] = {};
          const latestPrice = latestPrices[symbol];
          
          Object.entries(symbolHistoricalData[symbol]).forEach(([date, price]) => {
            // Calculate price as percentage of latest price (1.0 = 100% of latest price)
            normalizedSymbolData[symbol][date] = price / latestPrice;
          });
        }
      });
      
      // Now calculate historical portfolio values using:
      // 1. Today's portfolio allocation ratio (how much each stock contributes)
      // 2. Normalized historical prices (how prices moved relative to today)
      const portfolioHistory: Record<string, number> = {};
      
      // For each date, calculate the portfolio value 
      // This respects the current allocation while reflecting historical price changes
      const allDates = new Set<string>();
      
      // Collect all dates that we have data for
      symbols.forEach(symbol => {
        if (normalizedSymbolData[symbol]) {
          Object.keys(normalizedSymbolData[symbol]).forEach(date => {
            allDates.add(date);
          });
        }
      });
      
      // Calculate historical portfolio value for each date
      Array.from(allDates).sort().forEach(date => {
        let dateTotal = 0;
        symbols.forEach(symbol => {
          if (normalizedSymbolData[symbol] && 
              normalizedSymbolData[symbol][date] !== undefined &&
              stocksMap[symbol]) {
            
            // How much this stock contributes to the total portfolio value today
            const currentContribution = portfolioTotal * stocksMap[symbol].ratio;
            
            // Adjust current contribution by the historical normalized price
            const historicalContribution = currentContribution * normalizedSymbolData[symbol][date];
            
            dateTotal += historicalContribution;
          }
        });
        
        // Only add dates with values > 0
        if (dateTotal > 0) {
          portfolioHistory[date] = dateTotal;
        }
      });
      
      // Convert to array format for the chart
      const chartData = Object.entries(portfolioHistory)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (chartData.length > 0) {
        // Add today's exact value to ensure the chart reflects current portfolio value
        const today = new Date().toISOString().split('T')[0];
        const lastDate = chartData[chartData.length - 1].date;
        
        if (lastDate !== today) {
          chartData.push({
            date: today,
            value: portfolioTotal
          });
        } else {
          // Ensure last data point is exactly the current portfolio value
          chartData[chartData.length - 1].value = portfolioTotal;
        }
        
        setPortfolioData(chartData);
      } else {
        // Fallback if no historical data found
        setPortfolioData([{
          date: new Date().toISOString().split('T')[0],
          value: portfolioTotal
        }]);
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      // Fallback
      setPortfolioData([{
        date: new Date().toISOString().split('T')[0],
        value: currentValue || 0
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range: '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL') => {
    setTimeRange(range);
  };

  // Get data based on time range
  const getDisplayData = () => {
    return portfolioData;
  };

  // Calculate performance metrics
  const calculatePerformance = () => {
    if (portfolioData.length === 0) {
      return {
        startValue: 0,
        endValue: currentValue, // Use current value from props/state
        absoluteChange: 0,
        percentageChange: 0
      };
    }
    
    const data = getDisplayData();
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    
    const absoluteChange = endValue - startValue;
    const percentageChange = startValue !== 0 ? ((endValue / startValue) - 1) * 100 : 0;
    
    return {
      startValue,
      endValue,
      absoluteChange,
      percentageChange
    };
  };

  const performance = calculatePerformance();
  const isPositive = performance.absoluteChange >= 0;

  // Format function for chart X-axis ticks
  const formatXAxisTick = (value: string) => {
    const date = new Date(value);
    
    switch (timeRange) {
      case '1W':
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '3M':
      case '6M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1Y':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'ALL':
        return date.toLocaleDateString('en-US', { year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: 1000,
        mx: 'auto',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              color: isPositive ? 'success.main' : 'error.main'
            }}
          >
            ${performance.endValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: isPositive ? 'success.main' : 'error.main',
                fontWeight: 'medium',
                mr: 1
              }}
            >
              {isPositive ? '+' : ''}{performance.absoluteChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: isPositive ? 'success.main' : 'error.main',
                fontWeight: 'medium'
              }}
            >
              ({isPositive ? '+' : ''}{performance.percentageChange.toFixed(2)}%)
            </Typography>
          </Box>
        </Box>
        
        <ButtonGroup size="small">
          <Button 
            variant={timeRange === '1W' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeRangeChange('1W')}
          >
            1W
          </Button>
          <Button 
            variant={timeRange === '1M' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeRangeChange('1M')}
          >
            1M
          </Button>
          <Button 
            variant={timeRange === '3M' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeRangeChange('3M')}
          >
            3M
          </Button>
          <Button 
            variant={timeRange === '6M' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeRangeChange('6M')}
          >
            6M
          </Button>
          <Button 
            variant={timeRange === '1Y' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeRangeChange('1Y')}
          >
            1Y
          </Button>
          <Button 
            variant={timeRange === 'ALL' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeRangeChange('ALL')}
          >
            ALL
          </Button>
        </ButtonGroup>
      </Box>
      
      <Box sx={{ height: 300, width: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : portfolioData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No historical data available
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={getDisplayData()}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={formatXAxisTick}
              />
              <YAxis 
                domain={['dataMin - 100', 'dataMax + 100']} 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString('en-US', { notation: 'compact' })}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? "#4caf50" : "#f44336"} 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
};

export default PortfolioChart; 