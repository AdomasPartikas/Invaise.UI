import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';

interface PerformanceReportDialogProps {
  open: boolean;
  portfolioId: string;
  portfolioName: string;
  onClose: () => void;
  onDownload: (portfolioId: string, startDate: string, endDate: string) => Promise<void>;
  isLoading: boolean;
}

const PerformanceReportDialog: React.FC<PerformanceReportDialogProps> = ({
  open,
  portfolioId,
  portfolioName,
  onClose,
  onDownload,
  isLoading
}) => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const [startDate, setStartDate] = useState(oneMonthAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  
  const validateDates = () => {
    let isValid = true;
    
    if (!startDate) {
      setStartDateError('Start date is required');
      isValid = false;
    } else {
      setStartDateError('');
    }
    
    if (!endDate) {
      setEndDateError('End date is required');
      isValid = false;
    } else {
      setEndDateError('');
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        setEndDateError('End date must be after start date');
        isValid = false;
      } else if (end > today) {
        setEndDateError('End date cannot be in the future');
        isValid = false;
      }
    }
    
    return isValid;
  };
  
  const handleDownload = async () => {
    if (validateDates()) {
      await onDownload(portfolioId, startDate, endDate);
    }
  };
  
  return (
    <Dialog open={open} onClose={!isLoading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        Download Performance Report for {portfolioName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            error={!!startDateError}
            helperText={startDateError}
            disabled={isLoading}
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            error={!!endDateError}
            helperText={endDateError}
            disabled={isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDownload}
          startIcon={isLoading ? <CircularProgress size={20} /> : <PictureAsPdf />}
          disabled={isLoading}
        >
          {isLoading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PerformanceReportDialog; 