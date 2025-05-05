import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  TrendingUp, 
  ExpandMore, 
  ExpandLess, 
  CheckCircle, 
  ArrowUpward, 
  ArrowDownward,
  Refresh,
  Cancel
} from '@mui/icons-material';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { PortfolioStockRecommendation } from '../../api/businessDomainService';
import { useTransaction } from '../../contexts/TransactionContext';

export const PortfolioOptimization: React.FC = () => {
  const { 
    currentPortfolio, 
    portfolioStocks,
    optimization, 
    optimizationLoading, 
    optimizationError,
    inProgressOptimizationId,
    getPortfolioOptimization,
    applyOptimizationRecommendation,
    cancelOptimization,
    refreshPortfolio
  } = usePortfolio();

  const {
    optimizationGroups,
    cancelOptimization: cancelOptimizationTransactions
  } = useTransaction();

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Find the currently in-progress optimization transactions
  const inProgressGroup = optimizationGroups.find(
    group => group.optimizationId === inProgressOptimizationId
  );

  const handleRefresh = async () => {
    if (!currentPortfolio) return;
    
    setRefreshing(true);
    setError(null);
    try {
      const refreshed = await refreshPortfolio(currentPortfolio.id);
      if (refreshed) {
        setSuccess("Successfully requested new Gaia prediction for your portfolio");
      } else {
        setError("Could not get new Gaia prediction for your portfolio");
      }
    } catch (err) {
      console.error('Error getting new Gaia prediction:', err);
      setError('Failed to get new Gaia prediction for your portfolio');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOptimize = async () => {
    if (!currentPortfolio) return;
    setError(null);
    setSuccess(null);
    try {
      const result = await getPortfolioOptimization(currentPortfolio.id);
      console.log('Optimization result:', result);
      if (result && !result.optimizationId) {
        setError("Could not obtain optimization ID. Applying changes may not work.");
      } else {
        setDetailsOpen(true);
      }
    } catch (err) {
      console.error('Error optimizing portfolio:', err);
      setError('Failed to optimize portfolio');
    }
  };

  const handleApplyOptimization = async () => {
    if (!optimization || !optimization.optimizationId) {
      setError("No optimization ID available. Please try optimizing again.");
      return;
    }
    
    setApplying(true);
    setError(null);
    setSuccess(null);
    
    try {
      const success = await applyOptimizationRecommendation(optimization.optimizationId);
      if (success) {
        setSuccess("Portfolio optimization applied successfully!");
        setDetailsOpen(false);
      } else {
        setError("Failed to apply optimization. The optimization might be outdated.");
      }
    } catch (err) {
      setError("Failed to apply optimization. Please try optimizing again.");
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  const handleCancelOptimization = async () => {
    if (!inProgressOptimizationId) {
      setError("No in-progress optimization to cancel.");
      return;
    }
    
    setCancelling(true);
    setError(null);
    setSuccess(null);
    
    try {
      const success = await cancelOptimization(inProgressOptimizationId);
      if (success) {
        setSuccess("Portfolio optimization canceled successfully!");
      } else {
        setError("Failed to cancel optimization. It may have already completed or been canceled.");
      }
    } catch (err) {
      setError("Failed to cancel optimization. Please try again.");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'success';
      case 'sell': return 'error';
      case 'hold': return 'info';
      default: return 'default';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <ArrowUpward fontSize="small" />;
      case 'sell': return <ArrowDownward fontSize="small" />;
      case 'hold': return <CheckCircle fontSize="small" />;
      default: return undefined;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Show a more user-friendly version of the optimization conflict error
  const getErrorDisplayMessage = (message: string) => {
    if (message.includes("There is already an optimization in progress") || 
        message.includes("There is already an optimization ready to be applied")) {
      return "There's already an optimization in progress for this portfolio. You need to apply or cancel it before creating a new one.";
    }
    return message;
  };

  // Extract the in-progress optimization ID for display
  const getInProgressIdForDisplay = () => {
    if (inProgressOptimizationId) {
      return inProgressOptimizationId.substring(0, 8) + "...";
    }
    return null;
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Portfolio Optimization
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRefresh}
            disabled={refreshing || optimizationLoading || !currentPortfolio}
            startIcon={refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            sx={{ mr: 2 }}
          >
            {refreshing ? 'Requesting...' : 'New Gaia Prediction'}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleOptimize}
            disabled={optimizationLoading || !currentPortfolio || Boolean(inProgressOptimizationId)}
            startIcon={optimizationLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {optimizationLoading ? 'Optimizing...' : 'Optimize Portfolio'}
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Show error from local state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Show error from context */}
      {optimizationError && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {getErrorDisplayMessage(optimizationError)}
          {inProgressOptimizationId && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Optimization ID: {getInProgressIdForDisplay()}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleCancelOptimization}
                disabled={cancelling}
                startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
                sx={{ mt: 1 }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Optimization'}
              </Button>
            </Box>
          )}
        </Alert>
      )}
      
      {/* In-progress optimization transactions */}
      {inProgressGroup && inProgressGroup.transactions.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>In-Progress Optimization</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            There are {inProgressGroup.transactions.length} transactions being processed as part of this optimization.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleCancelOptimization}
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Optimization'}
          </Button>
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {optimization && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Confidence: {(optimization.confidence * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generated: {formatDate(optimization.timestamp)}
              {optimization.optimizationId && (
                <Chip 
                  size="small" 
                  label={`ID: ${optimization.optimizationId.substring(0, 8)}...`} 
                  color="default" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>AI Recommendation</AlertTitle>
            {optimization.explanation}
          </Alert>
          
          {optimization.recommendations && optimization.recommendations.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Recommended Changes</Typography>
                <IconButton size="small" onClick={() => setDetailsOpen(!detailsOpen)}>
                  {detailsOpen ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              <Collapse in={detailsOpen}>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Recommended</TableCell>
                        <TableCell align="right">Change</TableCell>
                        <TableCell align="right">Weight Change</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {optimization.recommendations.map((rec: PortfolioStockRecommendation) => {
                        // Calculate changes - handle missing or NaN values
                        const currentQty = Number(rec.currentQuantity) || 0;
                        const recQty = Number(rec.recommendedQuantity) || 0;
                        const qtyChange = recQty - currentQty;
                        
                        const currentWeight = Number(rec.currentWeight) || 0;
                        const targetWeight = Number(rec.targetWeight) || 0;
                        const weightChange = targetWeight - currentWeight;
                        
                        return (
                          <TableRow key={rec.symbol}>
                            <TableCell>{rec.symbol}</TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={rec.action.toUpperCase()}
                                color={getActionColor(rec.action) as any}
                                icon={getActionIcon(rec.action)}
                              />
                            </TableCell>
                            <TableCell align="right">{currentQty.toFixed(2)}</TableCell>
                            <TableCell align="right">{recQty.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Typography 
                                component="span"
                                color={qtyChange > 0 ? 'success.main' : qtyChange < 0 ? 'error.main' : 'inherit'}
                              >
                                {qtyChange > 0 ? '+' : ''}{qtyChange.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                component="span"
                                color={weightChange > 0 ? 'success.main' : weightChange < 0 ? 'error.main' : 'inherit'}
                              >
                                {(currentWeight * 100).toFixed(1)}% → {(targetWeight * 100).toFixed(1)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
              
              {/* Add Performance Metrics section */}
              {optimization.metrics && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 3 }}>
                    <Typography variant="subtitle1">Performance Metrics</Typography>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Value</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Sharpe Ratio</TableCell>
                          <TableCell align="right">
                            <Typography 
                              component="span"
                              color={optimization.metrics.sharpeRatio > 0 ? 'success.main' : 'error.main'}
                            >
                              {optimization.metrics.sharpeRatio.toFixed(4)}
                            </Typography>
                          </TableCell>
                          <TableCell>Risk-adjusted return (higher is better)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Expected Return</TableCell>
                          <TableCell align="right">
                            <Typography 
                              component="span"
                              color={optimization.metrics.expectedReturn > 0 ? 'success.main' : 'error.main'}
                            >
                              {(optimization.metrics.expectedReturn * 100).toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell>Projected portfolio return</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mean Return</TableCell>
                          <TableCell align="right">
                            <Typography 
                              component="span"
                              color={optimization.metrics.meanReturn > 0 ? 'success.main' : 'error.main'}
                            >
                              {(optimization.metrics.meanReturn * 100).toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell>Average historical return</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Variance</TableCell>
                          <TableCell align="right">{optimization.metrics.variance.toFixed(4)}</TableCell>
                          <TableCell>Portfolio volatility measure (lower is better)</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleApplyOptimization}
                  disabled={applying || !optimization.optimizationId || Boolean(inProgressOptimizationId)}
                  startIcon={applying ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {applying ? 'Applying...' : 'Apply Optimization'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
                No specific allocation changes recommended.
              </Typography>
              
              {/* Display Performance Metrics even when no recommendations are available */}
              {optimization.metrics && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 3 }}>
                    <Typography variant="subtitle1">Performance Metrics</Typography>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Value</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Sharpe Ratio</TableCell>
                          <TableCell align="right">
                            <Typography 
                              component="span"
                              color={optimization.metrics.sharpeRatio > 0 ? 'success.main' : 'error.main'}
                            >
                              {optimization.metrics.sharpeRatio.toFixed(4)}
                            </Typography>
                          </TableCell>
                          <TableCell>Risk-adjusted return (higher is better)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Expected Return</TableCell>
                          <TableCell align="right">
                            <Typography 
                              component="span"
                              color={optimization.metrics.expectedReturn > 0 ? 'success.main' : 'error.main'}
                            >
                              {(optimization.metrics.expectedReturn * 100).toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell>Projected portfolio return</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mean Return</TableCell>
                          <TableCell align="right">
                            <Typography 
                              component="span"
                              color={optimization.metrics.meanReturn > 0 ? 'success.main' : 'error.main'}
                            >
                              {(optimization.metrics.meanReturn * 100).toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell>Average historical return</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Variance</TableCell>
                          <TableCell align="right">{optimization.metrics.variance.toFixed(4)}</TableCell>
                          <TableCell>Portfolio volatility measure (lower is better)</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              {/* Show warning only if no metrics are available */}
              {!optimization.metrics && (
                <Alert severity="warning">
                  No recommendations or performance metrics available. This may be due to an issue with the optimization service.
                </Alert>
              )}
            </>
          )}
        </Box>
      )}
      
      {!optimization && !optimizationLoading && !optimizationError && !inProgressOptimizationId && (
        <Alert severity="info">
          Click "Optimize Portfolio" to get AI-driven recommendations for your portfolio based on the latest market predictions.
        </Alert>
      )}
    </Paper>
  );
};

export default PortfolioOptimization; 