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
  Avatar,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  styled,
  SwipeableDrawer,
  Hidden
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Quiz,
  VideoCall,
  VideoLibrary,
  Notifications,
  Settings,
  Logout,
  Person,
  MenuBook,
  People,
  Analytics,
  Psychology,
  Support,
  SupervisorAccount,
  Security,
  Groups,
  ManageAccounts
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { UserRole } from '../../shared/types';
import EmailVerificationBanner from '../Auth/EmailVerificationBanner';
import FloatingAIAssistant from '../FloatingAIAssistant';
import { useResponsive, getDrawerWidth } from '../../utils/responsive';

// Responsive styled components
const ResponsiveAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'drawerWidth',
})<{ drawerWidth: number }>(({ theme, drawerWidth }) => ({
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
}));

const ResponsiveDrawer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'drawerWidth',
})<{ drawerWidth: number }>(({ theme, drawerWidth }) => ({
  [theme.breakpoints.up('md')]: {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
    },
  },
}));

const ResponsiveMain = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'drawerWidth',
})<{ drawerWidth: number }>(({ theme, drawerWidth }) => ({
  flexGrow: 1,
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
  minHeight: '100vh',
  backgroundColor: theme.palette.grey[50],
  // Add proper padding to push content below the fixed AppBar header and provide breathing room
  padding: theme.spacing(0, 1, 2, 1), // Default padding for mobile
  paddingTop: `calc(56px + ${theme.spacing(1)})`, // AppBar height + spacing for mobile
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(0, 2, 3, 2), // Padding for tablet/desktop
    paddingTop: `calc(64px + ${theme.spacing(2)})`, // AppBar height + spacing for desktop
  },
}));

