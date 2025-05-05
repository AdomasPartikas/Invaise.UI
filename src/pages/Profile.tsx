import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormHelperText,
  SelectChangeEvent,
  Stack,
  Divider,
} from '@mui/material';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { UserPersonalInfo, UserPreferences } from '../types/auth';
import { format, parseISO } from 'date-fns';

const Profile = () => {
  const { user } = useAuth();
  const { personalInfo, preferences, isLoading, error, updatePersonalInfo, updatePreferences } = useUser();
  
  // Personal info form state
  const [personalFormData, setPersonalFormData] = useState<UserPersonalInfo>({
    address: '',
    phoneNumber: '',
    dateOfBirth: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
  });

  // Preferences form state
  const [preferencesFormData, setPreferencesFormData] = useState<UserPreferences>({
    riskTolerance: 5,
    investmentHorizon: 'Medium',
  });

  // Form submission status
  const [personalInfoSubmitting, setPersonalInfoSubmitting] = useState(false);
  const [preferencesSubmitting, setPreferencesSubmitting] = useState(false);
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState(false);

  // Update form data when user data is fetched
  useEffect(() => {
    if (personalInfo) {
      const dateOfBirth = personalInfo.dateOfBirth 
        ? new Date(personalInfo.dateOfBirth).toISOString().split('T')[0]  // Format as YYYY-MM-DD
        : new Date().toISOString().split('T')[0];

      setPersonalFormData({
        address: personalInfo.address || '',
        phoneNumber: personalInfo.phoneNumber || '',
        dateOfBirth: dateOfBirth,
      });
    }
    
    if (preferences) {
      setPreferencesFormData({
        riskTolerance: preferences.riskTolerance || 5,
        investmentHorizon: preferences.investmentHorizon || 'Medium',
      });
    }
  }, [personalInfo, preferences]);

  // Handle personal info form changes
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle risk tolerance slider change
  const handleRiskToleranceChange = (_: Event, value: number | number[]) => {
    setPreferencesFormData(prev => ({ 
      ...prev, 
      riskTolerance: value as number 
    }));
  };

  // Handle investment horizon change
  const handleInvestmentHorizonChange = (e: SelectChangeEvent) => {
    setPreferencesFormData(prev => ({ 
      ...prev, 
      investmentHorizon: e.target.value 
    }));
  };

  // Submit personal info form
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalInfoSubmitting(true);
    setPersonalInfoSuccess(false);
    
    try {
      // Convert the date string to ISO format for the API
      const formData = {
        ...personalFormData,
        dateOfBirth: personalFormData.dateOfBirth 
          ? new Date(personalFormData.dateOfBirth).toISOString()
          : new Date().toISOString()
      };
      
      await updatePersonalInfo(formData);
      setPersonalInfoSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setPersonalInfoSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating personal info:', err);
    } finally {
      setPersonalInfoSubmitting(false);
    }
  };

  // Submit preferences form
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesSubmitting(true);
    setPreferencesSuccess(false);
    
    try {
      await updatePreferences(preferencesFormData);
      setPreferencesSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setPreferencesSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating preferences:', err);
    } finally {
      setPreferencesSubmitting(false);
    }
  };

  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
        Your Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* User Info */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f9f9f9)'
        }}
      >
        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
          Account Information
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Grid container spacing={2} sx={{ maxWidth: 500 }}>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <Stack spacing={2} direction="column" alignItems="center">
                <Box 
                  sx={{ 
                    p: 2, 
                    mb: 1, 
                    width: '100%', 
                    borderRadius: 1, 
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {user?.name}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    p: 2, 
                    width: '100%', 
                    borderRadius: 1, 
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {user?.email}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Personal Information Form */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f9f9f9)'
        }}
      >
        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
          Personal Information
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <form onSubmit={handlePersonalInfoSubmit} style={{ width: '100%', maxWidth: 600 }}>
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: { xs: 'span 12' } }}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={personalFormData.address}
                  onChange={handlePersonalInfoChange}
                  variant="outlined"
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={personalFormData.phoneNumber}
                  onChange={handlePersonalInfoChange}
                  variant="outlined"
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={personalFormData.dateOfBirth}
                  onChange={handlePersonalInfoChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {personalInfoSuccess && (
                <Alert severity="success" sx={{ mr: 2, flex: 1 }}>
                  Personal information updated successfully!
                </Alert>
              )}
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={personalInfoSubmitting}
                sx={{ minWidth: 100 }}
              >
                {personalInfoSubmitting ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
      
      {/* Preferences Form */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f9f9f9)'
        }}
      >
        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
          Investment Preferences
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <form onSubmit={handlePreferencesSubmit} style={{ width: '100%', maxWidth: 600 }}>
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: { xs: 'span 12' } }}>
                <Typography id="risk-tolerance-slider" gutterBottom align="center">
                  Risk Tolerance
                </Typography>
                <Slider
                  value={preferencesFormData.riskTolerance}
                  onChange={handleRiskToleranceChange}
                  aria-labelledby="risk-tolerance-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={10}
                  sx={{ 
                    mx: 2,
                    '& .MuiSlider-thumb': {
                      height: 24,
                      width: 24,
                    }
                  }}
                />
                <FormHelperText sx={{ textAlign: 'center', mt: 1 }}>
                  1 = Very Conservative, 10 = Very Aggressive
                </FormHelperText>
              </Grid>
              <Grid sx={{ gridColumn: { xs: 'span 12' } }}>
                <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                  <InputLabel id="investment-horizon-label">Investment Horizon</InputLabel>
                  <Select
                    labelId="investment-horizon-label"
                    value={preferencesFormData.investmentHorizon}
                    label="Investment Horizon"
                    onChange={handleInvestmentHorizonChange}
                  >
                    <MenuItem value="Short">Short (Under 5 years)</MenuItem>
                    <MenuItem value="Medium">Medium (5-10 years)</MenuItem>
                    <MenuItem value="Long">Long (10+ years)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {preferencesSuccess && (
                <Alert severity="success" sx={{ mr: 2, flex: 1 }}>
                  Preferences updated successfully!
                </Alert>
              )}
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={preferencesSubmitting}
                sx={{ minWidth: 100 }}
              >
                {preferencesSubmitting ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile; 