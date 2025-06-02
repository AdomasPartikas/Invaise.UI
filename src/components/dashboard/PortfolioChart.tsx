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
  currentPortfolioValue?: number;
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

  useEffect(() => {
    if (currentPortfolioValue !== undefined) {
      setCurrentValue(currentPortfolioValue);
    }
  }, [currentPortfolioValue]);

  useEffect(() => {
    if (!portfolioId) return;
    fetchHistoricalData();
  }, [portfolioId, timeRange, currentValue]);

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
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const portfolioStocks = await businessDomainService.getPortfolioStocks(portfolioId);
      
      let portfolioTotal = currentValue;
      if (portfolioTotal === 0 && portfolioStocks.length > 0) {
        portfolioTotal = portfolioStocks.reduce(
          (total, stock) => total + stock.currentTotalValue, 
          0
        );
        setCurrentValue(portfolioTotal);
      }
      
      if (portfolioTotal === 0 || portfolioStocks.length === 0) {
        setPortfolioData([{
          date: new Date().toISOString().split('T')[0],
          value: 0
        }]);
        setIsLoading(false);
        return;
      }
      
      const symbolMap: Record<string, boolean> = {};
      const stocksMap: Record<string, { quantity: number, ratio: number }> = {};
      
      portfolioStocks.forEach(stock => {
        symbolMap[stock.symbol] = true;
      });
      
      portfolioStocks.forEach(stock => {
        stocksMap[stock.symbol] = {
          quantity: stock.quantity,
          ratio: stock.currentTotalValue / portfolioTotal
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
            
            const currentContribution = portfolioTotal * stocksMap[symbol].ratio;
            
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
            value: portfolioTotal
          });
        } else {
          chartData[chartData.length - 1].value = portfolioTotal;
        }
        
        setPortfolioData(chartData);
      } else {
        setPortfolioData([{
          date: new Date().toISOString().split('T')[0],
          value: portfolioTotal
        }]);
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      setPortfolioData([{
        date: new Date().toISOString().split('T')[0],
        value: currentValue || 0
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (range: '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL') => {
    setTimeRange(range);
  };

  const getDisplayData = () => {
    return portfolioData;
  };

  const calculatePerformance = () => {
    if (portfolioData.length === 0) {
      return {
        startValue: 0,
        endValue: currentValue,
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