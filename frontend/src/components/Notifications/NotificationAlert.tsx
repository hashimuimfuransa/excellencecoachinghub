import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  ExpandMore,
  ExpandLess,
  Info,
  Warning,
  Error,
  CheckCircle,
  Launch,
  MarkEmailRead,
  Refresh,
  Person,
  School,
  Security,
  Build,
  Payment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { INotification } from '../../services/notificationService';

interface NotificationAlertProps {
  maxItems?: number;
  showActions?: boolean;
  compact?: boolean;
}

const NotificationAlert: React.FC<NotificationAlertProps> = ({
  maxItems = 5,
  showActions = true,
  compact = false
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();
  
  const [expanded, setExpanded] = useState(false);

  const getNotificationIcon = (notification: INotification) => {
    const iconProps = {
      sx: { 
        color: notification.type === 'error' ? 'error.main' :
               notification.type === 'warning' ? 'warning.main' :
               notification.type === 'success' ? 'success.main' : 'info.main'
      }
    };

    switch (notification.type) {
      case 'error':
        return <Error {...iconProps} />;
      case 'warning':
        return <Warning {...iconProps} />;
      case 'success':
        return <CheckCircle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <Person />;
      case 'course':
        return <School />;
      case 'payment':
        return <Payment />;
      case 'security':
        return <Security />;
      case 'maintenance':
        return <Build />;
      default:
        return <Notifications />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = async (notification: INotification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
      } catch (err) {
        console.error('Error marking notification as read:', err);
        // Don't prevent navigation if marking as read fails
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleViewAll = () => {
    navigate('/dashboard/notifications');
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const displayNotifications = notifications.slice(0, expanded ? notifications.length : maxItems);

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Badge badgeContent={unreadCount} color="error">
          <IconButton onClick={handleViewAll}>
            {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </IconButton>
        </Badge>
        {unreadCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            {unreadCount} new
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={unreadCount} color="error">
              {unreadCount > 0 ? <NotificationsActive color="primary" /> : <Notifications />}
            </Badge>
            <Typography variant="h6">
              Recent Notifications
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton size="small" onClick={refreshNotifications} disabled={loading}>
              {loading ? <CircularProgress size={16} /> : <Refresh />}
            </IconButton>
            {showActions && unreadCount > 0 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              onClick={handleViewAll}
            >
              View All
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && notifications.length === 0 ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {displayNotifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 0,
                      py: 1,
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'transparent', width: 32, height: 32 }}>
                        {getNotificationIcon(notification)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: notification.isRead ? 'normal' : 'bold',
                              flexGrow: 1,
                              fontSize: '0.875rem'
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={notification.priority}
                            color={getPriorityColor(notification.priority) as any}
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ mb: 0.5, fontSize: '0.8rem' }}
                          >
                            {notification.message}
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Chip
                                size="small"
                                icon={getCategoryIcon(notification.category)}
                                label={notification.category}
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.7rem' }}
                              />
                              {notification.actionRequired && (
                                <IconButton size="small" sx={{ p: 0.5 }}>
                                  <Launch sx={{ fontSize: 14 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < displayNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {notifications.length > maxItems && (
              <Box textAlign="center" mt={1}>
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {expanded ? 'Show Less' : `Show ${notifications.length - maxItems} More`}
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationAlert;
