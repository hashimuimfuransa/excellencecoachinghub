import React, { useState, useEffect } from 'react';
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
  Hidden,
  alpha,
  Chip,
  Button,
  Popover,
  Grid,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent
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
  ManageAccounts,
  Add,
  Grade,
  Leaderboard,
  EmojiEvents,
  TrendingUp,
  Explore,
  ExpandMore,
  Computer,
  Business,
  Science,
  Palette,
  Language,
  LocalHospital,
  Engineering,
  Calculate,
  Search,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { UserRole } from '../../shared/types';
import EmailVerificationBanner from '../Auth/EmailVerificationBanner';
import FloatingAIAssistant from '../FloatingAIAssistant';
import { useResponsive, getDrawerWidth } from '../../utils/responsive';
import { teacherProfileService } from '../../services/teacherProfileService';
import CareerGuidancePopup from '../Career/CareerGuidancePopup';
import careerGuidanceService from '../../services/careerGuidanceService';
import ProfilePage from '../../pages/Profile/ProfilePage';

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
    padding: theme.spacing(0, 1, 2, 1), // Reduced padding for better space utilization
    paddingTop: `calc(64px + ${theme.spacing(1)})`, // AppBar height + reduced spacing for desktop
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(0, 0.5, 1.5, 0.5), // Further reduced padding for large screens
    paddingTop: `calc(64px + ${theme.spacing(0.5)})`, // Minimal spacing for large screens
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
  requiresApprovedProfile?: boolean;
  onClick?: () => void;
}

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [teacherProfileStatus, setTeacherProfileStatus] = useState<string | null>(null);
  
  // Career guidance popup state
  const [showCareerPopup, setShowCareerPopup] = useState(false);
  const [hasCheckedCareerTest, setHasCheckedCareerTest] = useState(false);
  
  // Explore categories state
  const [exploreAnchorEl, setExploreAnchorEl] = useState<null | HTMLElement>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();

  // Load teacher profile status if user is a teacher
  useEffect(() => {
    const loadTeacherProfileStatus = async () => {
      if (user?.role === UserRole.TEACHER) {
        try {
          const response = await teacherProfileService.getMyProfile();
          if (response.success) {
            setTeacherProfileStatus(response.data.profile.profileStatus);
          }
        } catch (error) {
          console.error('Failed to load teacher profile status:', error);
        }
      }
    };

    loadTeacherProfileStatus();
  }, [user]);

  // Reset career test check when navigating to dashboard pages
  useEffect(() => {
    const isDashboardPage = location.pathname === '/dashboard' || 
                          location.pathname === '/dashboard/student' || 
                          location.pathname === '/dashboard/';
    if (isDashboardPage && hasCheckedCareerTest && user?.role === UserRole.STUDENT) {
      console.log('🔄 [E-Learning] Resetting career test check for student dashboard visit');
      setHasCheckedCareerTest(false);
    }
  }, [location.pathname, hasCheckedCareerTest, user?.role]);

  // Check for career test completion and show popup for students
  useEffect(() => {
    const checkCareerTestStatus = async () => {
      console.log('📚 [E-Learning] Checking career test status...', {
        user: user?.email,
        role: user?.role,
        isStudent: user?.role === UserRole.STUDENT,
        hasCheckedCareerTest,
        pathname: location.pathname
      });

      if (!user || user.role !== UserRole.STUDENT) {
        console.log('❌ [E-Learning] Skipping career popup - user not eligible (no user or not student)');
        return;
      }

      if (hasCheckedCareerTest) {
        console.log('❌ [E-Learning] Skipping career popup - already checked this session');
        return;
      }
      
      // Only show popup on student dashboard pages
      const dashboardPages = ['/dashboard', '/dashboard/student', '/dashboard/'];
      const isDashboard = dashboardPages.includes(location.pathname);
      if (!isDashboard) {
        console.log('❌ [E-Learning] Skipping career popup - not on dashboard page');
        return;
      }

      // Skip career popup on certain pages
      const skipPages = ['/dashboard/student/career', '/login', '/register'];
      if (skipPages.some(page => location.pathname.includes(page))) {
        console.log('❌ [E-Learning] Skipping career popup - on excluded page');
        setHasCheckedCareerTest(true);
        return;
      }

      // Check if dismissed recently (within 2 hours only, not 24 hours)
      const lastDismissed = localStorage.getItem('careerPopupLastDismissed');
      if (lastDismissed) {
        const dismissedTime = new Date(lastDismissed).getTime();
        const now = new Date().getTime();
        const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
        
        if (hoursSinceDismissed < 2) {
          console.log('❌ [E-Learning] Skipping career popup - dismissed recently (within 2 hours)');
          setHasCheckedCareerTest(true);
          return;
        }
      }

      try {
        console.log('🔄 [E-Learning] Checking if user has completed career test...');
        const hasCompletedTest = await careerGuidanceService.checkHasCompletedCareerTest();
        console.log('📊 [E-Learning] Career test completion status:', hasCompletedTest);
        
        if (!hasCompletedTest) {
          console.log('✅ [E-Learning] User has not completed test - showing popup in 3 seconds');
          setTimeout(() => {
            console.log('🎯 [E-Learning] Showing career guidance popup!');
            setShowCareerPopup(true);
            setHasCheckedCareerTest(true);
          }, 3000);
        } else {
          console.log('✅ [E-Learning] User has completed test - no popup needed');
          setHasCheckedCareerTest(true);
        }
      } catch (error) {
        console.error('❌ [E-Learning] Error checking career test status:', error);
        // For testing, show popup if there's an error (user likely hasn't completed test)
        console.log('🔧 [E-Learning] Error occurred - showing popup as fallback');
        setTimeout(() => {
          setShowCareerPopup(true);
          setHasCheckedCareerTest(true);
        }, 3000);
      }
    };

    // Only check after user is loaded and we're authenticated
    if (user && !hasCheckedCareerTest) {
      checkCareerTestStatus();
    }
  }, [user, location.pathname, hasCheckedCareerTest]);
  
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
    ];

    const roleSpecificItems: NavigationItem[] = [];

    if (user?.role === UserRole.ADMIN) {
      roleSpecificItems.push(
        { text: 'User Management', icon: <People />, path: '/dashboard/admin/users' },
        { text: 'Teacher Management', icon: <SupervisorAccount />, path: '/dashboard/admin/teachers' },
        { text: 'Student Management', icon: <Groups />, path: '/dashboard/admin/students' },
        { text: 'Course Management', icon: <School />, path: '/dashboard/admin/courses' },
        { text: 'Community', icon: <Groups />, path: '/community/feed' },
        { text: 'Recordings Management', icon: <VideoLibrary />, path: '/dashboard/admin/recordings' },
        { text: 'Analytics & Reports', icon: <Analytics />, path: '/dashboard/admin/analytics' },
        { text: 'System Leaderboard', icon: <EmojiEvents />, path: '/dashboard/admin/leaderboard' },
        { text: 'Proctoring & Monitoring', icon: <Security />, path: '/dashboard/admin/proctoring' },
        { text: 'AI Settings', icon: <Psychology />, path: '/dashboard/admin/ai-settings' },
        { text: 'Admin Settings', icon: <Settings />, path: '/dashboard/admin/settings' },
        { text: 'Support & Feedback', icon: <Support />, path: '/dashboard/admin/support' },
        { text: 'Admin Profile', icon: <Person />, path: '/dashboard/admin/profile' }
      );
    } else if (user?.role === UserRole.TEACHER) {
      roleSpecificItems.push(
        { text: 'Course Management', icon: <School />, path: '/dashboard/teacher/course-management', requiresApprovedProfile: true },
        { text: 'Create Course', icon: <Add />, path: '/dashboard/teacher/courses/create', requiresApprovedProfile: true },
        { text: 'Live Sessions', icon: <VideoCall />, path: '/dashboard/teacher/live-sessions', requiresApprovedProfile: true },
        { text: 'Community', icon: <Groups />, path: '/community/feed' },
        { text: 'Student Management', icon: <ManageAccounts />, path: '/dashboard/teacher/student-management', requiresApprovedProfile: true },
        { text: 'Grades & Performance', icon: <Grade />, path: '/dashboard/teacher/grades', requiresApprovedProfile: true },
        { text: 'Analytics', icon: <Analytics />, path: '/dashboard/teacher/analytics', requiresApprovedProfile: true },
        { text: 'Profile', icon: <Person />, path: '/dashboard/teacher/profile/complete' }
      );
    } else if (user?.role === UserRole.STUDENT) {
      roleSpecificItems.push(
        { text: 'My Courses', icon: <School />, path: '/dashboard/student/courses' },
        { text: '🔴 Live Sessions', icon: <VideoCall />, path: '/live-sessions' },
        { text: 'Community', icon: <Groups />, path: '/community/feed' },
        { text: 'My Grades', icon: <Grade />, path: '/dashboard/student/grades' },
        { text: 'Leaderboard', icon: <EmojiEvents />, path: '/dashboard/student/leaderboard' },
        { text: 'Career Guidance', icon: <TrendingUp />, path: '/dashboard/student/career' },
        { text: 'AI Assistant', icon: <Psychology />, path: '/dashboard/student/ai-assistant' },
        { 
          text: 'Profile', 
          icon: <Person />, 
          path: '/dashboard/profile',
          onClick: () => {
            console.log('🔍 Sidebar Profile Navigation - User role:', user?.role);
            console.log('🔍 Sidebar Profile Navigation - Opening profile modal');
            // Open profile directly without page navigation
            handleProfileDirect();
          }
        }
      );
    }

    return [...commonItems, ...roleSpecificItems];
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileDirect = () => {
    setProfileRefreshKey(prev => prev + 1); // Force refresh
    setProfileModalOpen(true);
    setAnchorEl(null); // Close the profile menu
  };

  // Listen for custom events to open profile modal
  useEffect(() => {
    const handleOpenProfileModal = () => {
      setProfileRefreshKey(prev => prev + 1); // Force refresh
      setProfileModalOpen(true);
    };

    const handleProfileUpdated = () => {
      setProfileRefreshKey(prev => prev + 1); // Force refresh after update
    };

    window.addEventListener('openProfileModal', handleOpenProfileModal);
    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => {
      window.removeEventListener('openProfileModal', handleOpenProfileModal);
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

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

  const handleCareerPopupClose = () => {
    setShowCareerPopup(false);
    // Only set dismissal time, no session storage to allow showing on dashboard visits
    localStorage.setItem('careerPopupLastDismissed', new Date().toISOString());
    console.log('🚫 [E-Learning] Career popup dismissed - will show again in 2 hours');
  };

  const handleTakeCareerTest = () => {
    setShowCareerPopup(false);
    navigate('/dashboard/student/career');
  };

  // Explore categories handlers
  const handleExploreClick = (event: React.MouseEvent<HTMLElement>) => {
    setExploreAnchorEl(event.currentTarget);
  };

  const handleExploreClose = () => {
    setExploreAnchorEl(null);
  };

  const handleCategoryClick = (category: string) => {
    handleExploreClose();
    navigate(`/courses?category=${encodeURIComponent(category)}`);
  };

  // Search handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Course categories data
  const courseCategories = [
    { name: 'Computer Science', icon: <Computer />, color: '#1976d2' },
    { name: 'Business & Management', icon: <Business />, color: '#388e3c' },
    { name: 'Data Science', icon: <Science />, color: '#f57c00' },
    { name: 'Design & Creative', icon: <Palette />, color: '#9c27b0' },
    { name: 'Languages', icon: <Language />, color: '#d32f2f' },
    { name: 'Health & Medicine', icon: <LocalHospital />, color: '#00796b' },
    { name: 'Engineering', icon: <Engineering />, color: '#5d4037' },
    { name: 'Mathematics', icon: <Calculate />, color: '#303f9f' }
  ];

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
        
        {/* Teacher Profile Status Indicator */}
        {user?.role === UserRole.TEACHER && teacherProfileStatus && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={
                teacherProfileStatus === 'approved' ? '✅ Approved' :
                teacherProfileStatus === 'pending' ? '⏳ Under Review' :
                teacherProfileStatus === 'rejected' ? '❌ Needs Update' :
                '📝 Incomplete'
              }
              size="small"
              color={
                teacherProfileStatus === 'approved' ? 'success' :
                teacherProfileStatus === 'pending' ? 'info' :
                teacherProfileStatus === 'rejected' ? 'error' :
                'warning'
              }
              variant="outlined"
              sx={{ 
                fontSize: '0.65rem',
                height: 20,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/dashboard/teacher/profile/complete')}
            />
          </Box>
        )}
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
        {getNavigationItems().map((item) => {
          const isLiveSession = item.text.includes('Live Sessions');
          const isDisabled = item.requiresApprovedProfile && 
                           user?.role === UserRole.TEACHER && 
                           teacherProfileStatus !== 'approved';
          
          return (
            <ResponsiveListItem key={item.text} disablePadding>
              <Tooltip 
                title={isDisabled ? 'Complete and get your profile approved to access this feature' : ''}
                placement="right"
              >
                <Box sx={{ width: '100%' }}>
                  <ListItemButton
                    selected={isActivePath(item.path)}
                    onClick={() => {
                      if (isDisabled) return;
                      // Use custom onClick if provided, otherwise use default navigation
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        handleNavigation(item.path);
                      }
                    }}
                    disabled={isDisabled}
                sx={{
                  minHeight: { xs: 40, sm: 48 },
                  px: { xs: 1, sm: 2 },
                  borderRadius: 1,
                  mx: { xs: 0.5, sm: 1 },
                  mb: 0.5,
                  // Disabled styling
                  ...(isDisabled && {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }),
                  // Special styling for Live Sessions
                  ...(isLiveSession && !isDisabled && {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)}, ${alpha(theme.palette.error.main, 0.08)})`,
                      borderColor: theme.palette.error.main,
                      transform: 'translateX(4px)',
                    },
                  }),
                  '&.Mui-selected': {
                    backgroundColor: isLiveSession ? 'error.main' : 'primary.main',
                    color: isLiveSession ? 'error.contrastText' : 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: isLiveSession ? 'error.dark' : 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isLiveSession ? 'error.contrastText' : 'primary.contrastText',
                    },
                  },
                  ...(!isLiveSession && !isDisabled && {
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    },
                  }),
                  transition: 'all 0.2s ease',
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
              {isDisabled && (
                <Chip 
                  label="🔒" 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    backgroundColor: 'warning.light',
                    color: 'warning.contrastText'
                  }} 
                />
              )}
            </ListItemButton>
                </Box>
              </Tooltip>
          </ResponsiveListItem>
          );
        })}
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

        {/* Only show Settings for Admin users */}
        {user?.role === UserRole.ADMIN && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigation('/dashboard/admin/settings')}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        )}
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

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              mr: 2,
              minWidth: 300,
              maxWidth: 500
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Find what you want to learn..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1,
                    },
                  },
                }
              }}
            />
          </Box>

          {/* Explore Categories Button */}
          <Button
            variant="text"
            color="inherit"
            startIcon={<Explore />}
            endIcon={<ExpandMore />}
            onClick={handleExploreClick}
            sx={{
              mr: 2,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Explore
          </Button>

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
        <MenuItem onClick={() => {
          console.log('🔍 Direct Profile Navigation - User role:', user?.role);
          console.log('🔍 Direct Profile Navigation - Opening profile modal');
          // Open profile directly without page navigation
          handleProfileDirect();
        }}>
          <Avatar src={user?.avatar}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
          Profile
        </MenuItem>
        {/* Only show Settings for Admin users */}
        {user?.role === UserRole.ADMIN && (
          <MenuItem onClick={() => handleNavigation('/dashboard/admin/settings')}>
            <Settings fontSize="small" sx={{ mr: 1 }} />
            Settings
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Explore Categories Popover */}
      <Popover
        open={Boolean(exploreAnchorEl)}
        anchorEl={exploreAnchorEl}
        onClose={handleExploreClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 400,
            maxWidth: 600,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
            Explore Learning Categories
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
            Choose a category to discover courses that match your interests
          </Typography>
          
          <Grid container spacing={2}>
            {courseCategories.map((category, index) => (
              <Grid item xs={6} sm={4} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={category.icon}
                  onClick={() => handleCategoryClick(category.name)}
                  sx={{
                    p: 2,
                    height: 'auto',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    borderColor: category.color,
                    color: category.color,
                    '&:hover': {
                      backgroundColor: `${category.color}10`,
                      borderColor: category.color,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${category.color}30`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {category.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                    {category.name}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleExploreClose();
                navigate('/courses');
              }}
              sx={{
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0'
                }
              }}
            >
              View All Courses
            </Button>
          </Box>
        </Box>
      </Popover>

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

      {/* Career Guidance Popup - Available for students */}
      {user?.role === UserRole.STUDENT && (
        <CareerGuidancePopup
          open={showCareerPopup}
          onClose={handleCareerPopupClose}
          onTakeCareerTest={handleTakeCareerTest}
          userFirstName={user?.firstName}
        />
      )}

      {/* Profile Modal */}
      <Dialog
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        keepMounted={false} // Don't keep component mounted when closed
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6">Profile</Typography>
          <IconButton
            onClick={() => setProfileModalOpen(false)}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          <ProfilePage key={profileRefreshKey} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Layout;
