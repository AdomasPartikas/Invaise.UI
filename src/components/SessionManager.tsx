import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { SESSION_EXPIRED_EVENT, SESSION_ABOUT_TO_EXPIRE_EVENT, dispatchSessionEvent } from '../api/api';

// Material UI components (assuming your project uses Material UI)
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from '@mui/material';

// Interface for props
interface SessionManagerProps {
  // Time in minutes before token expiry to show warning (default: 5 minutes)
  warningTime?: number;
}

const SessionManager: React.FC<SessionManagerProps> = ({ warningTime = 5 }) => {
  const navigate = useNavigate();
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle session expired event
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('Session expired event received');
      setShowExpiredDialog(true);
    };

    // Listen for session expired event
    document.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      document.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  // Handle session about to expire event
  useEffect(() => {
    const handleSessionWarning = () => {
      console.log('Session about to expire event received');
      setShowWarningDialog(true);
    };

    // Listen for session warning event
    document.addEventListener(SESSION_ABOUT_TO_EXPIRE_EVENT, handleSessionWarning);

    return () => {
      document.removeEventListener(SESSION_ABOUT_TO_EXPIRE_EVENT, handleSessionWarning);
    };
  }, []);

  // Timer to check session expiry
  useEffect(() => {
    const checkSessionStatus = () => {
      const expiry = authService.getTokenExpiry();

      // No expiry date, no session to monitor
      if (!expiry) return;

      const now = new Date();
      const warningThreshold = new Date(expiry.getTime() - warningTime * 60 * 1000);

      if (now > expiry) {
        // Token is already expired
        dispatchSessionEvent(SESSION_EXPIRED_EVENT);
      } else if (now > warningThreshold && !showWarningDialog && !showExpiredDialog) {
        // Token is about to expire and dialogs aren't already showing
        dispatchSessionEvent(SESSION_ABOUT_TO_EXPIRE_EVENT);
      }
    };

    // Check immediately and then every minute
    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, [warningTime, showWarningDialog, showExpiredDialog]);

  // Handle session refresh
  const handleRefreshSession = async () => {
    setRefreshing(true);
    const result = await authService.refreshToken();
    setRefreshing(false);

    if (result) {
      // Success - token refreshed
      setShowWarningDialog(false);
      setShowExpiredDialog(false);
      setShowSuccessMessage(true);
    } else {
      // Failed to refresh token
      handleLogout();
    }
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setShowWarningDialog(false);
    setShowExpiredDialog(false);
    navigate('/login');
  };

  // Handle close of success message
  const handleCloseSuccess = () => {
    setShowSuccessMessage(false);
  };

  return (
    <>
      {/* Session Expired Dialog */}
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

      {/* Session Warning Dialog */}
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

      {/* Success Message */}
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