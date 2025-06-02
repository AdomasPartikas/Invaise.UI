import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import { Dashboard, Portfolio, Profile, Transactions, Admin } from './pages';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { MarketStatusProvider } from './contexts/MarketStatusContext';
import NotificationContainer from './components/common/Notification';
import SessionManager from './components/SessionManager';
import { businessDomainService } from './api/businessDomainService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (isAuthenticated) {
          const adminStatus = await businessDomainService.isAdmin();
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  if (isLoading || checking) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const SessionManagerWrapper = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <SessionManager warningTime={5} /> : null;
};

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <MarketStatusProvider>
              <TransactionProvider>
                <Router>
                  <NotificationContainer />
                  <SessionManagerWrapper />
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <PortfolioProvider>
                            <Layout>
                              <Dashboard />
                            </Layout>
                          </PortfolioProvider>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/predictions" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <div>Predictions Page (Coming Soon)</div>
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/portfolio" 
                      element={
                        <ProtectedRoute>
                          <PortfolioProvider>
                            <Layout>
                              <Portfolio />
                            </Layout>
                          </PortfolioProvider>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/transactions" 
                      element={
                        <ProtectedRoute>
                          <PortfolioProvider>
                            <Layout>
                              <Transactions />
                            </Layout>
                          </PortfolioProvider>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/optimization" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <div>Optimization Page (Coming Soon)</div>
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <UserProvider>
                            <Layout>
                              <Profile />
                            </Layout>
                          </UserProvider>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRoute>
                          <Layout>
                            <Admin />
                          </Layout>
                        </AdminRoute>
                      } 
                    />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </TransactionProvider>
            </MarketStatusProvider>
          </NotificationProvider>
        </AuthProvider>
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
}

export default App;
