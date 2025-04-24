import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Link, 
  InputAdornment, 
  IconButton, 
  Dialog,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, Person, Email, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../context/NotificationContext';
import PersonalInfoForm from '../components/auth/PersonalInfoForm';
import { AxiosError } from 'axios';

// Gradient background
const gradientBackground = 'linear-gradient(135deg, #7467ef 0%, #c662e0 100%)';

const Login: React.FC = () => {
  const { login, register, updatePersonalInfo, isLoading } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  
  // Form states
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [openPersonalInfoDialog, setOpenPersonalInfoDialog] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  
  // Toggle between login and register mode
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // Clear form fields and errors when switching modes
    setEmail('');
    setPassword('');
    setName('');
    clearErrors();
  };
  
  // Clear all error messages
  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setNameError('');
  };
  
  // Validate email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!re.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  // Validate password
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  // Validate name
  const validateName = (name: string): boolean => {
    if (!name) {
      setNameError('Name is required');
      return false;
    } else if (name.length < 3) {
      setNameError('Name must be at least 3 characters');
      return false;
    }
    setNameError('');
    return true;
  };
  
  // Extract error message from an error object
  const getErrorMessage = (error: any): string => {
    if (error.userMessage) {
      return error.userMessage;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.message) {
      return error.message === 'Network Error' 
        ? 'Unable to connect to the server. Please check your network connection.' 
        : error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };
  
  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    try {
      await login({ email, password });
      addNotification('success', 'Login successful!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      addNotification('error', getErrorMessage(error));
    }
  };
  
  // Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isNameValid = validateName(name);
    
    if (!isEmailValid || !isPasswordValid || !isNameValid) {
      return;
    }
    
    try {
      await register({ 
        email, 
        password, 
        name
      });
      
      addNotification('success', 'Registration successful!');
      
      // Open personal info form after successful registration
      const currentUser = JSON.parse(localStorage.getItem('invaise_user') || '{}');
      setNewUserId(currentUser.id || '');
      setOpenPersonalInfoDialog(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      addNotification('error', getErrorMessage(error));
    }
  };
  
  // Handle personal info submission
  const handlePersonalInfoSubmit = async (personalInfo: any) => {
    try {
      await updatePersonalInfo(newUserId, personalInfo);
      setOpenPersonalInfoDialog(false);
      addNotification('success', 'Personal information updated successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Error updating personal info:', error);
      addNotification('error', getErrorMessage(error));
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: gradientBackground,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient shapes */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            bottom: '15%',
            left: '10%',
            transform: 'rotate(-20deg)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '38% 62% 64% 36% / 43% 35% 65% 57%',
            top: '10%',
            right: '10%',
            transform: 'rotate(45deg)',
          },
        }}
      />

      <Paper
        elevation={10}
        sx={{
          display: 'flex',
          borderRadius: 3,
          overflow: 'hidden',
          width: '90%',
          maxWidth: 900,
          minHeight: 500,
          zIndex: 1,
          position: 'relative',
        }}
      >
        {/* Left side - Branding */}
        <Box
          sx={{
            width: { xs: '0%', md: '50%' },
            background: gradientBackground,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography variant="h3" fontWeight="bold" align="center">
            Welcome to Invaise
          </Typography>
          <Typography variant="body1" align="center" sx={{ mt: 3, mb: 4, maxWidth: '80%' }}>
            Investment portfolio optimization powered by AI to help you achieve your financial goals.
          </Typography>
          
          {/* Animated diagonals */}
          <Box
            sx={{
              position: 'absolute',
              width: '150%',
              height: '100%',
              transform: 'rotate(-20deg)',
              left: '-25%',
              bottom: '-50%',
              display: 'flex',
              justifyContent: 'space-between',
              zIndex: 0,
            }}
          >
            {Array.from({ length: 10 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  height: '1000px',
                  width: '3px',
                  background: 'rgba(255,255,255,0.15)',
                  marginRight: '30px',
                  boxShadow: '0 0 12px rgba(255,255,255,0.3)',
                  animation: `moveUpDown ${(Math.random() * 3) + 4}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  '@keyframes moveUpDown': {
                    '0%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-100px)' },
                    '100%': { transform: 'translateY(0)' },
                  },
                }}
              />
            ))}
          </Box>
          
          {/* Circles */}
          {Array.from({ length: 5 }).map((_, index) => (
            <Box
              key={`circle-${index}`}
              sx={{
                position: 'absolute',
                width: `${50 + (index * 15)}px`,
                height: `${50 + (index * 15)}px`,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                zIndex: 0,
              }}
            />
          ))}
        </Box>

        {/* Right side - Login/Register form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold" align="center" sx={{ mb: 2 }}>
            {isLoginMode ? 'USER LOGIN' : 'CREATE ACCOUNT'}
          </Typography>
          
          <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
            {/* Name field (only for registration) */}
            {!isLoginMode && (
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!nameError}
                helperText={nameError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            
            {/* Email field */}
            <TextField
              fullWidth
              margin="normal"
              label="Email Address"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Password field */}
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Forgot password link (only for login) */}
            {isLoginMode && (
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Box>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ 
                mt: 3, 
                mb: 2,
                borderRadius: '50px',
                background: gradientBackground,
                py: 1.5,
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isLoginMode ? 'LOGIN' : 'REGISTER'
              )}
            </Button>

            {/* Toggle between login and register */}
            <Typography align="center" variant="body2">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <Link component="button" variant="body2" onClick={toggleMode}>
                {isLoginMode ? 'Register Now' : 'Login'}
              </Link>
            </Typography>
          </form>
        </Box>
      </Paper>
      
      {/* Personal Information Dialog */}
      <Dialog 
        open={openPersonalInfoDialog} 
        maxWidth="md"
        fullWidth 
        onClose={() => {}}
      >
        <PersonalInfoForm 
          onSubmit={handlePersonalInfoSubmit} 
          isLoading={isLoading} 
        />
      </Dialog>
    </Box>
  );
};

export default Login; 