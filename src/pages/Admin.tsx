import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip,
  CircularProgress,
  Box,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Switch,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../contexts/AuthContext';
import { businessDomainService, AIModel, LogEntry } from '../api/businessDomainService';
import { getAllUsers, updateUserActiveStatus, UserDto } from '../services/userService';

// Type for sort direction
type Order = 'asc' | 'desc';

const Admin: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<Record<number, boolean>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });
  
  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<keyof LogEntry>('timeStamp');
  const [order, setOrder] = useState<Order>('desc');

  // User management state
  const [users, setUsers] = useState<UserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Refresh timer state
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('Checking admin status...');
        const adminStatus = await businessDomainService.isAdmin();
        console.log('Admin status response:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin permissions. Please try refreshing the page.');
        setIsAdmin(false);
      }
    };

    if (isAuthenticated) {
      checkAdmin();
    }
  }, [isAuthenticated]);

  // Fetch AI models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('Admin is true, fetching AI models...');
        const modelData = await businessDomainService.getAllModels();
        console.log('Received model data:', modelData);
        
        if (!modelData || !Array.isArray(modelData) || modelData.length === 0) {
          console.warn('Received empty or invalid model data, using fallback data');
          
          // Use fallback model data if API fails
          const fallbackModels: AIModel[] = [
            {
              id: 1,
              name: "Apollo",
              accessUrl: "http://localhost:8002",
              description: "Apollo API is a RESTful API that provides historical market data and predictions for a given stock symbol.",
              modelStatus: "Active",
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              lastTrainedAt: new Date().toISOString(),
              version: "1.0.0"
            },
            {
              id: 2,
              name: "Ignis",
              accessUrl: "http://localhost:8003",
              description: "Ignis is a real-time predictor for the stock market.",
              modelStatus: "Active",
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              lastTrainedAt: new Date().toISOString(),
              version: "1.0.0"
            },
            {
              id: 3,
              name: "Gaia",
              accessUrl: "http://localhost:8001",
              description: "API for Gaia ensemble model combining helper model predictions.",
              modelStatus: "Active",
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              lastTrainedAt: new Date().toISOString(),
              version: "1.0.0"
            }
          ];
          
          setModels(fallbackModels);
          console.log('Models set to fallback data:', fallbackModels);
          setError('Using placeholder data: API endpoint may not be available.');
        } else {
          setModels(modelData);
          console.log('Models set to state:', modelData);
        }
        
        // Also fetch training status
        console.log('Fetching training status...');
        const status = await businessDomainService.getTrainingStatus();
        console.log('Received training status:', status);
        setTrainingStatus(status || {});
        
      } catch (error) {
        console.error('Error fetching models or training status:', error);
        
        // Use fallback model data if API fails
        const fallbackModels: AIModel[] = [
          {
            id: 1,
            name: "Apollo",
            accessUrl: "http://localhost:8002",
            description: "Apollo API is a RESTful API that provides historical market data and predictions for a given stock symbol.",
            modelStatus: "Active",
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            lastTrainedAt: new Date().toISOString(),
            version: "1.0.0"
          },
          {
            id: 2,
            name: "Ignis",
            accessUrl: "http://localhost:8003",
            description: "Ignis is a real-time predictor for the stock market.",
            modelStatus: "Active",
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            lastTrainedAt: new Date().toISOString(),
            version: "1.0.0"
          },
          {
            id: 3,
            name: "Gaia",
            accessUrl: "http://localhost:8001",
            description: "API for Gaia ensemble model combining helper model predictions.",
            modelStatus: "Active",
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            lastTrainedAt: new Date().toISOString(),
            version: "1.0.0"
          }
        ];
        
        setModels(fallbackModels);
        setError('Failed to load AI model data. Using placeholder data for demonstration.');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    console.log('isAdmin state:', isAdmin);
    if (isAdmin === true) {
      fetchModels();
    } else if (isAdmin !== null) {
      // If isAdmin is false (but not null), set loading to false
      setLoading(false);
    }
  }, [isAdmin]);

  // Refresh training status periodically
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchTrainingStatus = async () => {
      try {
        const status = await businessDomainService.getTrainingStatus();
        setTrainingStatus(status);
      } catch (error) {
        console.error('Error fetching training status:', error);
      }
    };

    const intervalId = setInterval(fetchTrainingStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isAdmin]);

  const handleTrainModel = async (modelId: number, modelName: string) => {
    try {
      const result = await businessDomainService.initiateModelRetraining(modelId);
      if (result) {
        // Update training status immediately for UI feedback
        setTrainingStatus(prev => ({ ...prev, [modelId]: true }));
        setSnackbar({
          open: true,
          message: `Training initiated for ${modelName}`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Failed to initiate training for ${modelName}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error(`Error training model ${modelId}:`, error);
      setSnackbar({
        open: true,
        message: `Error starting training for ${modelName}`,
        severity: 'error'
      });
    }
  };

  const handleTrainAllModels = async () => {
    try {
      const result = await businessDomainService.checkAndRetrainAllModels();
      const modelsInTraining = Object.entries(result)
        .filter(([, isTraining]) => isTraining)
        .map(([modelId]) => parseInt(modelId));
      
      if (modelsInTraining.length > 0) {
        // Update training status immediately for UI feedback
        const updatedStatus = { ...trainingStatus };
        modelsInTraining.forEach(modelId => {
          updatedStatus[modelId] = true;
        });
        setTrainingStatus(updatedStatus);
        
        setSnackbar({
          open: true,
          message: `Training initiated for ${modelsInTraining.length} models`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No models required training',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error training all models:', error);
      setSnackbar({
        open: true,
        message: 'Failed to check and train models',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (model: AIModel): 'success' | 'warning' | 'error' => {
    if (trainingStatus[model.id]) {
      return 'warning'; // Model is training
    }
    
    return model.modelStatus.toLowerCase() === 'active' 
      ? 'success' 
      : 'error';
  };

  const getStatusText = (model: AIModel): string => {
    if (trainingStatus[model.id]) {
      return 'Training';
    }
    
    return model.modelStatus;
  };

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      if (!isAdmin) return;
      
      setLogsLoading(true);
      try {
        const logsData = await businessDomainService.getLogs(50);
        setLogs(Array.isArray(logsData) ? logsData : []);
        setLogsError(null);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setLogsError('Failed to load system logs. Please try again later.');
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };

    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  // Sort logs
  const handleRequestSort = (property: keyof LogEntry) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Apply sorting to logs
  const sortedLogs = React.useMemo(() => {
    if (!Array.isArray(logs)) return [];
    
    const comparator = (a: LogEntry, b: LogEntry) => {
      let comparison = 0;
      
      if (orderBy === 'timeStamp') {
        comparison = new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime();
      } else if (orderBy === 'level') {
        comparison = a.level.localeCompare(b.level);
      } else if (orderBy === 'id') {
        comparison = a.id - b.id;
      } else {
        comparison = String(a[orderBy]).localeCompare(String(b[orderBy]));
      }

      return order === 'desc' ? -comparison : comparison;
    };

    return [...logs].sort(comparator);
  }, [logs, order, orderBy]);

  // Get color for log level
  const getLogLevelColor = (level: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'information':
        return 'info';
      default:
        return 'success';
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setUsersLoading(true);
    setUsersError(null);
    
    try {
      const response = await getAllUsers(true);
      // Ensure users is always an array
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersError('Failed to load user data.');
      // Set users to empty array on error
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle toggling user active status
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await updateUserActiveStatus(userId, !currentStatus);
      
      // Update the user in the local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
      
      setSnackbar({
        open: true,
        message: `User status updated successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user status',
        severity: 'error'
      });
    }
  };

  // Refresh all data
  const refreshAllData = useCallback(() => {
    if (isAdmin === true) {
      // Reset timer
      setTimeUntilRefresh(30);
      
      // Fetch all data
      const fetchModels = async () => {
        try {
          console.log('Admin is true, fetching AI models...');
          const modelData = await businessDomainService.getAllModels();
          setModels(Array.isArray(modelData) ? modelData : []);
          
          // Also fetch training status
          console.log('Fetching training status...');
          const status = await businessDomainService.getTrainingStatus();
          setTrainingStatus(status || {});
        } catch (error) {
          console.error('Error fetching models or training status:', error);
          setModels([]);
        }
      };
      
      const fetchLogs = async () => {
        setLogsLoading(true);
        try {
          const logData = await businessDomainService.getLogs();
          setLogs(Array.isArray(logData) ? logData : []);
          setLogsError(null);
        } catch (error) {
          console.error('Error fetching logs:', error);
          setLogsError('Failed to load system logs. Please try again later.');
          setLogs([]);
        } finally {
          setLogsLoading(false);
        }
      };
      
      fetchModels();
      fetchLogs();
      fetchUsers();
    }
  }, [isAdmin, setModels, setTrainingStatus, setLogs, setLogsError, setLogsLoading, fetchUsers]);

  // Timer for auto-refresh
  useEffect(() => {
    if (!isAdmin || !isTimerActive) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeUntilRefresh(prev => {
        if (prev <= 1) {
          refreshAllData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAdmin, isTimerActive, refreshAllData]);

  // Initial data fetch
  useEffect(() => {
    if (isAdmin === true) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Redirect if not authenticated
  if (isAuthenticated === false) {
    return <Navigate to="/login" />;
  }

  // Redirect if not admin
  if (isAdmin === false) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Title and Refresh Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Box display="flex" alignItems="center">
          <Tooltip title="Auto-refresh">
            <Switch 
              checked={isTimerActive}
              onChange={() => setIsTimerActive(prev => !prev)}
              color="primary"
            />
          </Tooltip>
          
          <Tooltip title="Time until next refresh">
            <Box display="flex" alignItems="center" ml={1} mr={2}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{timeUntilRefresh}s</Typography>
            </Box>
          </Tooltip>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={refreshAllData}
            disabled={loading || logsLoading || usersLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {isAdmin !== null && !isAdmin && (
        <Alert severity="error" sx={{ mb: 4 }}>
          You do not have administrator privileges. Please contact your system administrator.
        </Alert>
      )}

      {isAdmin !== null && isAdmin && (
        <>
          {/* AI Models section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              AI Models
            </Typography>
            <Button 
              variant="contained"
              color="primary"
              onClick={handleTrainAllModels}
              disabled={loading || !!error}
            >
              Check & Train All Models
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading model data...</Typography>
            </Box>
          ) : models.length === 0 ? (
            <Alert severity="info">
              No AI models found. Please make sure the backend services are running.
            </Alert>
          ) : (
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1.5 }}>
                {Array.isArray(models) && models.length > 0 ? (
                  models.map((model) => (
                    <Box 
                      key={model.id} 
                      sx={{ 
                        width: { xs: '100%', sm: '50%', md: '33.33%' }, 
                        padding: 1.5,
                        boxSizing: 'border-box'
                      }}
                    >
                      <Card sx={{ 
                        height: '100%',
                        display: 'flex', 
                        flexDirection: 'column',
                        minHeight: '380px' // Set minimum height for consistency
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" component="div">
                              {model.name}
                            </Typography>
                            <Chip 
                              label={getStatusText(model)}
                              color={getStatusColor(model)}
                            />
                          </Box>
                          
                          <Box sx={{ 
                            height: '60px', 
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                            >
                              {model.description}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Version:</strong> {model.version || 'N/A'}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Created:</strong> {new Date(model.createdAt).toLocaleDateString()}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Last Updated:</strong> {new Date(model.lastUpdated).toLocaleDateString()}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Last Trained:</strong> {model.lastTrainedAt ? new Date(model.lastTrainedAt).toLocaleString() : 'Never'}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ mt: 'auto', pt: 0, pb: 2, px: 2 }}>
                          <Button 
                            fullWidth
                            variant="contained"
                            size="medium" 
                            color="primary"
                            disabled={trainingStatus[model.id] || (model.name.toLowerCase() !== 'apollo' && model.name.toLowerCase() !== 'ignis')}
                            onClick={() => handleTrainModel(model.id, model.name)}
                          >
                            {trainingStatus[model.id] ? 'Training...' : 'TRAIN MODEL'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ width: '100%', p: 2 }}>
                    <Typography variant="body1" align="center">No models to display</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Users Management Section */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
            User Management
          </Typography>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : usersError ? (
                <Alert severity="error">{usersError}</Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table aria-label="user management table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Last Login</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(users) && users.length > 0 ? (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip 
                                label={user.role} 
                                color={user.role === 'Admin' ? 'primary' : 'default'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={user.isActive ? 'Active' : 'Inactive'} 
                                color={user.isActive ? 'success' : 'error'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                variant="outlined"
                                color={user.isActive ? 'error' : 'success'}
                                size="small"
                                onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No users found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* System Logs section */}
          <Box sx={{ mt: 6, mb: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              System Logs
            </Typography>
          </Box>
          
          {logsError && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {logsError}
            </Alert>
          )}
          
          {logsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 4 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1 }}>Loading logs...</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'timeStamp'}
                        direction={orderBy === 'timeStamp' ? order : 'asc'}
                        onClick={() => handleRequestSort('timeStamp')}
                      >
                        Timestamp
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'level'}
                        direction={orderBy === 'level' ? order : 'asc'}
                        onClick={() => handleRequestSort('level')}
                      >
                        Level
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Process</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!Array.isArray(sortedLogs) || sortedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No logs found</TableCell>
                    </TableRow>
                  ) : (
                    sortedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>{new Date(log.timeStamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.level}
                            color={getLogLevelColor(log.level)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {log.message}
                          {log.exception && (
                            <Box sx={{ 
                              mt: 1, 
                              p: 1, 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              maxHeight: '80px',
                              overflow: 'auto'
                            }}>
                              {log.exception.split('\n').slice(0, 3).join('\n')}
                              {log.exception.split('\n').length > 3 && '...'}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{log.processName} ({log.processId})</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Admin; 