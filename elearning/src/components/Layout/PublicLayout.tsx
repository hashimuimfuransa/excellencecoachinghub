import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Container,
  TextField,
  InputAdornment,
  Popover,
  Grid,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Badge,
  Fade
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Login,
  PersonAdd,
  Search,
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
  AccountCircle,
  Dashboard,
  Logout,
  MenuBook,
  AutoAwesome,
  RocketLaunch,
  Notifications,
  LightMode,
  DarkMode,
  Description,
  Assessment,
  TrendingUp,
  WorkspacePremium
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Footer from './Footer';

const PublicLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreAnchorEl, setExploreAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'Past Papers', path: '/past-papers' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Explore categories handlers
  const handleExploreClick = (event: React.MouseEvent<HTMLElement>) => {
    setExploreAnchorEl(event.currentTarget);
  };

  const handleExploreClose = () => {
    setExploreAnchorEl(null);
  };

  const handleCategoryClick = (category: string, path?: string) => {
    handleExploreClose();
    if (path) {
      navigate(path);
    } else {
      navigate(`/courses?category=${encodeURIComponent(category)}`);
    }
  };

  // Profile menu handlers
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileClose();
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
      description: 'Leadership, Executive, Project Management, CPA/CAT/ACCA',
      badge: '⭐ Popular',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    { 
      name: 'Business & Entrepreneurship', 
      icon: <TrendingUp />, 
      color: '#4facfe',
      description: 'Startup, Strategy, Finance, Marketing, Innovation',
      badge: '⭐ Popular',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    { 
      name: 'Academic Coaching', 
      icon: <MenuBook />, 
      color: '#a8edea',
      description: 'Primary, Secondary, University, Nursery, Exams, Research',
      badge: 'All levels',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    { 
      name: 'Language Coaching', 
      icon: <Language />, 
      color: '#fa709a',
      description: 'English, French, Kinyarwanda, Business Communication',
      badge: 'Fluency',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    { 
      name: 'Technical & Digital', 
      icon: <Computer />, 
      color: '#43e97b',
      description: 'AI, Data, Cybersecurity, Cloud, Dev, Digital Marketing',
      badge: 'In-demand',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    { 
      name: 'Job Seeker Coaching', 
      icon: <WorkspacePremium />, 
      color: '#ff9966',
      description: 'Career choice, skills, exams, interview, resume',
      badge: 'Career-ready',
      gradient: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)'
    },
    { 
      name: 'Personal & Corporate Development', 
      icon: <AutoAwesome />, 
      color: '#9c27b0',
      description: 'Soft skills, Team building, Communication, Leadership',
      badge: 'Growth',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)'
    },
    { 
      name: 'Past Papers & Exams', 
      icon: <Assessment />, 
      color: '#e91e63', 
      path: '/past-papers',
      description: 'Practice tests, Exam preparation, Past papers',
      badge: 'Practice',
      gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)'
    }
  ];

  // Ultra-Modern Attractive Mobile drawer content
  const drawer = (
    <Box 
      sx={{ 
        width: 320, 
        height: '100%', 
        position: 'relative',
        color: '#ffffff'
      }}
    >
      {/* Ultra-Modern Attractive Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              overflow: 'hidden',
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <img
              src="/logo.webp"
              alt="Excellence Hub"
              style={{ 
                height: '80%', 
                width: '80%',
                objectFit: 'contain',
                filter: 'brightness(1.2) contrast(1.1)'
              }}
            />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#ffffff',
                lineHeight: 1.2,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Excellence Hub
            </Typography>
            <Typography 
              variant="caption"
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
              }}
            >
              AI-POWERED LEARNING
            </Typography>
          </Box>
        </Box>
        
        <IconButton 
          onClick={handleDrawerToggle}
          size="small"
          sx={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              color: '#ffffff',
              transform: 'scale(1.1)',
              boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <CloseIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Box>
      
      {/* Ultra-Modern Attractive Navigation Links */}
      <Box sx={{ p: 3 }}>
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.label}
              fullWidth
              onClick={() => handleNavigation(item.path)}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)' 
                  : 'transparent',
                border: isActive 
                  ? '1px solid rgba(255, 255, 255, 0.3)' 
                  : '1px solid transparent',
                borderRadius: 3,
                py: 1.8,
                px: 3,
                mb: 1.5,
                fontSize: '0.95rem',
                backdropFilter: isActive ? 'blur(10px)' : 'none',
                boxShadow: isActive 
                  ? '0 4px 15px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                  : 'none',
                textShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)' 
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  transform: 'translateX(8px) scale(1.02)',
                  boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(15px)'
                }
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>
      
      {/* Ultra-Modern Attractive Auth Section */}
      <Box sx={{ 
        p: 3, 
        mt: 'auto', 
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        {isAuthenticated ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleNavigation('/dashboard')}
            startIcon={<Dashboard />}
            sx={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              color: '#6366f1',
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              py: 1.8,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
                color: '#4f46e5',
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: '0 8px 25px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            Go to Dashboard
          </Button>
        ) : (
          <>
            <Button
              fullWidth
              variant="text"
              onClick={() => handleNavigation('/login')}
              sx={{ 
                mb: 2,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                py: 1.8,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleNavigation('/register')}
              startIcon={<RocketLaunch />}
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                color: '#6366f1',
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.8,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
                  color: '#4f46e5',
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 8px 25px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              Get Started
            </Button>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Ultra-Modern Attractive Navigation Bar */}
      <Fade in={true}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            background: scrolled 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(168, 85, 247, 0.95) 50%, rgba(236, 72, 153, 0.95) 100%)' 
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(168, 85, 247, 0.9) 50%, rgba(236, 72, 153, 0.9) 100%)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderBottom: scrolled 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff !important',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: scrolled 
              ? '0 8px 32px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
              : '0 4px 20px rgba(99, 102, 241, 0.2)',
            zIndex: 1300,
            '& *': {
              color: 'inherit !important'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
              pointerEvents: 'none'
            },
            '@keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }}
        >
        <Container maxWidth="xl">
          <Toolbar sx={{ 
            px: { xs: 2, sm: 3, md: 3 },
            py: { xs: 1, sm: 1.2 },
            minHeight: { xs: 60, sm: 65 },
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            {/* Ultra-Modern Attractive Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                gap: 2,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.02)',
                  '& .logo-glow': {
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.4), 0 0 60px rgba(99, 102, 241, 0.3)'
                  },
                  '& .logo-text': {
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.8)'
                  }
                }
              }}
              onClick={() => navigate('/')}
            >
              <Box
                className="logo-glow"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  overflow: 'hidden',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 10px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative'
                }}
              >
                <img
                  src="/logo.webp"
                  alt="Excellence Hub"
                  style={{ 
                    height: '80%', 
                    width: '80%',
                    objectFit: 'contain',
                    filter: 'brightness(1.2) contrast(1.1)'
                  }}
                />
              </Box>
              
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  className="logo-text"
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#ffffff !important',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Excellence Hub
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    display: 'block',
                    mt: 0.2
                  }}
                >
                  AI-POWERED LEARNING
                </Typography>
              </Box>
            </Box>

            {/* Compact Modern Navigation */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                flexGrow: 1,
                justifyContent: 'center',
                gap: 0.5,
                mx: 3
              }}
            >
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? '#ffffff !important' : 'rgba(255, 255, 255, 0.85) !important',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      position: 'relative',
                      minWidth: 'auto',
                      background: isActive 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'transparent',
                      border: isActive 
                        ? '1px solid rgba(255, 255, 255, 0.3)' 
                        : '1px solid transparent',
                      backdropFilter: isActive ? 'blur(8px)' : 'none',
                      boxShadow: isActive 
                        ? '0 2px 8px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                        : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      textShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none',
                      '&:hover': {
                        background: isActive 
                          ? 'rgba(255, 255, 255, 0.25)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        color: '#ffffff',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)'
                      },
                      '&::after': isActive ? {
                        content: '""',
                        position: 'absolute',
                        bottom: -1,
                        left: '50%',
                        width: '60%',
                        height: 2,
                        background: '#ffffff',
                        borderRadius: 1,
                        transform: 'translateX(-50%)',
                        boxShadow: '0 1px 4px rgba(255, 255, 255, 0.3)'
                      } : {}
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            {/* Compact Modern Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                flexShrink: 0,
                width: { sm: 180, md: 200 },
                mr: 1.5,
                position: 'relative'
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease'
                      }} />
                    </InputAdornment>
                  ),
                  sx: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    fontSize: '0.8rem',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        border: 'none'
                      },
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                          color: 'rgba(255, 255, 255, 0.9) !important',
                          transform: 'scale(1.05)'
                        }
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.1)',
                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                          color: '#ffffff',
                          transform: 'scale(1.1)'
                        }
                      }
                    },
                    '& input': {
                      color: '#ffffff !important',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.7) !important',
                        opacity: 1,
                        fontWeight: 400
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Compact Modern Explore Button */}
            <Button
              variant="outlined"
              startIcon={<Explore sx={{ fontSize: '0.9rem' }} />}
              endIcon={<ExpandMore sx={{ fontSize: '0.8rem' }} />}
              onClick={handleExploreClick}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.9) !important',
                borderRadius: 2,
                px: 2,
                py: 0.8,
                mr: 1.5,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              Categories
            </Button>

            {/* Compact Modern Auth Section */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              gap: 1, 
              alignItems: 'center'
            }}>
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    size="small"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        transform: 'scale(1.05)',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  >
                    <Badge badgeContent={3} color="error" variant="dot">
                      <Notifications sx={{ fontSize: 18 }} />
                    </Badge>
                  </IconButton>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9) !important',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    Hi, {user?.firstName}
                  </Typography>
                  
                  <IconButton
                    onClick={handleProfileClick}
                    sx={{
                      p: 0,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        background: 'rgba(255, 255, 255, 0.15)',
                        transform: 'scale(1.05)',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: '#6366f1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </Avatar>
                  </IconButton>
                </Box>
              ) : (
                <>
                  <Button
                    variant="text"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      px: 2,
                      py: 0.8,
                      borderRadius: 2,
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      color: 'rgba(255, 255, 255, 0.9) !important',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/register')}
                    startIcon={<RocketLaunch sx={{ fontSize: '0.9rem' }} />}
                    sx={{ 
                      px: 2,
                      py: 0.8,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#6366f1',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: '#ffffff',
                        color: '#4f46e5',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </Box>

            {/* Compact Modern Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { sm: 'none' },
                p: 1,
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <MenuIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Toolbar>
        </Container>
        </AppBar>
      </Fade>

      {/* Ultra-Modern Attractive Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 320,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(168, 85, 247, 0.95) 50%, rgba(236, 72, 153, 0.95) 100%)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            boxShadow: '0 25px 50px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
              pointerEvents: 'none'
            }
          }
        }}
      >
        {drawer}
      </Drawer>

      {/* Ultra-Modern Professional Categories Popover */}
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
            minWidth: 520,
            maxWidth: 600,
            borderRadius: 4,
            bgcolor: '#ffffff',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)'
          }
        }}
      >
        <Box sx={{ p: 4 }}>
          {/* Professional Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 1, 
                fontWeight: 700, 
                color: '#0f172a',
                fontSize: '1.3rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Learning Categories
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748b', 
                fontSize: '0.95rem',
                fontWeight: 500
              }}
            >
              Discover courses tailored to your professional goals
            </Typography>
          </Box>
          
          {/* Professional Category Grid */}
          <Grid container spacing={2}>
            {courseCategories.map((category, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => handleCategoryClick(category.name, category.path)}
                  sx={{
                    p: 3,
                    height: 'auto',
                    minHeight: 120,
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: '#374151',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderColor: category.color,
                      color: category.color,
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: `0 12px 40px ${category.color}20, 0 0 0 1px ${category.color}30`,
                      '& .category-icon': {
                        transform: 'scale(1.2) rotate(5deg)',
                        color: category.color
                      },
                      '& .category-badge': {
                        background: category.gradient,
                        color: '#ffffff',
                        transform: 'scale(1.1)'
                      }
                    }
                  }}
                >
                  {/* Gradient Background */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: category.gradient,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      '&:hover': {
                        opacity: 0.05
                      }
                    }}
                  />
                  
                  {/* Icon */}
                  <Box sx={{ mb: 2, position: 'relative', zIndex: 2 }}>
                    <Box
                      className="category-icon"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: `${category.color}15`,
                        color: category.color,
                        fontSize: '1.5rem',
                        border: `2px solid ${category.color}20`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 4px 20px ${category.color}20`
                      }}
                    >
                      {category.icon}
                    </Box>
                  </Box>
                  
                  {/* Content */}
                  <Box sx={{ position: 'relative', zIndex: 2, width: '100%' }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        lineHeight: 1.3,
                        fontSize: '0.9rem',
                        mb: 1,
                        color: 'inherit'
                      }}
                    >
                      {category.name}
                    </Typography>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        display: 'block',
                        mb: 1.5
                      }}
                    >
                      {category.description}
                    </Typography>
                    
                    <Chip
                      className="category-badge"
                      label={category.badge}
                      size="small"
                      sx={{
                        background: `${category.color}15`,
                        color: category.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        border: `1px solid ${category.color}30`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {/* Professional CTA Section */}
          <Box sx={{ 
            mt: 4, 
            pt: 4, 
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            textAlign: 'center'
          }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<MenuBook sx={{ fontSize: '1.1rem' }} />}
              onClick={() => {
                handleExploreClose();
                navigate('/courses');
              }}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '1rem',
                py: 2,
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Explore All Courses
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Enhanced Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 8px 32px rgba(59, 130, 246, 0.15))',
            mt: 1.5,
            borderRadius: 3,
            minWidth: 220,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
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
        <MenuItem 
          onClick={() => { handleProfileClose(); navigate('/dashboard'); }}
          sx={{
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Dashboard fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Dashboard
          </Typography>
        </MenuItem>
       <MenuItem 
         onClick={() => { 
           handleProfileClose(); 
           // Open profile modal directly
           window.dispatchEvent(new CustomEvent('openProfileModal'));
         }}
         sx={{
           borderRadius: 2,
           mx: 1,
           my: 0.5,
           '&:hover': {
             background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
             transform: 'translateX(4px)'
           },
           transition: 'all 0.2s ease'
         }}
       >
         <AccountCircle fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
         <Typography variant="body2" sx={{ fontWeight: 500 }}>
           Profile
         </Typography>
       </MenuItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(59, 130, 246, 0.1)' }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Logout fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Logout
          </Typography>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: { xs: 7.5, sm: 8 }, // Account for reduced navbar height
          minHeight: '100vh'
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default PublicLayout;
