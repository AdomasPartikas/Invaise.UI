import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useNotification } from '../../context/NotificationContext';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <Stack spacing={2} sx={{ 
      position: 'fixed', 
      top: 24, 
      right: 24, 
      zIndex: 2000,
      maxWidth: '400px'
    }}>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ position: 'static', mb: 1 }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default NotificationContainer; 