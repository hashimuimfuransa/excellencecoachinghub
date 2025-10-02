import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Chip
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
  Logout
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Footer from './Footer';

const PublicLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreAnchorEl, setExploreAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 250, height: '100%', bgcolor: 'background.paper' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Excellence Hub
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        {isAuthenticated ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleNavigation('/')}
            sx={{ mb: 1 }}
          >
            Go to Dashboard
          </Button>
        ) : (
          <>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNavigation('/login')}
              sx={{ mb: 1 }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleNavigation('/register')}
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
      {/* Ultra Modern Sticky Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(30px)',
          borderBottom: '1px solid',
          borderColor: 'rgba(59, 130, 246, 0.1)',
          color: 'text.primary',
          boxShadow: '0 4px 32px rgba(59, 130, 246, 0.12)',
          zIndex: 1300,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 51, 234, 0.02) 50%, rgba(236, 72, 153, 0.02) 100%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Toolbar sx={{ 
            px: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
            py: { xs: 0.5, sm: 1, md: 1.5 },
            minHeight: { xs: 56, sm: 64, md: 72, lg: 80 },
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexWrap: { xs: 'nowrap', sm: 'nowrap' }
          }}>
            {/* Enhanced Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  p: { xs: 0.5, sm: 0.75, md: 1 },
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <img
                  src="/logo.webp"
                  alt="Excellence Hub Logo"
                  style={{ 
                    height: '24px', 
                    width: 'auto',
                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))'
                  }}
                />
              </Box>
            </Box>

            {/* Enhanced Desktop Navigation */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                flexGrow: 1,
                justifyContent: 'center',
                gap: { md: 0.25, lg: 0.5 },
                mx: { md: 1, lg: 2 }
              }}
            >
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    borderRadius: 3,
                    px: { md: 2, lg: 2.5, xl: 3 },
                    py: { md: 1, lg: 1.2, xl: 1.5 },
                    fontSize: { md: '0.85rem', lg: '0.9rem', xl: '0.95rem' },
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
                      transition: 'left 0.5s ease'
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                      '&::before': {
                        left: '100%'
                      }
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Enhanced Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                flexShrink: 0,
                minWidth: { sm: 200, md: 250, lg: 300, xl: 350 },
                maxWidth: { sm: 250, md: 300, lg: 350, xl: 400 },
                mx: { sm: 0.5, md: 1 }
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
                      <Search sx={{ 
                        color: 'text.secondary',
                        transition: 'color 0.3s ease'
                      }} />
                    </InputAdornment>
                  ),
                  sx: {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      },
                    },
                    '& .MuiInputBase-input': {
                      '&::placeholder': {
                        color: 'text.secondary',
                        opacity: 0.8
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Enhanced Explore Categories Button */}
            <Button
              variant="text"
              color="inherit"
              startIcon={<Explore />}
              endIcon={<ExpandMore />}
              onClick={handleExploreClick}
              sx={{
                textTransform: 'none',
                fontSize: { sm: '0.8rem', md: '0.85rem', lg: '0.9rem' },
                fontWeight: 600,
                borderRadius: 3,
                px: { sm: 1.5, md: 2 },
                py: { sm: 1, md: 1.2 },
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                color: 'text.primary',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                mx: { sm: 0.25, md: 0.5 },
                display: { xs: 'none', sm: 'flex' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                  '&::before': {
                    opacity: 1
                  }
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Explore
            </Button>

            {/* Enhanced Desktop Auth Buttons */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              gap: { sm: 1, md: 1.5 }, 
              alignItems: 'center',
              flexShrink: 0
            }}>
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 600,
                      fontSize: { sm: '0.8rem', md: '0.85rem', lg: '0.9rem' },
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Welcome, {user?.firstName}
                  </Typography>
                  <IconButton
                    onClick={handleProfileClick}
                    sx={{
                      p: 0.5,
                      borderRadius: 3,
                      border: '2px solid rgba(59, 130, 246, 0.2)',
                      '&:hover': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                        transform: 'scale(1.05)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        fontSize: '0.9rem',
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
                    variant="outlined"
                    startIcon={<Login />}
                    onClick={() => navigate('/login')}
                    sx={{ 
                      px: { sm: 2, md: 2.5 },
                      py: { sm: 1, md: 1.2 },
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: { sm: '0.75rem', md: '0.8rem', lg: '0.85rem' },
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'rgba(59, 130, 246, 0.6)',
                        background: 'rgba(59, 130, 246, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => navigate('/register')}
                    sx={{ 
                      px: { sm: 2.5, md: 3 },
                      py: { sm: 1, md: 1.2 },
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: { sm: '0.75rem', md: '0.8rem', lg: '0.85rem' },
                      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </Box>

            {/* Enhanced Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { sm: 'none' },
                p: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                flexShrink: 0,
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Enhanced Mobile Drawer */}
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
            width: { xs: 260, sm: 280 },
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
          }
        }}
      >
        {drawer}
      </Drawer>

      {/* Enhanced Explore Categories Popover */}
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
            minWidth: 450,
            maxWidth: 650,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 1, 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Explore Learning Categories
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
              Choose a category to discover courses that match your interests
            </Typography>
          </Box>
          
          <Grid container spacing={2.5}>
            {courseCategories.map((category, index) => (
              <Grid item xs={6} sm={4} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={category.icon}
                  onClick={() => handleCategoryClick(category.name)}
                  sx={{
                    p: 2.5,
                    height: 'auto',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    borderColor: `${category.color}30`,
                    color: category.color,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${category.color}08 0%, ${category.color}05 100%)`,
                    borderWidth: 2,
                    '&:hover': {
                      backgroundColor: `${category.color}15`,
                      borderColor: category.color,
                      transform: 'translateY(-3px)',
                      boxShadow: `0 6px 20px ${category.color}25`,
                      borderWidth: 2
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box
                      sx={{
                        fontSize: '1.5rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    >
                      {category.icon}
                    </Box>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      lineHeight: 1.3,
                      fontSize: '0.9rem'
                    }}
                  >
                    {category.name}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: '1px solid rgba(59, 130, 246, 0.1)',
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 51, 234, 0.02) 100%)',
            borderRadius: 2,
            p: 2
          }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleExploreClose();
                navigate('/courses');
              }}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                borderRadius: 3,
                fontWeight: 600,
                fontSize: '1rem',
                py: 1.5,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 7, sm: 8, md: 9, lg: 10 } }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default PublicLayout;
