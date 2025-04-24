import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Badge,
  InputBase,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Notifications as NotificationsIcon,
  AccountCircle,
  ExpandMore,
  DarkMode,
  Settings,
  Logout
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/invaise-logo.png';

const DashboardNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const theme = useTheme();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'white',
        color: 'text.primary',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box 
          component="img"
          sx={{
            height: 36,
            width: 'auto',
            mr: 1
          }}
          alt="Invaise Logo"
          src={logo}
        />
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold', mr: 4 }}
        >
          Invaise
        </Typography>
        
        {/* Navigation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              mx: 2, 
              fontWeight: 600,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 3,
                borderRadius: 4,
                backgroundColor: theme.palette.primary.main,
              }
            }}
          >
            Dashboard
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              mx: 2, 
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' },
            }}
          >
            Portfolio
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              mx: 2, 
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' },
            }}
          >
            Markets
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              mx: 2, 
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' },
            }}
          >
            AI Insights
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Search */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: 20,
            backgroundColor: alpha(theme.palette.common.black, 0.04),
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.black, 0.06),
            },
            marginRight: theme.spacing(2),
            marginLeft: 0,
            width: '100%',
            [theme.breakpoints.up('sm')]: {
              marginLeft: theme.spacing(3),
              width: 'auto',
            },
          }}
        >
          <Box
            sx={{
              padding: theme.spacing(0, 2),
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SearchIcon />
          </Box>
          <InputBase
            placeholder="Search…"
            sx={{
              color: 'inherit',
              '& .MuiInputBase-input': {
                padding: theme.spacing(1, 1, 1, 0),
                paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                transition: theme.transitions.create('width'),
                width: '100%',
                [theme.breakpoints.up('md')]: {
                  width: '20ch',
                },
              },
            }}
          />
        </Box>
        
        {/* Notification Icon */}
        <IconButton 
          size="large" 
          color="inherit"
          onClick={handleNotificationMenuOpen}
        >
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        {/* User Profile */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            ml: 2,
            cursor: 'pointer',
            borderRadius: 20,
            px: 1,
            '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.04) }
          }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: theme.palette.primary.main 
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ ml: 1, mr: 0.5, display: { xs: 'none', md: 'block' } }}>
            <Typography variant="body2" fontWeight="medium">
              {user?.name || 'User'}
            </Typography>
          </Box>
          <ExpandMore sx={{ color: 'text.secondary', fontSize: 20 }} />
        </Box>
      </Toolbar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="profile-menu"
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 200,
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              my: 0.5,
              borderRadius: 1,
              mx: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <AccountCircle sx={{ mr: 1, fontSize: 20 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Settings sx={{ mr: 1, fontSize: 20 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DarkMode sx={{ mr: 1, fontSize: 20 }} />
          Dark Mode
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1, fontSize: 20 }} />
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        id="notifications-menu"
        keepMounted
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 320,
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              AAPL price alert
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Apple Inc. has risen above $180
            </Typography>
            <Typography variant="caption" color="text.secondary">
              5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Portfolio update
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your portfolio is up 2.3% today
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1 hour ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              AI recommendation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New AI insight available for your portfolio
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3 hours ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ 
              cursor: 'pointer',
              fontWeight: 'medium'
            }}
            onClick={handleNotificationMenuClose}
          >
            View all notifications
          </Typography>
        </Box>
      </Menu>
    </AppBar>
  );
};

export default DashboardNavbar; 