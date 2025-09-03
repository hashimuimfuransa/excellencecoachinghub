import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useTheme as useMuiTheme,
  alpha,
  ListSubheader,
  Collapse,
  useMediaQuery,
  InputBase,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Work,
  Person,
  Assessment,
  Psychology,
  EmojiEvents,
  Settings,
  Logout,
  Notifications,
  DarkMode,
  LightMode,
  Add,
  Business,
  People,
  Analytics,
  Bookmark,
  School,
  MenuBook,
  ExpandLess,
  ExpandMore,
  Search,
  TrendingUp,
  Timeline,
  CheckCircle,
  Schedule,
  StarBorder,
  Star,
  AccountCircle,
  BarChart,
  Lightbulb,
  History,
  Description,
  PersonAdd,
  Mail,
  ChevronLeft,
  ChevronRight,
  SearchOff,
  FilterList,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../contexts/AuthContext';


import SearchBar from '../components/search/SearchBar';
import EnhancedSearchBar from '../components/search/EnhancedSearchBar';
import { notificationService } from '../services/notificationService';
import { chatService } from '../services/chatService';

const drawerWidth = 260;
const drawerWidthClosed = 72;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  roles?: UserRole[];
  badge?: number;
  children?: NavItem[];
}

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false); // Desktop sidebar starts minimized
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState(false); // Track hover state for mini drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile quick actions menu
  

  
  // Real-time counts
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Calculate current drawer width
  const currentDrawerWidth = isMobile 
    ? drawerWidth 
    : (desktopOpen || hovered) ? drawerWidth : drawerWidthClosed;





  // Load real-time notification and message counts
  useEffect(() => {
    const loadCounts = async () => {
      if (!user) return;
      
      try {
        // Load unread notifications
        const notificationResponse = await notificationService.getUnreadCount();
        setUnreadNotifications(notificationResponse.data?.count || 0);

        // Load unread messages from chat conversations
        const totalUnreadMessages = await chatService.getTotalUnreadCount();
        setUnreadMessages(totalUnreadMessages);

        // Initialize chat service for real-time updates
        chatService.initializeSocket(user._id);

        // Listen for new messages
        chatService.on('new-message', () => {
          setUnreadMessages(prev => prev + 1);
        });

        // Listen for messages read
        chatService.on('messages-read', () => {
          loadCounts(); // Reload counts when messages are read
        });

      } catch (error) {
        console.error('Error loading counts:', error);
      }
    };

    loadCounts();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    
    return () => {
      clearInterval(interval);
      chatService.disconnect();
    };
  }, [user]);

  // Toggle submenu open/closed state
  const handleToggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Search handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearchSubmit(event);
    } else if (event.key === 'Escape') {
      setSearchQuery('');
      setSearchFocused(false);
    }
  };

  // Define navigation items with categories and sub-items
  const getNavigationItems = (): NavItem[] => {
    const isStudent = hasRole(UserRole.STUDENT);
    const isJobSeeker = hasRole(UserRole.PROFESSIONAL) || hasRole(UserRole.JOB_SEEKER);
    const isEmployer = hasRole(UserRole.EMPLOYER);
    
    // For job seekers (students or professionals)
    const isJobSeekerView = isStudent || isJobSeeker;

    // Common items for all users - Start with Network as main page
    const commonItems: NavItem[] = [];

    // Job seeker specific items
    const jobSeekerItems: NavItem[] = [
      {
        label: 'Find Jobs',
        path: '/app/jobs',
        icon: <Work />,
      },
      {
        label: 'My Applications',
        path: '/app/applications',
        icon: <Person />,
        badge: 2
      },
   
      {
        label: 'Career Guidance',
        path: '/app/career-guidance',
        icon: <TrendingUp />,
      },
      {
        label: 'Career preparation',
        path: '#',
        icon: <School />,
        children: [
          {
            label: 'Psychometric Tests',
            path: '/app/tests',
            icon: <Psychology />,
          },
          {
            label: 'Smart Exams',
            path: '/app/smart-tests',
            icon: <Assessment />,
          },
          {
            label: 'Psychometric Test Results',
            path: '/app/test-results',
            icon: <BarChart />,
          },
          {
            label: 'Smart Exam Results',
            path: '/app/smart-test-results',
            icon: <Timeline />,
          },
          {
            label: 'Interview Practice',
            path: '/app/interviews',
            icon: <Assessment />,
          },
          {
            label: 'Interview History',
            path: '/app/interviews/history', 
            icon: <History />,
          },
          {
            label: 'CV Builder',
            path: '/app/cv-builder',
            icon: <Description />,
          },
          {
            label: 'Courses',
            path: '/app/courses',
            icon: <MenuBook />,
          },
          {
            label: 'Certificates',
            path: '/app/certificates',
            icon: <EmojiEvents />,
          }
        ]
      }
    ];

    // Employer specific items
    const employerItems: NavItem[] = [
      {
        label: 'Job Management',
        path: '#',
        icon: <Work />,
        children: [
          {
            label: 'Post New Job',
            path: '/app/jobs/create',
            icon: <Add />,
          },
          {
            label: 'My Jobs',
            path: '/app/employer/jobs',
            icon: <Business />,
          }
        ]
      },
      {
        label: 'Candidates',
        path: '#',
        icon: <People />,
        children: [
          {
            label: 'All Applications',
            path: '/app/employer/candidates',
            icon: <Person />,
            badge: 5
          },
          {
            label: 'Talent Pool',
            path: '/app/employer/talent-pool',
            icon: <Search />,
          },
          {
            label: 'Saved Candidates',
            path: '/app/employer/saved-candidates',
            icon: <Star />,
          },
          {
            label: 'Hired',
            path: '/app/employer/hired',
            icon: <CheckCircle />,
          }
        ]
      },
      {
        label: 'Interviews',
        path: '/app/employer/interviews',
        icon: <Assessment />,
      },
      {
        label: 'Analytics',
        path: '/app/employer/analytics',
        icon: <BarChart />,
      },
      {
        label: 'Company Profile',
        path: '/app/employer/company-profile',
        icon: <Business />,
      }
    ];

    // Network and Social items (for all users)
    const networkItems: NavItem[] = [
      {
        label: 'Home',
        path: '/app/network',
        icon: <Dashboard />,
      },
      {
        label: 'Connections',
        path: '/app/connections',
        icon: <PersonAdd />,
      },
      {
        label: 'Notifications',
        path: '/app/notifications',
        icon: <Notifications />,
        badge: unreadNotifications
      },
      {
        label: 'Messages',
        path: '/app/messages',
        icon: <Mail />,
        badge: unreadMessages
      }
    ];

    // Combine items based on user role
    let items = [...commonItems, ...networkItems];
    
    if (isJobSeekerView) {
      items = [...items, ...jobSeekerItems];
      // Add profile for job seekers only
      items.push({
        label: 'Profile',
        path: '/app/profile',
        icon: <AccountCircle />,
      });
    }
    
    if (isEmployer) {
      items = [...items, ...employerItems];
      // Employers use Company Profile instead of regular Profile
    }
    
    return items;
  };

  const navigationItems = getNavigationItems();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
    // Close submenus when collapsing
    if (desktopOpen) {
      setOpenSubMenus({});
    }
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
      // Use navigate instead of window.location.href to avoid refresh loops
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      navigate('/login', { replace: true });
    }
  };

  const handleNavigation = (path: string) => {
    if (path !== '#') {
      navigate(path);
      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  };

  // Enhanced navigation function for Quick Actions using window.location
  const handleQuickActionNavigation = (path: string) => {
    if (path !== '#') {
      window.location.href = path;
      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  };

  // Back button handler
  const handleBackNavigation = () => {
    navigate(-1);
  };

  // Check if we should show the back button
  const shouldShowBackButton = () => {
    // Don't show back button on main pages
    const mainPages = ['/app/network', '/app', '/app/'];
    const currentPath = location.pathname;
    
    // Don't show on root app pages
    if (mainPages.includes(currentPath)) {
      return false;
    }
    
    return true;
  };



  // Recursive function to render navigation items with nested submenus
  const renderNavItems = (items: NavItem[], level: number = 0) => {
    const isCollapsed = !isMobile && !desktopOpen && !hovered;
    
    return items.map((item, index) => {
      // Skip items that don't match user roles
      if (item.roles && !hasAnyRole(item.roles)) {
        return null;
      }

      const isSelected = location.pathname === item.path;
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openSubMenus[item.label] || false;
      
      // Check if any child is selected
      const isChildSelected = hasChildren && item.children?.some(
        child => location.pathname === child.path
      );

      // Generate unique key using label and level to avoid duplicate keys when path is '#'
      const uniqueKey = `${item.label}-${level}-${index}`;

      // Don't show nested items when collapsed
      if (isCollapsed && level > 0) {
        return null;
      }

      return (
        <React.Fragment key={uniqueKey}>
          <Tooltip 
            title={isCollapsed ? item.label : ''} 
            placement="right" 
            disableHoverListener={!isCollapsed}
          >
            <ListItem 
              disablePadding 
              sx={{ 
                display: 'block',
                pl: level > 0 ? 2 : 0
              }}
            >
              <ListItemButton
                selected={isSelected || isChildSelected}
                onClick={() => {
                  if (isCollapsed && hasChildren) {
                    // If collapsed and has children, expand drawer first
                    setDesktopOpen(true);
                    setTimeout(() => handleToggleSubMenu(item.label), 50);
                  } else {
                    hasChildren 
                      ? handleToggleSubMenu(item.label) 
                      : handleNavigation(item.path);
                  }
                }}
                sx={{
                  minHeight: 48,
                  px: isCollapsed ? 1.5 : 2.5,
                  borderRadius: '12px',
                  mx: 1,
                  my: 0.5,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  background: (isSelected || isChildSelected) 
                    ? `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.main, 0.15)} 0%, ${alpha(muiTheme.palette.primary.main, 0.05)} 100%)`
                    : 'transparent',
                  border: (isSelected || isChildSelected) 
                    ? `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`
                    : '1px solid transparent',
                  boxShadow: (isSelected || isChildSelected)
                    ? `0 2px 8px ${alpha(muiTheme.palette.primary.main, 0.15)}`
                    : 'none',
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.12)}`,
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: isCollapsed ? 0 : 40,
                  mr: isCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: isSelected || isChildSelected 
                    ? 'primary.main' 
                    : 'text.secondary'
                }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (isSelected || isChildSelected) 
                        ? alpha(muiTheme.palette.primary.main, 0.15)
                        : 'transparent'
                    }}
                  >
                    {item.icon}
                  </Box>
                </ListItemIcon>
                {(!isCollapsed) && (
                  <>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{
                        fontWeight: isSelected || isChildSelected ? 600 : 500,
                        color: isSelected || isChildSelected ? 'primary.main' : 'text.primary',
                        fontSize: '0.875rem'
                      }}
                    />
                    {item.badge && (
                      <Badge 
                        badgeContent={item.badge} 
                        color="primary" 
                        sx={{ mr: 1 }}
                      />
                    )}
                    {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                  </>
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          
          {/* Render children if any */}
          {hasChildren && !isCollapsed && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderNavItems(item.children!, level + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const drawer = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: mode === 'dark' 
          ? `linear-gradient(135deg, ${muiTheme.palette.background.paper} 0%, ${alpha(muiTheme.palette.background.paper, 0.95)} 100%)`
          : `linear-gradient(135deg, ${muiTheme.palette.background.paper} 0%, ${alpha(muiTheme.palette.primary.main, 0.02)} 100%)`,
      }}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
    >
      {/* Header with toggle button */}
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: (isMobile || desktopOpen || hovered) ? 'space-between' : 'center',
        borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
        px: (isMobile || desktopOpen || hovered) ? 2 : 1.5,
        background: `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.main, 0.08)} 0%, ${alpha(muiTheme.palette.secondary.main, 0.04)} 100%)`,
      }}>
        {(isMobile || desktopOpen || hovered) && (
          <Box 
            component={Link} 
            to="/app/network"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'text.primary' 
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <img 
                src="/exjobnetlogo.png" 
                alt="ExJobNet Logo"
                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h6" fontWeight="bold" noWrap component="div">
              ExJobNet
            </Typography>
          </Box>
        )}
        
        {/* Just show logo when collapsed */}
        {!isMobile && !desktopOpen && !hovered && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <img 
                src="/exjobnetlogo.png" 
                alt="ExJobNet Logo"
                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              />
            </Box>
          </Box>
        )}
        
        {/* Desktop toggle button */}
        {!isMobile && (isMobile || desktopOpen || hovered) && (
          <IconButton 
            onClick={handleDesktopDrawerToggle}
            sx={{
              color: 'primary.main',
              '&:hover': {
                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
              }
            }}
          >
            {desktopOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        )}
      </Toolbar>
      
      <Box sx={{ 
        overflow: 'auto', 
        flexGrow: 1, 
        px: 0.5, 
        py: 2,
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(muiTheme.palette.primary.main, 0.3),
          borderRadius: '2px',
        },
      }}>
        <List sx={{ py: 0 }}>
          {renderNavItems(navigationItems)}
        </List>
      </Box>
      
      {/* User profile section */}
      {(isMobile || desktopOpen || hovered) && (
        <Box sx={{ 
          p: 1.5, 
          borderTop: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
          background: `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.main, 0.05)} 0%, ${alpha(muiTheme.palette.secondary.main, 0.02)} 100%)`,
        }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.15)}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(muiTheme.palette.primary.main, 0.15),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.15)}`,
              }
            }}
            onClick={handleProfileMenuOpen}
          >
            <Avatar
              alt={user?.firstName}
              src={user?.avatar}
              sx={{ 
                width: 36, 
                height: 36, 
                mr: 1.5,
                border: `2px solid ${muiTheme.palette.primary.main}`,
                boxShadow: `0 2px 8px ${alpha(muiTheme.palette.primary.main, 0.3)}`
              }}
            >
              {user?.firstName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight="600" noWrap>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight="500">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Collapsed user avatar */}
      {!isMobile && !desktopOpen && !hovered && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={handleProfileMenuOpen}>
            <Avatar
              alt={user?.firstName}
              src={user?.avatar}
              sx={{ 
                width: 32, 
                height: 32,
                border: `2px solid ${muiTheme.palette.primary.main}`,
              }}
            >
              {user?.firstName?.charAt(0)}
            </Avatar>
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { 
            xs: '100%',
            sm: `calc(100% - ${currentDrawerWidth}px)` 
          },
          ml: { 
            xs: 0,
            sm: `${currentDrawerWidth}px` 
          },
          bgcolor: alpha(muiTheme.palette.background.paper, 0.98),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
          transition: muiTheme.transitions.create(['width', 'margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.standard,
          }),
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: '64px !important', sm: '70px !important' },
          px: { xs: 1, sm: 2, md: 3 },
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {/* Left Section - Logo & Mobile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { sm: 'none' },
                p: 1.5,
                borderRadius: '16px',
                bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.12)}`,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.15),
                  transform: 'scale(1.05)',
                  boxShadow: `0 4px 15px ${alpha(muiTheme.palette.primary.main, 0.2)}`
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Mobile Back Button */}
            {shouldShowBackButton() && (
              <IconButton
                onClick={handleBackNavigation}
                sx={{ 
                  display: { sm: 'none' },
                  p: 1.5,
                  borderRadius: '16px',
                  bgcolor: alpha(muiTheme.palette.secondary.main, 0.08),
                  border: `1px solid ${alpha(muiTheme.palette.secondary.main, 0.12)}`,
                  color: 'secondary.main',
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.secondary.main, 0.15),
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 15px ${alpha(muiTheme.palette.secondary.main, 0.2)}`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ArrowBack />
              </IconButton>
            )}

            {/* Desktop Sidebar Toggle */}
            {!isMobile && !desktopOpen && !hovered && (
              <IconButton
                onClick={handleDesktopDrawerToggle}
                sx={{
                  p: 1.5,
                  borderRadius: '16px',
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.12)}`,
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.15),
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 15px ${alpha(muiTheme.palette.primary.main, 0.2)}`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Back Button */}
            {shouldShowBackButton() && (
              <Tooltip title="Go Back">
                <IconButton
                  onClick={handleBackNavigation}
                  sx={{
                    p: 1.5,
                    borderRadius: '16px',
                    bgcolor: alpha(muiTheme.palette.secondary.main, 0.08),
                    border: `1px solid ${alpha(muiTheme.palette.secondary.main, 0.12)}`,
                    color: 'secondary.main',
                    '&:hover': {
                      bgcolor: alpha(muiTheme.palette.secondary.main, 0.15),
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 15px ${alpha(muiTheme.palette.secondary.main, 0.2)}`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Modern Logo */}
            <Box 
              component={Link} 
              to="/app/network"
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center', 
                textDecoration: 'none',
                gap: 1.5,
                p: 1,
                borderRadius: '20px',
                '&:hover': {
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.04),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 8px 25px ${alpha(muiTheme.palette.primary.main, 0.15)}`,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Box
                component="img"
                src="/exjobnetlogo.png"
                alt="ExJobNet Logo"
                sx={{
                  width: { md: 45, lg: 50 },
                  height: { md: 45, lg: 50 },
                  borderRadius: '14px',
                  boxShadow: `0 4px 20px ${alpha(muiTheme.palette.primary.main, 0.2)}`,
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                  '&:hover': {
                    transform: 'scale(1.05) rotate(1deg)',
                    boxShadow: `0 8px 30px ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <Box>
                <Typography 
                  variant="h6" 
                  fontWeight="800"
                  sx={{ 
                    background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, #667eea, ${muiTheme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 100%',
                    letterSpacing: '-0.8px',
                    lineHeight: 1.1,
                    fontSize: { md: '1.1rem', lg: '1.25rem' },
                    fontFamily: '"Inter", "Roboto", sans-serif',
                    '&:hover': {
                      backgroundPosition: '100% 0',
                    },
                    transition: 'background-position 0.5s ease',
                  }}
                >
                  ExJobNet
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    lineHeight: 1,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                  }}
                >
                  Career Hub
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Center Section - Enhanced Search Bar */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            flexGrow: 1,
            maxWidth: { md: '350px', lg: '450px' },
            mx: { md: 2, lg: 3 }
          }}>
            <Paper
              component="form"
              onSubmit={handleSearchSubmit}
              elevation={0}
              sx={{
                position: 'relative',
                width: '100%',
                borderRadius: '20px',
                bgcolor: searchFocused 
                  ? alpha(muiTheme.palette.background.paper, 0.95)
                  : alpha(muiTheme.palette.background.paper, 0.7),
                border: searchFocused 
                  ? `2px solid ${muiTheme.palette.primary.main}`
                  : `1px solid ${alpha(muiTheme.palette.primary.main, 0.15)}`,
                backdropFilter: 'blur(12px)',
                boxShadow: searchFocused 
                  ? `0 8px 25px ${alpha(muiTheme.palette.primary.main, 0.15)}`
                  : `0 2px 10px ${alpha(muiTheme.palette.common.black, 0.05)}`,
                '&:hover': {
                  border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                  bgcolor: alpha(muiTheme.palette.background.paper, 0.9),
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
              }}
            >
              <InputBase
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search jobs, companies, skills..."
                sx={{
                  width: '100%',
                  px: 2.5,
                  py: 1.5,
                  fontSize: '0.9rem',
                  fontWeight: '400',
                  color: 'text.primary',
                  '& .MuiInputBase-input': {
                    '&::placeholder': {
                      color: 'text.secondary',
                      opacity: 0.8,
                      fontWeight: '400',
                    }
                  }
                }}
                startAdornment={
                  <Search 
                    sx={{ 
                      mr: 1.5, 
                      color: searchFocused ? 'primary.main' : 'text.secondary',
                      fontSize: '1.2rem',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                }
                endAdornment={searchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchFocused(false);
                    }}
                    sx={{
                      p: 0.5,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary',
                        bgcolor: alpha(muiTheme.palette.action.hover, 0.5),
                      }
                    }}
                  >
                    <Box component="span" sx={{ fontSize: '1rem' }}>×</Box>
                  </IconButton>
                )}
              />
              
              {/* Search suggestion hint */}
              {searchFocused && !searchQuery && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 1,
                    p: 2,
                    bgcolor: muiTheme.palette.background.paper,
                    borderRadius: '12px',
                    boxShadow: `0 8px 25px ${alpha(muiTheme.palette.common.black, 0.1)}`,
                    border: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
                    zIndex: 1000,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                    Try searching for: "Software Engineer", "Remote", "Marketing"
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Right Section - Essential Actions & Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
            {/* Mobile Search Icon */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Tooltip title="Search Jobs">
                <IconButton 
                  onClick={() => navigate('/app/jobs')}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <Search fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={() => navigate('/app/notifications')}
                size="small"
                sx={{
                  color: 'text.secondary',
                  position: 'relative',
                  borderRadius: '12px',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Badge 
                  badgeContent={unreadNotifications} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      border: `2px solid ${muiTheme.palette.background.paper}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Notifications fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Messages */}
            <Tooltip title="Messages">
              <IconButton
                onClick={() => navigate('/app/messages')}
                size="small"
                sx={{
                  color: 'text.secondary',
                  position: 'relative',
                  borderRadius: '12px',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Badge 
                  badgeContent={unreadMessages} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      border: `2px solid ${muiTheme.palette.background.paper}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Mail fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Enhanced Theme Toggle - Desktop Only */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton 
                  onClick={toggleTheme}
                  size="small"
                  sx={{
                    position: 'relative',
                    borderRadius: '12px',
                    color: 'text.secondary',
                    bgcolor: alpha(muiTheme.palette.background.default, 0.5),
                    border: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 15px ${alpha(muiTheme.palette.primary.main, 0.15)}`,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      background: mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))'
                        : 'linear-gradient(135deg, rgba(63, 81, 181, 0.1), rgba(33, 150, 243, 0.1))',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                      opacity: 1,
                    }
                  }}
                >
                  {mode === 'dark' ? (
                    <LightMode 
                      fontSize="small" 
                      sx={{ 
                        color: 'warning.main',
                        filter: 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3))',
                      }} 
                    />
                  ) : (
                    <DarkMode 
                      fontSize="small"
                      sx={{ 
                        color: 'primary.main',
                        filter: 'drop-shadow(0 2px 4px rgba(63, 81, 181, 0.3))',
                      }} 
                    />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Enhanced Profile */}
            <Tooltip 
              title={
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: '600' }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              }
            >
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                sx={{ 
                  p: 0.5,
                  ml: { xs: 0.5, md: 1.5 },
                  position: 'relative',
                  borderRadius: '50%',
                  '&:hover': {
                    transform: 'scale(1.08) translateY(-1px)',
                    '& .MuiAvatar-root': {
                      boxShadow: `0 8px 25px ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    background: `conic-gradient(from 0deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.secondary.main}, ${muiTheme.palette.primary.main})`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 0.6,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Avatar
                  alt={user?.firstName}
                  src={user?.avatar}
                  sx={{ 
                    width: { xs: 34, md: 40 }, 
                    height: { xs: 34, md: 40 },
                    border: `3px solid ${muiTheme.palette.background.paper}`,
                    boxShadow: `0 4px 15px ${alpha(muiTheme.palette.common.black, 0.1)}`,
                    background: user?.avatar ? 'transparent' : `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.secondary.main})`,
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1rem',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s ease',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      border: `2px solid ${muiTheme.palette.background.paper}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            borderRadius: 2,
            minWidth: 180,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/app/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/app/applications')}>
          <ListItemIcon>
            <Work fontSize="small" />
          </ListItemIcon>
          My Applications
        </MenuItem>
        <MenuItem onClick={() => navigate('/app/profile/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        
        {/* E-Learning Platform Link */}
        {(hasRole(UserRole.STUDENT) || hasRole(UserRole.PROFESSIONAL)) && [
          <Divider key="divider-elearning" />,
          <MenuItem key="elearning-link" onClick={() => window.open('/elearning/dashboard/student', '_blank')}>
            <ListItemIcon>
              <School fontSize="small" color="primary" />
            </ListItemIcon>
            <Typography color="primary">Back to E-Learning</Typography>
          </MenuItem>
        ]}
        
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile Quick Actions Menu */}
      <Menu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          elevation: 16,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 8px 32px rgba(0,0,0,0.12))',
            mt: 1.5,
            borderRadius: 4,
            minWidth: 240,
            bgcolor: 'background.paper',
            border: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorEl={null}
        anchorReference="anchorPosition"
        anchorPosition={{ top: 75, left: window.innerWidth - 60 }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            Quick Actions
          </Typography>
        </Box>

        <MenuItem 
          onClick={() => {
            handleQuickActionNavigation('/app/career-guidance');
            setMobileMenuOpen(false);
          }}
          sx={{ 
            py: 1.5,
            px: 2,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&:hover': {
              bgcolor: alpha(muiTheme.palette.success.main, 0.08),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Psychology sx={{ color: 'success.main', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Career Guidance"
            secondary="Get prepared for success"
            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            handleQuickActionNavigation('/app/jobs');
            setMobileMenuOpen(false);
          }}
          sx={{ 
            py: 1.5,
            px: 2,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&:hover': {
              bgcolor: alpha(muiTheme.palette.primary.main, 0.08),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Work sx={{ color: 'primary.main', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Find Jobs"
            secondary="Browse available positions"
            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem 
          onClick={() => {
            handleQuickActionNavigation('/app/network');
            setMobileMenuOpen(false);
          }}
          sx={{ 
            py: 1.5,
            px: 2,
            borderRadius: 1,
            mx: 1,
            mb: 1,
            '&:hover': {
              bgcolor: alpha(muiTheme.palette.secondary.main, 0.08),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <People sx={{ color: 'secondary.main', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Community"
            secondary="Connect with professionals"
            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: muiTheme.transitions.create('width', {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
        }}
        aria-label="navigation"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
              boxShadow: `0 8px 32px ${alpha(muiTheme.palette.common.black, 0.1)}`,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              borderRight: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
              boxShadow: `0 0 24px ${alpha(muiTheme.palette.common.black, 0.06)}`,
              bgcolor: 'background.paper',
              transition: muiTheme.transitions.create('width', {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.standard,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { 
            xs: '100vw', 
            sm: `calc(100% - ${currentDrawerWidth}px)` 
          },
          maxWidth: { xs: '100vw', sm: 'none' },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: muiTheme.transitions.create(['width', 'margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.standard,
          }),
          position: 'relative',
          overflow: { xs: 'hidden', sm: 'auto' }, // Better mobile overflow handling
          ml: { xs: 0, sm: `${currentDrawerWidth}px` },
        }}
      >
        {/* Spacer for fixed AppBar */}
        <Box sx={{ height: { xs: '64px', sm: '70px' } }} />
        
        {/* Main Content Container - Enhanced Mobile Optimization */}
        <Box
          sx={{
            px: { xs: 0, sm: 1, md: 2 },
            py: { xs: 0, sm: 1, md: 2 },
            maxWidth: '100%',
            mx: 'auto',
            position: 'relative',
            minHeight: 'calc(100vh - 64px)',
            width: '100%',
            // Better mobile handling
            '& > *': {
              maxWidth: '100%',
              overflowX: 'hidden'
            }
          }}
        >
          {/* Page Content - Enhanced Mobile Optimization */}
          <Box 
            sx={{ 
              opacity: 0, 
              animation: 'slideInUp 0.4s ease-out forwards',
              width: '100%',
              height: '100%',
              // Global mobile responsive overrides
              '& .MuiContainer-root': {
                px: { xs: 0.5, sm: 1, md: 2 },
                maxWidth: '100% !important',
                width: '100%',
                mx: 0
              },
              '& .MuiGrid-container': {
                mx: { xs: 0, sm: 'auto' },
                width: '100%',
                maxWidth: '100%'
              },
              '& .MuiCard-root': {
                mx: { xs: 0, sm: 'auto' },
                borderRadius: { xs: 1, sm: 2, md: 3 },
                width: '100%',
                maxWidth: '100%'
              },
              '& .MuiPaper-root': {
                mx: { xs: 0, sm: 'auto' },
                borderRadius: { xs: 1, sm: 2, md: 3 },
                width: { xs: '100%', sm: 'auto' },
                maxWidth: '100%'
              },
              // Tab optimization
              '& .MuiTabs-root': {
                minHeight: { xs: 40, md: 48 }
              },
              '& .MuiTab-root': {
                minWidth: { xs: 60, sm: 90 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                py: { xs: 1, md: 1.5 }
              },
              // Better mobile spacing
              '& .MuiBox-root': {
                maxWidth: { xs: '100%', sm: 'none' }
              },
              '@keyframes slideInUp': {
                '0%': { 
                  opacity: 0, 
                  transform: 'translateY(10px)',
                },
                '100%': { 
                  opacity: 1, 
                  transform: 'translateY(0)',
                },
              }
            }}
          >
            <Outlet key={location.key} />
          </Box>
        </Box>

        {/* Background Pattern - Subtle */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: mode === 'dark' 
              ? `radial-gradient(circle at 25% 25%, ${alpha(muiTheme.palette.primary.main, 0.02)} 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, ${alpha(muiTheme.palette.secondary.main, 0.02)} 0%, transparent 50%)`
              : `radial-gradient(circle at 25% 25%, ${alpha(muiTheme.palette.primary.main, 0.01)} 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, ${alpha(muiTheme.palette.secondary.main, 0.01)} 0%, transparent 50%)`,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      </Box>


    </Box>
  );
};

export default MainLayout;