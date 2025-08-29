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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { notificationService, Notification } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications(1, 50);
      setNotifications(response.data || []);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
      console.error('Error loading notifications:', err);
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

  const getNotificationIcon = (type: string) => {
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

  const getNotificationColor = (type: string) => {
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

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

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
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                color="error"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              sx={{ textTransform: 'none' }}
            >
              Mark All Read
            </Button>
          )}
        </Box>

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
          {notifications.length === 0 ? (
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
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default NotificationsPage;