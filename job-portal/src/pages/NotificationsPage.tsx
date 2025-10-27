import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check,
  Delete,
  Person,
  Message,
  Work,
  Event,
  MarkEmailRead,
  DeleteSweep,
  Settings,
  ExpandMore,
  Science,
  VolumeUp,
  VolumeOff,
  Vibration,
  NotificationsActive,
  NotificationsOff,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, Notification as AppNotification } from '../services/notificationService';
import { realTimeNotificationService, NotificationPreferences } from '../services/realTimeNotificationService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    inApp: true,
    sound: true,
    vibration: true,
    connectionRequests: true,
    messages: true,
    jobMatches: true,
    courseUpdates: true,
    systemNotifications: true,
  });
  const [realTimeConnected, setRealTimeConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    initializeRealTimeNotifications();
    
    return () => {
      realTimeNotificationService.disconnect();
    };
  }, []);

  const initializeRealTimeNotifications = async () => {
    if (!user) return;

    try {
      await realTimeNotificationService.init(user._id);
      setPreferences(realTimeNotificationService.getPreferences());
      setUnreadCount(realTimeNotificationService.getUnreadCount());

      // Listen for real-time events
      realTimeNotificationService.on('socket-connected', setRealTimeConnected);
      realTimeNotificationService.on('new-notification', handleNewNotification);
      realTimeNotificationService.on('unread-count-changed', setUnreadCount);
      realTimeNotificationService.on('notification-read', handleNotificationRead);
      realTimeNotificationService.on('notification-deleted', handleNotificationDeleted);
    } catch (error) {
      console.error('Error initializing real-time notifications:', error);
    }
  };

  const handleNewNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev]);
    setSuccessMessage('New notification received!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleNotificationRead = (data: { notificationId: string }) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === data.notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleNotificationDeleted = (data: { notificationId: string }) => {
    setNotifications(prev => prev.filter(notif => notif._id !== data.notificationId));
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications(1, 50);
      
      console.log('Notifications API response:', response); // Debug log
      
      // The API returns { success: true, data: { notifications: [...], ... } }
      const notificationsData = response.data?.notifications || response.notifications || [];
      
      console.log('Extracted notifications data:', notificationsData); // Debug log
      
      if (!Array.isArray(notificationsData)) {
        console.warn('Notifications data is not an array:', typeof notificationsData, notificationsData);
        setNotifications([]);
      } else {
        setNotifications(notificationsData);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load notifications. Please try again.';
      setError(errorMessage);
      console.error('Error loading notifications:', err);
      setNotifications([]); // Ensure notifications is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setSuccessMessage('All notifications marked as read');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setSuccessMessage('Notification deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await realTimeNotificationService.updatePreferences({ [key]: value });
      setSuccessMessage('Preferences updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences');
      setTimeout(() => setError(null), 3000);
      // Revert the change
      setPreferences(preferences);
    }
  };

  const handleTestNotification = async () => {
    try {
      await realTimeNotificationService.testNotification();
      setSuccessMessage('Test notification sent!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Failed to send test notification');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'connection_accepted':
      case 'connection_request':
        return <Person color="primary" />;
      case 'message':
        return <Message color="info" />;
      case 'job_match':
        return <Work color="success" />;
      case 'event_reminder':
        return <Event color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'connection_accepted':
        return 'success';
      case 'connection_request':
        return 'info';
      case 'message':
        return 'primary';
      case 'job_match':
        return 'success';
      case 'event_reminder':
        return 'warning';
      default:
        return 'default';
    }
  };

  const displayUnreadCount = unreadCount || (Array.isArray(notifications) ? notifications.filter(notif => !notif.isRead).length : 0);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Notifications
            </Typography>
            {displayUnreadCount > 0 && (
              <Chip
                label={`${displayUnreadCount} unread`}
                color="error"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
            <Chip
              icon={realTimeConnected ? <NotificationsActive /> : <NotificationsOff />}
              label={realTimeConnected ? 'Live' : 'Offline'}
              color={realTimeConnected ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Science />}
              onClick={handleTestNotification}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Test
            </Button>
            {displayUnreadCount > 0 && (
              <Button
                variant="outlined"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
                sx={{ textTransform: 'none' }}
              >
                Mark All Read
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={() => setShowSettings(!showSettings)}
              sx={{ textTransform: 'none' }}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Notification Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings /> Notification Preferences
                  </Typography>
                  
                  {/* General Settings */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">General Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.inApp}
                              onChange={(e) => handlePreferenceChange('inApp', e.target.checked)}
                            />
                          }
                          label="In-app notifications"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.push}
                              onChange={(e) => handlePreferenceChange('push', e.target.checked)}
                            />
                          }
                          label="Push notifications"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.email}
                              onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                            />
                          }
                          label="Email notifications"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.sound}
                              onChange={(e) => handlePreferenceChange('sound', e.target.checked)}
                              icon={<VolumeOff />}
                              checkedIcon={<VolumeUp />}
                            />
                          }
                          label="Notification sounds"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.vibration}
                              onChange={(e) => handlePreferenceChange('vibration', e.target.checked)}
                              icon={<Vibration sx={{ opacity: 0.3 }} />}
                              checkedIcon={<Vibration />}
                            />
                          }
                          label="Vibration (mobile)"
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* Notification Types */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Notification Types</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.connectionRequests}
                              onChange={(e) => handlePreferenceChange('connectionRequests', e.target.checked)}
                            />
                          }
                          label="Connection requests"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.messages}
                              onChange={(e) => handlePreferenceChange('messages', e.target.checked)}
                            />
                          }
                          label="Messages"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.jobMatches}
                              onChange={(e) => handlePreferenceChange('jobMatches', e.target.checked)}
                            />
                          }
                          label="Job matches"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.courseUpdates}
                              onChange={(e) => handlePreferenceChange('courseUpdates', e.target.checked)}
                            />
                          }
                          label="Course updates"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences.systemNotifications}
                              onChange={(e) => handlePreferenceChange('systemNotifications', e.target.checked)}
                            />
                          }
                          label="System notifications"
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success/Error Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Notifications List */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll see notifications about connection requests, messages, and more here.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    component={motion.div}
                    whileHover={{ backgroundColor: theme.palette.action.hover }}
                    sx={{
                      py: 2,
                      px: 3,
                      backgroundColor: notification.isRead 
                        ? 'transparent' 
                        : theme.palette.action.selected,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={notification.data?.userProfilePicture}
                        sx={{
                          bgcolor: notification.isRead 
                            ? 'grey.300' 
                            : `${getNotificationColor(notification.type)}.light`,
                        }}
                      >
                        {notification.data?.userProfilePicture 
                          ? undefined 
                          : getNotificationIcon(notification.type)
                        }
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: notification.isRead ? 400 : 600,
                              flex: 1,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          sx={{ color: 'success.main' }}
                        >
                          <Check fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        sx={{ color: 'error.main' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {Array.isArray(notifications) && index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Floating Action Button for Settings */}
        <Fab
          color="primary"
          aria-label="settings"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            display: { xs: 'flex', md: 'none' } // Only show on mobile
          }}
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings />
        </Fab>

        {/* Snackbar for success messages */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        />
      </motion.div>
    </Container>
  );
};

export default NotificationsPage;