const ResponsiveToolbar = styled(Toolbar)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    minHeight: 56,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  [theme.breakpoints.up('sm')]: {
    minHeight: 64,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

const ResponsiveListItem = styled(ListItem)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: UserRole[];
}

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();
  
  // Dynamic drawer width based on device
  const drawerWidths = getDrawerWidth();
  const currentDrawerWidth = isMobile ? drawerWidths.mobile : 
                           isTablet ? drawerWidths.tablet :
                           isLaptop ? drawerWidths.laptop :
                           drawerWidths.desktop;

  // Navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const commonItems: NavigationItem[] = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Courses', icon: <School />, path: '/courses' }
    ];

    const roleSpecificItems: NavigationItem[] = [];

    if (user?.role === UserRole.ADMIN) {
      roleSpecificItems.push(
        { text: 'User Management', icon: <People />, path: '/dashboard/admin/users' },
        { text: 'Teacher Management', icon: <SupervisorAccount />, path: '/dashboard/admin/teachers' },
        { text: 'Student Management', icon: <Groups />, path: '/dashboard/admin/students' },
        { text: 'Course Management', icon: <School />, path: '/dashboard/admin/courses' },
        { text: 'Recordings Management', icon: <VideoLibrary />, path: '/dashboard/admin/recordings' },
        { text: 'Analytics & Reports', icon: <Analytics />, path: '/dashboard/admin/analytics' },
        { text: 'Proctoring & Monitoring', icon: <Security />, path: '/dashboard/admin/proctoring' },
        { text: 'AI Settings', icon: <Psychology />, path: '/dashboard/admin/ai-settings' },
        { text: 'Admin Settings', icon: <Settings />, path: '/dashboard/admin/settings' },
        { text: 'Support & Feedback', icon: <Support />, path: '/dashboard/admin/support' },
        { text: 'Admin Profile', icon: <Person />, path: '/dashboard/admin/profile' }
      );
    } else if (user?.role === UserRole.TEACHER) {
      roleSpecificItems.push(
        { text: 'My Courses', icon: <MenuBook />, path: '/dashboard/teacher/courses' },
        { text: 'Create Course', icon: <School />, path: '/dashboard/teacher/courses/create' },
        { text: 'Student Management', icon: <ManageAccounts />, path: '/dashboard/teacher/student-management' },
        { text: 'Analytics', icon: <Analytics />, path: '/dashboard/teacher/analytics' },
        { text: 'Settings', icon: <Settings />, path: '/dashboard/teacher/settings' },
        { text: 'Profile', icon: <Person />, path: '/dashboard/teacher/profile' }
      );
    } else if (user?.role === UserRole.STUDENT) {
      roleSpecificItems.push(
        { text: 'Overview', icon: <Dashboard />, path: '/dashboard/student/overview' },
        { text: 'My Courses', icon: <School />, path: '/dashboard/student/courses' },
        { text: 'Course Content', icon: <MenuBook />, path: '/dashboard/student/course-content' },
        { text: 'Assessments', icon: <Quiz />, path: '/dashboard/student/assessments' },
        { text: 'Live Sessions', icon: <VideoCall />, path: '/dashboard/student/live-sessions' },
        { text: 'Progress', icon: <Analytics />, path: '/dashboard/student/progress' },
        { text: 'AI Assistant', icon: <Psychology />, path: '/dashboard/student/ai-assistant' },
        { text: 'Settings', icon: <Settings />, path: '/dashboard/student/settings' },
        { text: 'Profile', icon: <Person />, path: '/dashboard/profile' }
      );
    }

    return [...commonItems, ...roleSpecificItems];
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Drawer content
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          textAlign: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          noWrap 
          component="div" 
          color="primary"
          sx={{ mb: 0.5 }}
        >
          <img
            src="/logo.webp"
            alt="Coaching Hub Logo"
            style={{ 
              height: isMobile ? '24px' : '32px', 
              width: 'auto' 
            }}
          />
        </Typography>
        <Typography 
          variant={isMobile ? "caption" : "body2"} 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} Portal
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List 
        sx={{ 
          flexGrow: 1,
          py: { xs: 0.5, sm: 1 },
          '& .MuiListItem-root': {
            px: { xs: 1, sm: 1.5 }
          }
        }}
      >
        {getNavigationItems().map((item) => (
          <ResponsiveListItem key={item.text} disablePadding>
            <ListItemButton
              selected={isActivePath(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: { xs: 40, sm: 48 },
                px: { xs: 1, sm: 2 },
                borderRadius: 1,
                mx: { xs: 0.5, sm: 1 },
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: { xs: 36, sm: 40 },
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '1.2rem', sm: '1.5rem' }
                  }
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: isActivePath(item.path) ? 600 : 400
                }}
              />
            </ListItemButton>
          </ResponsiveListItem>
        ))}
      </List>

      <Divider />

      {/* Settings and Notifications */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/dashboard/notifications')}>
            <ListItemIcon>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation(
            user?.role === UserRole.ADMIN
              ? '/dashboard/admin/settings'
              : '/dashboard/settings'
          )}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <ResponsiveAppBar
        position="fixed"
        drawerWidth={drawerWidths.desktop}
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
            {user?.firstName} {user?.lastName}
          </Typography>

          {/* Profile Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar
                sx={{ width: 32, height: 32 }}
                src={user?.avatar}
                alt={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </ResponsiveAppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleNavigation(
          user?.role === UserRole.TEACHER
            ? '/dashboard/teacher/profile'
            : user?.role === UserRole.ADMIN
              ? '/dashboard/admin/profile'
              : '/dashboard/profile'
        )}>
          <Avatar src={user?.avatar}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigation(
          user?.role === UserRole.ADMIN
            ? '/dashboard/admin/settings'
            : '/dashboard/settings'
        )}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidths.desktop }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidths.mobile },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidths.desktop },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <ResponsiveMain drawerWidth={drawerWidths.desktop}>
        {/* Email Verification Banner */}
        {user && (
          <EmailVerificationBanner
            user={{
              email: user.email,
              firstName: user.firstName,
              isEmailVerified: user.isEmailVerified
            }}
          />
        )}
        <Outlet />

        {/* Floating AI Assistant - Available for students */}
        {user?.role === UserRole.STUDENT && (
          <FloatingAIAssistant
            context={{
              page: location.pathname,
              // Additional context can be passed here
            }}
          />
        )}
      </ResponsiveMain>
    </Box>
  );
};

export default Layout;
