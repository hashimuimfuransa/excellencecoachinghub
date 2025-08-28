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
  Collapse
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
  History
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../contexts/AuthContext';
import CareerGuidancePopup from '../components/CareerGuidancePopup';
import careerGuidanceService from '../services/careerGuidanceService';

const drawerWidth = 260;

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  
  // Career guidance popup state
  const [showCareerPopup, setShowCareerPopup] = useState(false);
  const [hasCheckedCareerTest, setHasCheckedCareerTest] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  // Reset career test check when navigating to dashboard pages
  useEffect(() => {
    const isDashboardPage = location.pathname === '/app' || location.pathname === '/app/dashboard' || location.pathname === '/app/';
    if (isDashboardPage && hasCheckedCareerTest) {
      console.log('🔄 [Job Portal] Resetting career test check for dashboard visit');
      setHasCheckedCareerTest(false);
    }
  }, [location.pathname, hasCheckedCareerTest]);

  // Check for job readiness test completion and show popup
  useEffect(() => {
    const checkCareerTestStatus = async () => {
      console.log('🔍 [Job Portal] Checking career test status...', {
        user: user?.email,
        role: user?.role,
        isEmployer: hasRole(UserRole.EMPLOYER),
        hasCheckedCareerTest,
        pathname: location.pathname
      });

      // Only show for job seekers (students or job seekers), not employers
      if (!user || hasRole(UserRole.EMPLOYER)) {
        console.log('❌ [Job Portal] Skipping career popup - user not eligible (no user or is employer)');
        return;
      }

      if (hasCheckedCareerTest) {
        console.log('❌ [Job Portal] Skipping career popup - already checked this session');
        return;
      }
      
      // Only show popup on dashboard pages
      const dashboardPages = ['/app', '/app/dashboard', '/app/'];
      const isDashboard = dashboardPages.includes(location.pathname);
      if (!isDashboard) {
        console.log('❌ [Job Portal] Skipping career popup - not on dashboard page');
        return;
      }

      // Skip career popup on certain pages
      const skipPages = ['/app/career-guidance', '/login', '/register'];
      if (skipPages.some(page => location.pathname.includes(page))) {
        console.log('❌ [Job Portal] Skipping career popup - on excluded page');
        setHasCheckedCareerTest(true);
        return;
      }

      // Check if dismissed recently (within 2 hours only, not 24 hours)
      const lastDismissed = localStorage.getItem('jobCareerPopupLastDismissed');
      if (lastDismissed) {
        const dismissedTime = new Date(lastDismissed).getTime();
        const now = new Date().getTime();
        const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
        
        if (hoursSinceDismissed < 2) {
          console.log('❌ [Job Portal] Skipping career popup - dismissed recently (within 2 hours)');
          setHasCheckedCareerTest(true);
          return;
        }
      }

      try {
        console.log('🔄 [Job Portal] Checking if user has completed career test...');
        const hasCompletedTest = await careerGuidanceService.checkHasCompletedJobReadinessTest();
        console.log('📊 [Job Portal] Career test completion status:', hasCompletedTest);
        
        if (!hasCompletedTest) {
          console.log('✅ [Job Portal] User has not completed test - showing popup in 3 seconds');
          setTimeout(() => {
            console.log('🎯 [Job Portal] Showing career guidance popup!');
            setShowCareerPopup(true);
            setHasCheckedCareerTest(true);
          }, 3000);
        } else {
          console.log('✅ [Job Portal] User has completed test - no popup needed');
          setHasCheckedCareerTest(true);
        }
      } catch (error) {
        console.error('❌ [Job Portal] Error checking job readiness test status:', error);
        // For testing, show popup if there's an error (user likely hasn't completed test)
        console.log('🔧 [Job Portal] Error occurred - showing popup as fallback');
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
  }, [user, location.pathname, hasCheckedCareerTest, hasRole]);

  // Toggle submenu open/closed state
  const handleToggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Define navigation items with categories and sub-items
  const getNavigationItems = (): NavItem[] => {
    const isStudent = hasRole(UserRole.STUDENT);
    const isJobSeeker = hasRole(UserRole.PROFESSIONAL) || hasRole(UserRole.JOB_SEEKER);
    const isEmployer = hasRole(UserRole.EMPLOYER);
    
    // For job seekers (students or professionals)
    const isJobSeekerView = isStudent || isJobSeeker;

    // Common items for all users
    const commonItems: NavItem[] = [
      {
        label: 'Dashboard',
        path: isEmployer ? '/app/employer/dashboard' : '/app/dashboard',
        icon: <Dashboard />,
      }
    ];

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
            label: 'Test Results',
            path: '/app/test-results',
            icon: <BarChart />,
          },
          {
            label: 'AI Interview Practice',
            path: '/app/interviews',
            icon: <Assessment />,
          },
          {
            label: 'Interview History',
            path: '/app/interviews/history',
            icon: <History />,
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

    // Combine items based on user role
    let items = [...commonItems];
    
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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    window.location.href = '/login';
  };

  const handleNavigation = (path: string) => {
    if (path !== '#') {
      window.location.href = path;
      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  };

  const handleCareerPopupClose = () => {
    setShowCareerPopup(false);
    // Only set dismissal time, no session storage to allow showing on dashboard visits
    localStorage.setItem('jobCareerPopupLastDismissed', new Date().toISOString());
    console.log('🚫 [Job Portal] Career popup dismissed - will show again in 2 hours');
  };

  const handleTakeJobReadinessTest = () => {
    setShowCareerPopup(false);
    window.location.href = '/app/career-guidance';
  };

  // Recursive function to render navigation items with nested submenus
  const renderNavItems = (items: NavItem[], level: number = 0) => {
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

      return (
        <React.Fragment key={uniqueKey}>
          <ListItem 
            disablePadding 
            sx={{ 
              display: 'block',
              pl: level > 0 ? 2 : 0
            }}
          >
            <ListItemButton
              selected={isSelected || isChildSelected}
              onClick={() => hasChildren 
                ? handleToggleSubMenu(item.label) 
                : handleNavigation(item.path)
              }
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                ...(isSelected && {
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.2),
                  }
                })
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: isSelected || isChildSelected 
                  ? 'primary.main' 
                  : 'text.secondary'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{
                  fontWeight: isSelected || isChildSelected ? 'medium' : 'normal',
                  color: isSelected || isChildSelected ? 'primary.main' : 'text.primary'
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
            </ListItemButton>
          </ListItem>
          
          {/* Render children if any */}
          {hasChildren && (
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`
      }}>
        <Box 
          component={Link} 
          to="/app/dashboard"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: 'text.primary' 
          }}
        >
          <Work sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" noWrap component="div">
            Job Portal
          </Typography>
        </Box>
      </Toolbar>
      
      <Box sx={{ overflow: 'auto', flexGrow: 1, px: 1, py: 2 }}>
        <List>
          {renderNavItems(navigationItems)}
        </List>
      </Box>
      
      <Box sx={{ p: 2, borderTop: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}` }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(muiTheme.palette.primary.main, 0.1)
          }}
        >
          <Avatar
            alt={user?.firstName}
            src={user?.avatar}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {user?.firstName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${muiTheme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
            Excellence Coaching Hub - Job Portal
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleTheme}>
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Profile">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ p: 0, ml: 1 }}
              >
                <Avatar
                  alt={user?.firstName}
                  src={user?.avatar}
                  sx={{ 
                    width: 36, 
                    height: 36,
                    border: `2px solid ${muiTheme.palette.primary.main}`
                  }}
                >
                  {user?.firstName?.charAt(0)}
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
        <MenuItem onClick={() => window.location.href = '/app/profile'}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={() => window.location.href = '/app/applications'}>
          <ListItemIcon>
            <Work fontSize="small" />
          </ListItemIcon>
          My Applications
        </MenuItem>
        <MenuItem onClick={() => window.location.href = '/app/settings'}>
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

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
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
              borderRight: `1px solid ${muiTheme.palette.divider}`
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${muiTheme.palette.divider}`
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar />
        <Outlet key={location.key} />
      </Box>

      {/* Career Guidance Popup - Available for job seekers */}
      {user && !hasRole(UserRole.EMPLOYER) && (
        <CareerGuidancePopup
          open={showCareerPopup}
          onClose={handleCareerPopupClose}
          onTakeJobReadinessTest={handleTakeJobReadinessTest}
          userFirstName={user?.firstName}
        />
      )}
    </Box>
  );
};

export default MainLayout;