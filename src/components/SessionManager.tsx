import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { SESSION_EXPIRED_EVENT, SESSION_ABOUT_TO_EXPIRE_EVENT, dispatchSessionEvent } from '../api/api';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from '@mui/material';

interface SessionManagerProps {
  warningTime?: number;
}

const SessionManager: React.FC<SessionManagerProps> = ({ warningTime = 5 }) => {
  const navigate = useNavigate();
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setShowExpiredDialog(true);
    };

    document.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      document.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    const handleSessionWarning = () => {
      setShowWarningDialog(true);
    };

    document.addEventListener(SESSION_ABOUT_TO_EXPIRE_EVENT, handleSessionWarning);

    return () => {
      document.removeEventListener(SESSION_ABOUT_TO_EXPIRE_EVENT, handleSessionWarning);
    };
  }, []);

  useEffect(() => {
    const checkSessionStatus = () => {
      const expiry = authService.getTokenExpiry();

      if (!expiry) return;

      const now = new Date();
      const warningThreshold = new Date(expiry.getTime() - warningTime * 60 * 1000);

      if (now > expiry) {
        dispatchSessionEvent(SESSION_EXPIRED_EVENT);
      } else if (now > warningThreshold && !showWarningDialog && !showExpiredDialog) {
        dispatchSessionEvent(SESSION_ABOUT_TO_EXPIRE_EVENT);
      }
    };

    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, [warningTime, showWarningDialog, showExpiredDialog]);

  const handleRefreshSession = async () => {
    setRefreshing(true);
    const result = await authService.refreshToken();
    setRefreshing(false);

    if (result) {
      setShowWarningDialog(false);
      setShowExpiredDialog(false);
      setShowSuccessMessage(true);
    } else {
      handleLogout();
    }
  };

  const handleLogout = () => {
    authService.logout();
    setShowWarningDialog(false);
    setShowExpiredDialog(false);
    navigate('/login');
  };

  const handleCloseSuccess = () => {
    setShowSuccessMessage(false);
  };

  return (
    <>
      <Dialog
        open={showExpiredDialog}
        aria-labelledby="session-expired-dialog-title"
        aria-describedby="session-expired-dialog-description"
      >
        <DialogTitle id="session-expired-dialog-title">Session Expired</DialogTitle>
        <DialogContent>
          <DialogContentText id="session-expired-dialog-description">
            Your session has expired. Would you like to continue working by refreshing your session, or log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogout} color="secondary">
            Log Out
          </Button>
          <Button 
            onClick={handleRefreshSession} 
            color="primary" 
            variant="contained"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Continue Session'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showWarningDialog}
        aria-labelledby="session-warning-dialog-title"
        aria-describedby="session-warning-dialog-description"
      >
        <DialogTitle id="session-warning-dialog-title">Session Expiring Soon</DialogTitle>
        <DialogContent>
          <DialogContentText id="session-warning-dialog-description">
            Your session will expire in less than {warningTime} minutes. Would you like to extend your session?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarningDialog(false)} color="secondary">
            Dismiss
          </Button>
          <Button 
            onClick={handleRefreshSession} 
            color="primary" 
            variant="contained"
            disabled={refreshing}
          >
            {refreshing ? 'Extending...' : 'Extend Session'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={showSuccessMessage} 
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Session extended successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default SessionManager; 