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
  ChevronLeft,
  ChevronRight,
  Computer,
  Business,
  Science,
  Palette,
  Language,
  LocalHospital,
  Engineering,
  Calculate,
  Search,
  Close,
  Work
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { UserRole } from '../../shared/types';
import { isLearnerRole } from '../../utils/roleUtils';
import { SafeDialogTransition } from '../../utils/transitionFix';
import EmailVerificationBanner from '../Auth/EmailVerificationBanner';
import FloatingAIAssistant from '../FloatingAIAssistant';
import { getDrawerWidth, useResponsive } from '../../utils/responsive';
import ProfilePage from '../../pages/Profile/ProfilePage';
import BottomNavigationBar from '../BottomNavigationBar';

// Ultra-Modern Responsive styled components
const ResponsiveAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${collapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH}px)`,
    marginLeft: collapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH,
    transition: theme.transitions.create(['width', 'margin'], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.sharp,
    }),
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
  background: `
    linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
    linear-gradient(45deg, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0.05) 100%)
  `,
  backdropFilter: 'blur(20px)',
  color: '#ffffff',
  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
  borderBottom: '1px solid rgba(255,255,255,0.15)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 3s ease-in-out infinite',
    pointerEvents: 'none'
  },
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' }
  }
}));

const COLLAPSED_DRAWER_WIDTH = 0;
const EXPANDED_DRAWER_WIDTH = 280;

const ResponsiveDrawer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  [theme.breakpoints.up('md')]: {
    width: collapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH,
    flexShrink: 0,
    transition: theme.transitions.create(['width'], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.sharp,
    }),
    overflow: 'hidden',
    '& .MuiDrawer-paper': {
      width: EXPANDED_DRAWER_WIDTH,
      boxSizing: 'border-box',
      background: `
        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%),
        linear-gradient(90deg, rgba(102, 126, 234, 0.02) 0%, rgba(240, 147, 251, 0.02) 100%)
      `,
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(102, 126, 234, 0.1)',
      boxShadow: '4px 0 24px rgba(102, 126, 234, 0.08)',
      overflowX: 'hidden',
      transition: theme.transitions.create(['transform', 'opacity'], {
        duration: theme.transitions.duration.enteringScreen,
        easing: theme.transitions.easing.sharp,
      }),
      transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
      opacity: collapsed ? 0 : 1,
      visibility: collapsed ? 'hidden' : 'visible',
      pointerEvents: collapsed ? 'none' : 'auto'
    },
  },
}));

const ResponsiveMain = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  padding: theme.spacing(0, 1, 2, 1),
  paddingTop: theme.spacing(1),
  marginLeft: 0,
  transition: theme.transitions.create(['margin', 'padding'], {
    duration: theme.transitions.duration.enteringScreen,
    easing: theme.transitions.easing.sharp,
  }),
  [theme.breakpoints.up('md')]: {
    marginLeft: collapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH,
    padding: theme.spacing(0, 3, 4, 3),
    paddingTop: theme.spacing(2),
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(0, 4, 6, 4),
    paddingTop: theme.spacing(3),
  },
}));

const ResponsiveToolbar = styled(Toolbar)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    minHeight: 48, // Reduced from 56
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  [theme.breakpoints.up('sm')]: {
    minHeight: 56, // Reduced from 64
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
  onClick?: () => void;
}

const Layout: React.FC = () => {
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  
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

    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
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
        { text: 'My Courses', icon: <School />, path: '/dashboard/teacher/courses' },
        { text: 'Live Sessions', icon: <VideoCall />, path: '/dashboard/teacher/live-sessions' },
        { text: 'Community', icon: <Groups />, path: '/community/feed' },
        { text: 'Student Management', icon: <ManageAccounts />, path: '/dashboard/teacher/student-management' },
        { text: 'Grades & Performance', icon: <Grade />, path: '/dashboard/teacher/grades' },
        { text: 'Analytics', icon: <Analytics />, path: '/dashboard/teacher/analytics' },
        { text: 'Profile', icon: <Person />, path: '/dashboard/teacher/profile/complete' }
      );
    } else if (isLearnerRole(user?.role)) {
      roleSpecificItems.push(
        { text: 'My Courses', icon: <School />, path: '/dashboard/student/courses' },
        { text: '🔴 Live Sessions', icon: <VideoCall />, path: '/live-sessions' },
        { text: 'Community', icon: <Groups />, path: '/community/feed' },
        { text: 'Opportunities', icon: <Work />, path: '/dashboard/student/opportunities' },
        { text: 'My Grades', icon: <Grade />, path: '/dashboard/student/grades' },
        { text: 'Achievements', icon: <EmojiEvents />, path: '/dashboard/student/achievements' },
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

  // Real learning categories data - Professional and Attractive
  const courseCategories = [
    { 
      name: 'Professional Coaching', 
      icon: <Business />, 
      color: '#667eea',
      description: 'Leadership, Executive, Project Management, CPA/CAT/ACCA'
    },
    { 
      name: 'Business & Entrepreneurship', 
      icon: <TrendingUp />, 
      color: '#4facfe',
      description: 'Startup, Strategy, Finance, Marketing, Innovation'
    },
    { 
      name: 'Academic Coaching', 
      icon: <School />, 
      color: '#a8edea',
      description: 'Primary, Secondary, University, Nursery, Exams, Research'
    },
    { 
      name: 'Language Coaching', 
      icon: <Language />, 
      color: '#fa709a',
      description: 'English, French, Kinyarwanda, Business Communication'
    },
    { 
      name: 'Technical & Digital', 
      icon: <Computer />, 
      color: '#43e97b',
      description: 'AI, Data, Cybersecurity, Cloud, Dev, Digital Marketing'
    },
    { 
      name: 'Job Seeker Coaching', 
      icon: <Work />, 
      color: '#ff9966',
      description: 'Career choice, skills, exams, interview, resume'
    },
    { 
      name: 'Personal & Corporate Development', 
      icon: <Psychology />, 
      color: '#9c27b0',
      description: 'Soft skills, Team building, Communication, Leadership'
    },
    { 
      name: 'Health & Medicine', 
      icon: <LocalHospital />, 
      color: '#00796b',
      description: 'Medical training, Healthcare, Nursing, Pharmacy'
    }
  ];

  // Enhanced drawer content
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', alignItems: collapsed ? 'center' : 'stretch' }}>
      {/* Enhanced Logo/Brand Section */}
      <Box 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          textAlign: 'center',
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(240, 147, 251, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          width: '100%'
        }}
      >
        {/* Background Glow */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at center, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
            opacity: 0.5
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.8,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
            }}
          >
            <img
              src="/logo.webp"
              alt="Excellence Coaching Hub"
              style={{ 
                height: isMobile ? '24px' : '32px', 
                width: 'auto' 
              }}
            />
          </Box>
          
          <Typography 
            variant={isMobile ? "subtitle2" : "h6"} 
            noWrap 
            component="div"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              fontSize: { xs: '0.8rem', sm: '1rem' }
            }}
          >
            Excellence Hub
          </Typography>
          
          <Typography 
            variant="caption"
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              fontWeight: 500,
              opacity: 0.8
            }}
          >
          {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} Portal
        </Typography>
        </Box>
      </Box>

      {/* Navigation Items - Scrollable */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <List 
          sx={{ 
            flexGrow: 1,
            py: { xs: 0.5, sm: 0.5 },
            overflow: 'auto',
            '& .MuiListItem-root': {
              px: { xs: 0.5, sm: 1 }
            },
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '2px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(102, 126, 234, 0.3)',
              borderRadius: '2px',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.5)',
              },
            },
          }}
        >
        {getNavigationItems().map((item) => {
          const isLiveSession = item.text.includes('Live Sessions');
          
          // No profile status checks - all features accessible
          const isDisabled = false;
          
          return (
            <ResponsiveListItem key={item.text} disablePadding>
              <Tooltip 
                title={isDisabled ? 'This feature is currently disabled' : ''}
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
                  minHeight: { xs: 40, sm: 44 },
                  px: { xs: 1, sm: 1.5 },
                  borderRadius: 2,
                  mx: { xs: 0.5, sm: 1 },
                  mb: 0.5,
                  position: 'relative',
                  overflow: 'hidden',
                  // Base styling with glassmorphism
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                  // Disabled styling
                  ...(isDisabled ? {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  } : {}),
                  // Special styling for Live Sessions
                  ...(isLiveSession && !isDisabled && {
                    background: `linear-gradient(135deg, rgba(255, 82, 82, 0.15) 0%, rgba(255, 107, 107, 0.08) 100%)`,
                    border: `1px solid rgba(255, 82, 82, 0.3)`,
                    boxShadow: '0 4px 20px rgba(255, 82, 82, 0.15)',
                    '&:hover': {
                      background: `linear-gradient(135deg, rgba(255, 82, 82, 0.2) 0%, rgba(255, 107, 107, 0.12) 100%)`,
                      borderColor: 'rgba(255, 82, 82, 0.5)',
                      transform: 'translateX(8px) scale(1.02)',
                      boxShadow: '0 8px 32px rgba(255, 82, 82, 0.25)',
                    },
                  }),
                  // Selected state with modern gradient
                  '&.Mui-selected': {
                    background: isLiveSession 
                      ? 'linear-gradient(135deg, #f56565 0%, #ef4444 100%)' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: isLiveSession 
                      ? '0 8px 32px rgba(245, 101, 101, 0.4)' 
                      : '0 8px 32px rgba(102, 126, 234, 0.4)',
                    border: 'none',
                    transform: 'translateX(4px)',
                    '&:hover': {
                      background: isLiveSession 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                        : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      transform: 'translateX(8px) scale(1.02)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    // Shimmer effect for selected items
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'slideShimmer 2s infinite',
                    },
                  },
                  // Regular hover state
                  ...(!isLiveSession && !isDisabled && {
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.05) 100%)',
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                    },
                  }),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '@keyframes slideShimmer': {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' }
                  }
                }}
              >
              <ListItemIcon 
                sx={{ 
                  minWidth: { xs: 36, sm: 40 },
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '1.1rem', sm: '1.3rem' },
                    transition: 'all 0.3s ease',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  fontWeight: isActivePath(item.path) ? 700 : 500,
                  color: isActivePath(item.path) ? 'inherit' : 'text.primary'
                }}
                sx={{
                  '& .MuiTypography-root': {
                    transition: 'all 0.3s ease'
                  }
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
      </Box>

      {/* Bottom Section - Fixed */}
      <Box sx={{ flexShrink: 0, borderTop: '1px solid rgba(102, 126, 234, 0.1)' }}>
        <List sx={{ py: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/dashboard/notifications')}
              sx={{
                minHeight: { xs: 40, sm: 44 },
                px: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                mx: { xs: 0.5, sm: 1 },
                mb: 0.5,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.05) 100%)',
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} />
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary="Notifications" 
                primaryTypographyProps={{
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  fontWeight: 500
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Only show Settings for Admin users */}
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/dashboard/admin/settings')}
                sx={{
                  minHeight: { xs: 40, sm: 44 },
                  px: { xs: 1, sm: 1.5 },
                  borderRadius: 2,
                  mx: { xs: 0.5, sm: 1 },
                  mb: 0.5,
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.05) 100%)',
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <Settings sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Settings" 
                  primaryTypographyProps={{
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    fontWeight: 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <ResponsiveAppBar
        collapsed={collapsed}
        position="fixed"
        sx={{ zIndex: theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={() => setCollapsed(prev => !prev)}
            sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>

          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              display: { xs: 'none', sm: 'block' },
              mr: 2
            }}
          >
            {user?.firstName} {user?.lastName}
          </Typography>

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              minWidth: { xs: 200, sm: 250, md: 350 },
              maxWidth: { xs: 250, sm: 300, md: 450 },
              flexGrow: { xs: 1, sm: 0 }
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

          {/* Explore Categories Button - Desktop */}
          <Button
            variant="contained"
            startIcon={<Explore />}
            endIcon={<ExpandMore />}
            onClick={handleExploreClick}
            sx={{
              mr: 2,
              textTransform: 'none',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              display: { xs: 'none', sm: 'flex' },
              minWidth: { sm: 120, md: 140 },
              height: { xs: 36, sm: 40 },
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-1px)',
                '&::before': {
                  opacity: 1,
                }
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.5s ease',
                opacity: 0,
              },
              '&:hover::before': {
                left: '100%',
                opacity: 1,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Explore
          </Button>

          {/* Explore Categories Button - Mobile */}
          <IconButton
            onClick={handleExploreClick}
            sx={{
              mr: 1,
              display: { xs: 'flex', sm: 'none' },
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Explore sx={{ color: 'white', fontSize: 20 }} />
          </IconButton>

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

      {/* Main Layout Container */}
      <Box sx={{ display: 'flex', flexGrow: 1, mt: { xs: '48px', sm: '56px' } }}>
        {/* Navigation Drawer */}
        <ResponsiveDrawer collapsed={collapsed} component="nav" aria-label="navigation">
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 },
            }}
          >
            {drawer}
          </Drawer>

          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
            }}
            open
          >
            {drawer}
          </Drawer>
        </ResponsiveDrawer>

        {/* Main content */}
        <ResponsiveMain collapsed={collapsed}>
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
          
          {/* Main Content with Mobile Bottom Navigation Spacing */}
          <Box sx={{ 
            pb: { xs: '80px', md: 0 }, // Add bottom padding on mobile for bottom nav
            minHeight: { xs: 'calc(100vh - 80px)', md: 'calc(100vh - 56px)' },
            marginBottom: { xs: 0, md: 0 },
            position: 'relative',
            // Add a subtle background pattern
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(240, 147, 251, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(79, 172, 254, 0.03) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
              zIndex: 0
            }
          }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Outlet />
            </Box>
          </Box>

          {/* Floating AI Assistant - Available for learners (students and job seekers) */}
          {isLearnerRole(user?.role) && (
            <FloatingAIAssistant
              context={{
                page: location.pathname,
                // Additional context can be passed here
              }}
            />
          )}
        </ResponsiveMain>
      </Box>

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
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
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
            mt: 2,
            minWidth: { xs: 320, sm: 450, md: 600 },
            maxWidth: { xs: '90vw', sm: 500, md: 700 },
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 50%, #9c27b0 100%)',
            }
          }
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4caf50 0%, #2196f3 100%)',
              mb: 2,
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
            }}>
              <Explore sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 1, 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #333 0%, #666 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Explore Learning Categories
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#666', 
                fontSize: '0.95rem',
                maxWidth: 400,
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Discover courses that match your interests and career goals
            </Typography>
          </Box>
          
          {/* Categories Grid */}
          <Grid container spacing={2.5}>
            {courseCategories.map((category, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleCategoryClick(category.name)}
                  sx={{
                    p: 2.5,
                    height: 'auto',
                    minHeight: 100,
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 3,
                    border: `2px solid ${category.color}20`,
                    background: `linear-gradient(135deg, ${category.color}08 0%, ${category.color}15 100%)`,
                    color: category.color,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}25 100%)`,
                      borderColor: category.color,
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: `0 12px 30px ${category.color}40`,
                      '&::before': {
                        opacity: 1,
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${category.color}10 0%, transparent 50%)`,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 1.5,
                    p: 1,
                    borderRadius: '50%',
                    background: `${category.color}15`,
                    width: 48,
                    height: 48,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {React.cloneElement(category.icon, { 
                      sx: { 
                        fontSize: 24, 
                        color: category.color,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      } 
                    })}
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      lineHeight: 1.3,
                      fontSize: '0.85rem',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {category.name}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {/* Footer Section */}
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(33, 150, 243, 0.05) 100%)',
            borderRadius: 2,
            p: 2
          }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Explore />}
              onClick={() => {
                handleExploreClose();
                navigate('/courses');
              }}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #2196f3 100%)',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)',
                borderRadius: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.5px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #45a049 0%, #1976d2 100%)',
                  boxShadow: '0 12px 35px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              View All Courses
            </Button>
          </Box>
        </Box>
      </Popover>


      {/* Profile Modal */}
      <Dialog
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        keepMounted={false} // Don't keep component mounted when closed
        TransitionComponent={SafeDialogTransition}
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

      {/* Instagram-style Bottom Navigation - Mobile Only */}
      <BottomNavigationBar 
        unreadNotifications={unreadCount}
        userRole={user?.role}
        userName={`${user?.firstName} ${user?.lastName}`}
        userAvatar={undefined}
        onCreatePost={() => {
          // Post creation handled by modal in BottomNavigationBar
        }}
      />
    </Box>
  );
};

export default Layout;
