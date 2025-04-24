import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import { Dashboard, Portfolio } from './pages';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/common/Notification';

// Create a theme instance
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

// Protected Route component that uses useAuth
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AuthProvider needs to be outside of Router since components inside Router use useAuth */}
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <NotificationContainer />
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected routes with PortfolioProvider */}
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
                path="/optimization" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div>Optimization Page (Coming Soon)</div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
