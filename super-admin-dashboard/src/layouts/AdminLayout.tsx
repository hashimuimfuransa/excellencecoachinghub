import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Work,
  School,
  Assessment,
  CardMembership,
  Analytics,
  Settings,
  Logout,
  Notifications,
  DarkMode,
  LightMode,
  AdminPanelSettings,
  HealthAndSafety,
  Backup,
  BugReport,
  TrendingUp,
  BarChart,
  Timeline,
  Psychology,
  RecordVoiceOver,
  Assignment,
  ManageAccounts,
  QuestionAnswer,
  Business,
  Email,
  VideoLibrary
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

const drawerWidth = 280;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
  category?: string;
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  
  // User Management
  { text: 'Users Management', icon: <People />, path: '/users', category: 'User Management' },
  { text: 'Job Seekers', icon: <ManageAccounts />, path: '/job-seekers', category: 'User Management' },
  { text: 'User Analytics', icon: <Analytics />, path: '/user-analytics', category: 'User Management' },
  
  // Content Management
  { text: 'Jobs Management', icon: <Work />, path: '/jobs', category: 'Content Management', badge: 5 },
  { text: 'Applications', icon: <Assignment />, path: '/applications', category: 'Content Management' },
  { text: 'Company Profiles', icon: <Business />, path: '/company-profiles', category: 'Content Management' },
  { text: 'Courses Management', icon: <School />, path: '/courses', category: 'Content Management' },
  { text: 'Psychometric Tests', icon: <Psychology />, path: '/psychometric-tests', category: 'Content Management' },
  { text: 'Smart Tests', icon: <QuestionAnswer />, path: '/smart-tests', category: 'Content Management' },
  { text: 'AI Interviews', icon: <RecordVoiceOver />, path: '/ai-interviews', category: 'Content Management' },
  { text: 'Past Papers', icon: <Assessment />, path: '/past-papers', category: 'Content Management' },
  { text: 'Certificates', icon: <CardMembership />, path: '/certificates', category: 'Content Management' },
  { text: 'Videos Management', icon: <VideoLibrary />, path: '/videos', category: 'Content Management' },
  
  // System Management
  { text: 'System Analytics', icon: <TrendingUp />, path: '/system-analytics', category: 'System Management' },
  { text: 'System Settings', icon: <Settings />, path: '/system-settings', category: 'System Management' },
  { text: 'System Health', icon: <HealthAndSafety />, path: '/system-health', category: 'System Management' },
  { text: 'Email Events', icon: <Email />, path: '/email-events', category: 'System Management' },
  
  // Analytics
  { text: 'Performance Reports', icon: <Timeline />, path: '/performance', category: 'Analytics' },
  { text: 'Usage Statistics', icon: <BarChart />, path: '/usage-stats', category: 'Analytics' },
];

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleTheme } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    const category = item.category || 'Main';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Header */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <AdminPanelSettings sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" fontWeight="bold">
          Super Admin
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Excellence Coaching Hub
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {Object.entries(groupedItems).map(([category, items]) => (
          <Box key={category}>
            {category !== 'Main' && (
              <>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                >
                  {category}
                </Typography>
              </>
            )}
            <List dense>
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        backgroundColor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: isActive ? 'white' : 'inherit',
                        minWidth: 40
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 400
                        }}
                      />
                      {item.badge && (
                        <Chip 
                          label={item.badge} 
                          size="small" 
                          color="error"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {category !== 'Analytics' && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role?.replace('_', ' ').toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Super Admin Dashboard
          </Typography>

          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'light' ? <DarkMode /> : <LightMode />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Profile Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        onClick={handleNotificationClose}
      >
        <MenuItem>
          <Typography variant="body2">System maintenance scheduled</Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="body2">New user registrations: 15</Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="body2">Server load warning</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminLayout;