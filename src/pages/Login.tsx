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

const gradientBackground = 'linear-gradient(135deg, #7467ef 0%, #c662e0 100%)';

const Login: React.FC = () => {
  const { login, register, updatePersonalInfo, forgotPassword, isLoading } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openPersonalInfoDialog, setOpenPersonalInfoDialog] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setIsForgotPasswordMode(false);
    setEmail('');
    setPassword('');
    setName('');
    clearErrors();
  };
  
  const toggleForgotPasswordMode = () => {
    setIsForgotPasswordMode(true);
    setIsLoginMode(false);
    setEmail('');
    setPassword('');
    setName('');
    clearErrors();
  };
  
  const backToLogin = () => {
    setIsForgotPasswordMode(false);
    setIsLoginMode(true);
    setEmail('');
    clearErrors();
  };

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setNameError('');
  };
  
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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    
    if (!isEmailValid) {
      return;
    }
    
    try {
      const result = await forgotPassword(email);
      addNotification('success', 'If your email exists in our system, a password reset email has been sent.');
      backToLogin();
    } catch (error: any) {
      console.error('Forgot password error:', error);
      addNotification('error', getErrorMessage(error));
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      const currentUser = JSON.parse(localStorage.getItem('invaise_user') || '{}');
      setNewUserId(currentUser.id || '');
      setOpenPersonalInfoDialog(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      addNotification('error', getErrorMessage(error));
    }
  };
  
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
  
  const renderFormTitle = () => {
    if (isForgotPasswordMode) {
      return 'Forgot Password';
    }
    return isLoginMode ? 'Login' : 'Create Account';
  };

  const renderForm = () => {
    if (isForgotPasswordMode) {
      return (
        <Box component="form" onSubmit={handleForgotPassword} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
          
          <Button
            fullWidth
            variant="text"
            onClick={backToLogin}
            sx={{ mb: 2 }}
          >
            Back to Login
          </Button>
        </Box>
      );
    }

    if (isLoginMode) {
      return (
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Link component="button" variant="body2" onClick={toggleForgotPasswordMode}>
              Forgot password?
            </Link>
            <Link component="button" variant="body2" onClick={toggleMode}>
              Don't have an account? Sign Up
            </Link>
          </Box>
        </Box>
      );
    }
    
    return (
      <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Full Name"
          name="name"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!nameError}
          helperText={nameError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!emailError}
          helperText={emailError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!passwordError}
          helperText={passwordError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
        </Button>
        
        <Link component="button" variant="body2" onClick={toggleMode}>
          Already have an account? Sign In
        </Link>
      </Box>
    );
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
            color: 'white',
            padding: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2, zIndex: 1 }}>
            Invaise
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: '80%', mb: 4, zIndex: 1 }}>
            Your advanced platform for investment portfolio management powered by AI.
          </Typography>
        </Box>
        
        {/* Right side - Authentication form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            backgroundColor: 'white',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight={600} color="primary">
              {renderFormTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {isForgotPasswordMode 
                ? 'Enter your email to receive a temporary password' 
                : isLoginMode 
                  ? 'Welcome back! Please sign in to continue.' 
                  : 'Create a new account to get started.'}
            </Typography>
          </Box>
          
          {renderForm()}
        </Box>
      </Paper>
      
      {/* Personal info dialog after registration */}
      <Dialog open={openPersonalInfoDialog} fullWidth maxWidth="sm">
        <PersonalInfoForm 
          onSubmit={handlePersonalInfoSubmit}
          onSkip={() => {
            setOpenPersonalInfoDialog(false);
            navigate('/');
          }}
          isLoading={isLoading}
        />
      </Dialog>
    </Box>
  );
};

export default Login; 