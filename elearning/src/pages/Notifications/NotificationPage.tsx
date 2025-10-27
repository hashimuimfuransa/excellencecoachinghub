import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Info,
  CheckCircle,
  Warning,
  Error,
  Archive,
  Delete,
  MarkEmailRead,
  MarkEmailUnread,
  FilterList,
  Refresh,
  Add,
  Send,
  MoreVert,
  Schedule,
  Person,
  School,
  Payment,
  Security,
  Build,
  Launch
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import {
  notificationService,
  INotification,
  NotificationFilters,
  NotificationStats,
  CreateNotificationData
} from '../../services/notificationService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const NotificationPage: React.FC = () => {
  const { user } = useAuth();
  const { markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Notification data
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  
  // Filters and pagination
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20
  });
  const [totalPages, setTotalPages] = useState(1);
  
  // UI state
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  
  // Create notification dialog (admin only)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState<Partial<CreateNotificationData>>({
    type: 'info',
    priority: 'medium',
    category: 'system',
    actionRequired: false
  });

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationService.getNotifications(filters);
      setNotifications(response.notifications);
      setStats(response.stats);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    
    // Update filters based on tab
    const newFilters: NotificationFilters = { ...filters, page: 1 };
    
    switch (newValue) {
      case 0: // All
        delete newFilters.isRead;
        break;
      case 1: // Unread
        newFilters.isRead = false;
        break;
      case 2: // Action Required
        newFilters.actionRequired = true;
        break;
      case 3: // Archived
        newFilters.isArchived = true;
        break;
    }
    
    setFilters(newFilters);
  };

  const handleNotificationClick = async (notification: INotification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        // Use the context's markAsRead function which handles mock notifications
        await contextMarkAsRead(notification._id);
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await contextMarkAsRead(notificationId);
      setSuccess('Notification marked as read');
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      // Check if this is a mock notification
      if (notificationId.startsWith('mock-')) {
        // Handle mock notifications locally
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        setSuccess('Notification archived');
        return;
      }

      // Handle real notifications with API call
      await notificationService.archiveNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setSuccess('Notification archived');
    } catch (err) {
      setError('Failed to archive notification');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      // Check if this is a mock notification
      if (notificationId.startsWith('mock-')) {
        // Handle mock notifications locally
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        setSuccess('Notification deleted');
        return;
      }

      // Handle real notifications with API call
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setSuccess('Notification deleted');
    } catch (err) {
      setError('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await contextMarkAllAsRead();
      setSuccess('All notifications marked as read');
    } catch (err) {
      setError('Failed to mark all notifications as read');
    }
  };

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

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Notifications
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Stay updated with important information and alerts
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadNotifications}
              disabled={loading}
            >
              Refresh
            </Button>
            {stats && stats.unread > 0 && (
              <Button
                variant="contained"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
              >
                Mark All Read
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Notifications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.unread}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.actionRequired}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Action Required
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.byPriority.urgent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Urgent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<Badge badgeContent={stats?.total || 0} color="primary"><Notifications /></Badge>} 
            label="All" 
          />
          <Tab 
            icon={<Badge badgeContent={stats?.unread || 0} color="error"><NotificationsActive /></Badge>} 
            label="Unread" 
          />
          <Tab 
            icon={<Badge badgeContent={stats?.actionRequired || 0} color="warning"><Warning /></Badge>} 
            label="Action Required" 
          />
          <Tab 
            icon={<Archive />} 
            label="Archived" 
          />
        </Tabs>

        {/* Notification List */}
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up!
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'transparent' }}>
                        {getNotificationIcon(notification)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: notification.isRead ? 'normal' : 'bold',
                              flexGrow: 1
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={notification.priority}
                            color={getPriorityColor(notification.priority) as any}
                          />
                          <Chip
                            size="small"
                            icon={getCategoryIcon(notification.category)}
                            label={notification.category}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {notification.message}
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                            {notification.actionRequired && (
                              <Chip
                                size="small"
                                label="Action Required"
                                color="warning"
                                icon={<Schedule />}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotificationId(notification._id);
                          setActionMenuAnchor(e.currentTarget);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedNotificationId) {
            handleMarkAsRead(selectedNotificationId);
          }
          setActionMenuAnchor(null);
        }}>
          <MarkEmailRead sx={{ mr: 1 }} />
          Mark as Read
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedNotificationId) {
            handleArchive(selectedNotificationId);
          }
          setActionMenuAnchor(null);
        }}>
          <Archive sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedNotificationId) {
            handleDelete(selectedNotificationId);
          }
          setActionMenuAnchor(null);
        }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default NotificationPage;
