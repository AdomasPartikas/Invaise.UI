import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useMarketStatus } from '../../contexts/MarketStatusContext';
import { 
  Person, 
  Logout, 
  Dashboard as DashboardIcon, 
  AccountBalance as PortfolioIcon,
  Receipt as TransactionsIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { businessDomainService } from '../../api/businessDomainService';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isMarketOpen } = useMarketStatus();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [isAdmin, setIsAdmin] = useState(false);

  // Debug logging for market status - only log when component mounts
  useEffect(() => {
    console.log("Navbar: Initial market status -", isMarketOpen ? "OPEN" : "CLOSED");
    // No additional checks or dependencies to avoid loops
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (isAuthenticated) {
        try {
          const adminStatus = await businessDomainService.isAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };
    
    checkAdmin();
  }, [isAuthenticated]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Get user initials for the avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // For debugging: Force market closed indicator to show regardless of API state
  const forceShowClosedIndicator = false; // Set to false to use the actual API result

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          bgcolor: 'background.paper', 
          color: 'text.primary',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
              fontWeight: 'bold',
            }}
          >
            Invaise
          </Typography>

          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                startIcon={<DashboardIcon />}
                sx={{ mr: 2 }}
              >
                Dashboard
              </Button>

              <Button
                component={RouterLink}
                to="/portfolio"
                color="inherit"
                startIcon={<PortfolioIcon />}
                sx={{ mr: 2 }}
              >
                Portfolio
              </Button>

              <Button
                component={RouterLink}
                to="/transactions"
                color="inherit"
                startIcon={<TransactionsIcon />}
                sx={{ mr: 2 }}
              >
                Transactions
              </Button>

              {isAdmin && (
                <Button
                  component={RouterLink}
                  to="/admin"
                  color="inherit"
                  startIcon={<AdminIcon />}
                  sx={{ mr: 2 }}
                >
                  Admin
                </Button>
              )}

              <Tooltip title="Account">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  aria-controls={open ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1.5,
                      borderRadius: 2,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    }
                  }
                }}
              >
                <MenuItem component={RouterLink} to="/profile">
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button component={RouterLink} to="/login" color="inherit" sx={{ mr: 1 }}>
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                color="primary"
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
        
        {/* Market status indicator - show either when API says closed or when forced for testing */}
        {(!isMarketOpen || forceShowClosedIndicator) && (
          <Box 
            sx={{ 
              height: '4px', 
              width: '100%', 
              bgcolor: 'rgba(211, 47, 47, 0.7)', // Red with transparency
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        )}
        
        {(!isMarketOpen || forceShowClosedIndicator) && (
          <Box
            sx={{
              bgcolor: 'rgba(211, 47, 47, 0.1)',
              py: 0.5,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="error" fontWeight="medium">
              Market is currently closed. Transactions will be put on hold until the market reopens.
            </Typography>
          </Box>
        )}
      </AppBar>
    </>
  );
};

export default Navbar; 