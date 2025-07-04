import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, useTheme, Chip, CircularProgress, Alert } from '@mui/material';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { businessDomainService } from '../../api/businessDomainService';

interface StockTickerData {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  isHistorical?: boolean;
}

const StockTicker: React.FC = () => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState<boolean>(true);
  const [stockData, setStockData] = useState<StockTickerData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setError(null);
        
        const symbols = await businessDomainService.getAllUniqueSymbols();
        
        if (symbols && symbols.length > 0) {
          const tickerData: StockTickerData[] = [];
          
          const symbolsToProcess = symbols.slice(0, 15);
          
          for (const symbol of symbolsToProcess) {
            try {
              let intradayData = await businessDomainService.getLatestIntradayMarketData(symbol, 2);

              if (intradayData && intradayData.length > 1) {
                const sortedData = [...intradayData].sort(
                  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                const current = sortedData[0];
                const previous = sortedData[1];
                
                const change = current.current - previous.current;
                const changePercent = (change / previous.current) * 100;
                
                tickerData.push({
                  symbol,
                  currentPrice: current.current,
                  previousPrice: previous.current,
                  change,
                  changePercent,
                  isHistorical: false
                });
              } else if (intradayData && intradayData.length === 1) {
                const current = intradayData[0];
                
                tickerData.push({
                  symbol,
                  currentPrice: current.current,
                  previousPrice: current.current,
                  change: 0,
                  changePercent: 0,
                  isHistorical: false
                });
              } else {
                try {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  
                  const historicalData = await businessDomainService.getHistoricalMarketData(
                    symbol,
                    start.toISOString(),
                    end.toISOString()
                  );
                  
                  
                  if (historicalData && historicalData.length > 1) {
                    const validData = historicalData
                      .filter(d => d.close !== undefined && d.close !== null)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    if (validData.length > 1) {
                      const current = validData[0];
                      const previous = validData[1];
                      
                      
                      if (current.close && previous.close) {
                        const change = current.close - previous.close;
                        const changePercent = (change / previous.close) * 100;
                        
                        tickerData.push({
                          symbol,
                          currentPrice: current.close,
                          previousPrice: previous.close,
                          change,
                          changePercent,
                          isHistorical: true
                        });
                      }
                    } else if (validData.length === 1 && validData[0].close) {
                      
                      tickerData.push({
                        symbol,
                        currentPrice: validData[0].close,
                        previousPrice: validData[0].close,
                        change: 0,
                        changePercent: 0,
                        isHistorical: true
                      });
                    }
                  }
                } catch (histErr) {
                  console.error(`StockTicker: Error fetching historical data for ${symbol}:`, histErr);
                }
              }
            } catch (err) {
              console.error(`StockTicker: Error fetching data for ${symbol}:`, err);
            }
          }
          
          setStockData(tickerData);
          
          if (tickerData.length === 0) {
            setError("No market data available. The market may be closed or the API endpoint may not be responding.");
          }
        } else {
          console.error("StockTicker: No symbols returned from API");
          setError("No stock symbols available. The API endpoint may not be responding.");
        }
      } catch (err: any) {
        console.error('StockTicker: Error fetching market data:', err);
        setError(`Error loading ticker data: ${err.userMessage || err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketData();
    
    const interval = setInterval(() => {
      fetchMarketData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!play || !scrollRef.current || stockData.length === 0) return;

    const scrollContainer = scrollRef.current;
    let animationId: number;
    let startTime: number;
    const scrollDuration = 50000;
    const totalScrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const scrollPosition = (elapsed / scrollDuration) * totalScrollWidth;
      
      if (scrollPosition >= totalScrollWidth) {
        startTime = timestamp;
        scrollContainer.scrollLeft = 0;
      } else {
        scrollContainer.scrollLeft = scrollPosition;
      }
      
      animationId = window.requestAnimationFrame(step);
    };

    animationId = window.requestAnimationFrame(step);
    
    return () => {
      window.cancelAnimationFrame(animationId);
    };
  }, [play, stockData]);

  const handleMouseEnter = () => setPlay(false);
  const handleMouseLeave = () => setPlay(true);

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          py: 2,
          display: 'flex',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Alert severity="warning" sx={{ mx: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (stockData.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          py: 1,
          display: 'flex',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No stock data available at this time
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Box
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          '-ms-overflow-style': 'none',
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, px: 3 }}>
          {stockData.map((stock) => (
            <Box 
              key={stock.symbol}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ mr: 1 }}>
                <Typography variant="body2" fontWeight="bold" component="span">
                  {stock.symbol}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: stock.change >= 0 
                      ? theme.palette.success.main 
                      : theme.palette.error.main
                  }}
                >
                  <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
                    ${stock.currentPrice.toFixed(2)}
                  </Typography>
                  {stock.change >= 0 ? (
                    <ArrowDropUp fontSize="small" />
                  ) : (
                    <ArrowDropDown fontSize="small" />
                  )}
                  <Typography variant="caption" component="span">
                    {Math.abs(stock.changePercent).toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
              <Chip 
                size="small" 
                label={stock.change >= 0 ? "+" + stock.change.toFixed(2) : stock.change.toFixed(2)}
                sx={{ 
                  bgcolor: stock.change >= 0 
                    ? alpha(theme.palette.success.main, 0.1) 
                    : alpha(theme.palette.error.main, 0.1),
                  color: stock.change >= 0 
                    ? theme.palette.success.main 
                    : theme.palette.error.main,
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  height: 20,
                  opacity: stock.isHistorical ? 0.8 : 1,
                  '& .MuiChip-label': { px: 1 }
                }} 
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default StockTicker; 