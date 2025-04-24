import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  useTheme,
  Divider,
  ListItemIcon,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle,
  Logout,
  Dashboard,
  Person,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const isProfileMenuOpen = Boolean(anchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper', 
          color: 'text.primary',
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h5"
              component="div"
              fontWeight="bold"
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Invaise
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <Button color="inherit" startIcon={<Dashboard />} sx={{ mx: 1 }}>Dashboard</Button>
            <Button color="inherit" startIcon={<TrendingUp />} sx={{ mx: 1 }}>Markets</Button>
            <Button color="inherit" startIcon={<AccountBalance />} sx={{ mx: 1 }}>Portfolio</Button>
          </Box>

          {/* Search Bar */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: '20px',
              backgroundColor: alpha(theme.palette.common.black, 0.05),
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.black, 0.1),
              },
              marginRight: 2,
              marginLeft: 2,
              width: { xs: '100%', sm: 'auto' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            <Box sx={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 12px' }}>
              <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box>
            <InputBase
              placeholder="Search…"
              sx={{
                padding: '8px 8px 8px 40px',
                transition: '0.3s',
                width: '100%',
                [theme.breakpoints.up('md')]: {
                  width: '300px',
                },
              }}
            />
          </Box>

          {/* Right side icons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" onClick={handleNotificationsMenuOpen}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <SettingsIcon />
            </IconButton>
            <IconButton
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar 
                alt="User Avatar" 
                src="/static/images/avatar/1.jpg" 
                sx={{ width: 32, height: 32, border: `2px solid ${theme.palette.primary.main}` }}
              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        id="profile-menu"
        keepMounted
        open={isProfileMenuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 220,
            borderRadius: 2,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ py: 1, px: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">John Doe</Typography>
          <Typography variant="body2" color="text.secondary">john.doe@example.com</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Account Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications dropdown menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        id="notifications-menu"
        keepMounted
        open={isNotificationsMenuOpen}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            borderRadius: 2,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationsClose} sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">AAPL: Price Alert</Typography>
            <Typography variant="caption" color="text.secondary">
              Apple Inc. reached your target price of $180.00
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose} sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">Portfolio Update</Typography>
            <Typography variant="caption" color="text.secondary">
              Your portfolio has increased by 2.3% today.
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              2 hours ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose} sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">New Feature Available</Typography>
            <Typography variant="caption" color="text.secondary">
              Check out our new portfolio analysis tools.
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              1 day ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
          <Button size="small" onClick={handleNotificationsClose}>
            View all notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default Navbar; 