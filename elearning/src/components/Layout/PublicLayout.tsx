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
  DarkMode
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

  const handleCategoryClick = (category: string) => {
    handleExploreClose();
    navigate(`/courses?category=${encodeURIComponent(category)}`);
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

  // Modern Clean Mobile drawer content
  const drawer = (
    <Box 
      sx={{ 
        width: 280, 
        height: '100%', 
        bgcolor: '#ffffff',
        position: 'relative'
      }}
    >
      {/* Clean Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              overflow: 'hidden'
            }}
          >
            <img
              src="/logo.webp"
              alt="Excellence Hub"
              style={{ 
                height: '100%', 
                width: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#0f172a',
                lineHeight: 1.2
              }}
            >
              Excellence Hub
            </Typography>
            <Typography 
              variant="caption"
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 500,
                color: '#64748b',
                letterSpacing: '0.05em'
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
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            '&:hover': {
              bgcolor: 'rgba(59, 130, 246, 0.06)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: '#3b82f6'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <CloseIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Box>
      
      {/* Navigation Links */}
      <Box sx={{ p: 2 }}>
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
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#3b82f6' : '#64748b',
                bgcolor: isActive ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                borderRadius: 2,
                py: 1.5,
                px: 3,
                mb: 1,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)',
                  color: '#3b82f6'
                }
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>
      
      {/* Auth Section */}
      <Box sx={{ p: 3, mt: 'auto', borderTop: '1px solid #f1f5f9' }}>
        {isAuthenticated ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleNavigation('/dashboard')}
            startIcon={<Dashboard />}
            sx={{ 
              bgcolor: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
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
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                color: '#64748b',
                py: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.06)',
                  color: '#3b82f6'
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
                bgcolor: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
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
      {/* Ultra-Modern Minimalistic Navigation Bar */}
      <Fade in={true}>
        <AppBar
          position="fixed"
          elevation={scrolled ? 4 : 0}
          sx={{
            background: scrolled 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: scrolled 
              ? '1px solid rgba(59, 130, 246, 0.12)' 
              : '1px solid transparent',
            color: '#0f172a',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: scrolled 
              ? '0 4px 20px rgba(59, 130, 246, 0.08)' 
              : 'none',
            zIndex: 1300
          }}
        >
        <Container maxWidth="xl">
          <Toolbar sx={{ 
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1.5, sm: 2 },
            minHeight: { xs: 70, sm: 80 },
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            {/* Modern Minimalistic Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                gap: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)'
                }
              }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  overflow: 'hidden'
                }}
              >
                <img
                  src="/logo.webp"
                  alt="Excellence Hub"
                  style={{ 
                    height: '100%', 
                    width: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: '#0f172a',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2
                  }}
                >
                  Excellence Hub
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em'
                  }}
                >
                  AI-POWERED LEARNING
                </Typography>
              </Box>
            </Box>

            {/* Clean Minimalistic Navigation */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                flexGrow: 1,
                justifyContent: 'center',
                gap: 1,
                mx: 4
              }}
            >
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? '#3b82f6' : '#64748b',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      position: 'relative',
                      minWidth: 'auto',
                      background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.06)',
                        color: '#3b82f6',
                        transform: 'translateY(-1px)',
                      },
                      '&::after': isActive ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        width: '60%',
                        height: 2,
                        bgcolor: '#3b82f6',
                        borderRadius: 1,
                        transform: 'translateX(-50%)'
                      } : {}
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            {/* Modern Clean Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                flexShrink: 0,
                width: { sm: 200, md: 240 },
                mr: 2
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
                        color: '#9ca3af',
                        fontSize: '1.1rem'
                      }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    fontSize: '0.9rem',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.3)',
                        borderWidth: 1
                      },
                      '&:hover': {
                        bgcolor: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(59, 130, 246, 0.4)'
                        }
                      },
                      '&.Mui-focused': {
                        bgcolor: '#ffffff',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                        '& fieldset': {
                          borderColor: '#3b82f6',
                          borderWidth: 1
                        }
                      }
                    },
                    '& input': {
                      color: '#374151',
                      fontSize: '0.9rem',
                      '&::placeholder': {
                        color: '#9ca3af',
                        opacity: 1
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Clean Explore Button */}
            <Button
              variant="outlined"
              startIcon={<Explore sx={{ fontSize: '1rem' }} />}
              endIcon={<ExpandMore sx={{ fontSize: '0.9rem' }} />}
              onClick={handleExploreClick}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                borderColor: 'rgba(156, 163, 175, 0.3)',
                color: '#64748b',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                mr: 2,
                bgcolor: 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(59, 130, 246, 0.06)',
                  color: '#3b82f6',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Categories
            </Button>

            {/* Clean Modern Auth Section */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              gap: 1.5, 
              alignItems: 'center'
            }}>
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    size="small"
                    sx={{
                      color: '#64748b',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.06)',
                        color: '#3b82f6'
                      }
                    }}
                  >
                    <Badge badgeContent={3} color="error" variant="dot">
                      <Notifications sx={{ fontSize: 20 }} />
                    </Badge>
                  </IconButton>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#64748b',
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}
                  >
                    Hi, {user?.firstName}
                  </Typography>
                  
                  <IconButton
                    onClick={handleProfileClick}
                    sx={{
                      p: 0,
                      border: '2px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        fontSize: '0.8rem',
                        fontWeight: 600
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
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      color: '#64748b',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.06)',
                        color: '#3b82f6'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/register')}
                    startIcon={<RocketLaunch sx={{ fontSize: '1rem' }} />}
                    sx={{ 
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </Box>

            {/* Modern Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { sm: 'none' },
                p: 1,
                borderRadius: 2,
                border: '1px solid rgba(156, 163, 175, 0.2)',
                bgcolor: '#f8fafc',
                color: '#374151',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.06)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6'
                }
              }}
            >
              <MenuIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Toolbar>
        </Container>
        </AppBar>
      </Fade>

      {/* Modern Mobile Drawer */}
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
            width: 280,
            bgcolor: '#ffffff',
            boxShadow: '0 25px 50px rgba(59, 130, 246, 0.1)',
            borderLeft: '1px solid #f1f5f9'
          }
        }}
      >
        {drawer}
      </Drawer>

      {/* Ultra-Modern Explore Categories Popover */}
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
            maxWidth: 480,
            borderRadius: 3,
            bgcolor: '#ffffff',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 4 }}>
          {/* Clean Minimal Header */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1, 
                fontWeight: 600, 
                color: '#0f172a',
                fontSize: '1.1rem'
              }}
            >
              Browse Categories
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748b', 
                fontSize: '0.9rem'
              }}
            >
              Explore courses organized by topic
            </Typography>
          </Box>
          
          {/* Clean Minimal Category Grid */}
          <Grid container spacing={2}>
            {courseCategories.map((category, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => handleCategoryClick(category.name)}
                  sx={{
                    p: 2.5,
                    height: 'auto',
                    minHeight: 80,
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    color: '#374151',
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.06)',
                      borderColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        color: category.color,
                        fontSize: '1.3rem'
                      }}
                    >
                      {category.icon}
                    </Box>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      lineHeight: 1.2,
                      fontSize: '0.85rem'
                    }}
                  >
                    {category.name}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {/* Clean CTA Section */}
          <Box sx={{ 
            mt: 4, 
            pt: 4, 
            borderTop: '1px solid #e2e8f0'
          }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<MenuBook sx={{ fontSize: '1rem' }} />}
              onClick={() => {
                handleExploreClose();
                navigate('/courses');
              }}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 1.5,
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }
              }}
            >
              View All Courses
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
          pt: { xs: 9, sm: 10 }, // Account for fixed navbar height
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
