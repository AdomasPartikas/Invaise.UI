import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { UserPersonalInfo, UserPreferences } from '../../types/auth';

interface PersonalInfoFormProps {
  onSubmit: (personalInfo: UserPersonalInfo) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ onSubmit, onSkip, isLoading = false }) => {
  const [personalInfo, setPersonalInfo] = useState<UserPersonalInfo>({
    address: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    riskTolerance: 5,
    investmentHorizon: 'medium-term'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    setPreferences(prev => ({ ...prev, riskTolerance: value as number }));
  };

  const handleInvestmentHorizonChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setPreferences(prev => ({ ...prev, investmentHorizon: e.target.value as string }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (personalInfo.dateOfBirth) {
      const dob = new Date(personalInfo.dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (age < 18) newErrors.dateOfBirth = 'You must be at least 18 years old';
      if (age > 120) newErrors.dateOfBirth = 'Please enter a valid date of birth';
    }
    
    if (personalInfo.phoneNumber && !/^[0-9\s\-+()]{8,20}$/.test(personalInfo.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(personalInfo);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onSubmit({});
    }
  };

  return (
    <>
      <DialogTitle>
        <Typography variant="h5" align="center" fontWeight="bold">
          Complete Your Profile
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Please provide additional information to personalize your investment experience
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contact Information
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '240px' }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={personalInfo.phoneNumber}
                  onChange={handlePersonalInfoChange}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                />
              </Box>
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '240px' }}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={personalInfo.dateOfBirth}
                  onChange={handlePersonalInfoChange}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth || 'Optional, must be at least 18 years old'}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Address
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 100%' }}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={personalInfo.address}
                  onChange={handlePersonalInfoChange}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Investment Preferences
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Risk Tolerance (1-10)</Typography>
              <Slider
                value={preferences.riskTolerance}
                onChange={handleSliderChange}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Conservative</Typography>
                <Typography variant="caption" color="text.secondary">Aggressive</Typography>
              </Box>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Investment Horizon</InputLabel>
              <Select
                value={preferences.investmentHorizon}
                label="Investment Horizon"
                onChange={handleInvestmentHorizonChange as any}
              >
                <MenuItem value="short-term">Short Term (&lt; 2 years)</MenuItem>
                <MenuItem value="medium-term">Medium Term (2-5 years)</MenuItem>
                <MenuItem value="long-term">Long Term (5+ years)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={handleSkip}
          color="inherit"
          disabled={isLoading}
        >
          Skip for Now
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save Information'}
        </Button>
      </DialogActions>
    </>
  );
};

export default PersonalInfoForm; 