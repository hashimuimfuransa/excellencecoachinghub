import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  ListItemIcon as ListItemIconMui,
  ListItemText as ListItemTextMui,
  Tooltip
} from '@mui/material';
import { SafeSlideUp } from '../utils/transitionFix';
import {
  Menu as MenuIcon,
  Work,
  School,
  Person,
  Login,
  PersonAdd,
  Home,
  Business,
  Support,
  Brightness4,
  Brightness7,
  Close,
  AdminPanelSettings,
  TrendingUp,
  Group,
  Public,
  Psychology,
  Search,
  ContactSupport,
  Phone,
  Email,
  WhatsApp,
  Facebook,
  Instagram,
  LinkedIn,
  YouTube,
  VideoLibrary,
  Schedule,
  LocationOn,
  Twitter,
  PostAdd
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { UserRole } from '../types/user';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      navigate('/login', { replace: true });
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSearch = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleContactOpen = () => {
    setContactDialogOpen(true);
    setMobileOpen(false); // Close mobile drawer if open
  };

  const handleContactClose = () => {
    setContactDialogOpen(false);
  };

  const menuItems = [
    // Protected items - only show if user is logged in (Network is the main page for logged users)
    { text: 'Network', icon: <Public />, path: '/app/network', protected: true, isHome: true },
    { text: 'Jobs', icon: <Work />, path: '/app/jobs', protected: true },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ];

  // Separate menu items for logged-in employers
  const employerMenuItems = [
    // Protected items - only show if user is logged in (Network is the main page for logged users)
    { text: 'Network', icon: <Public />, path: '/app/network', protected: true, isHome: true },
    { text: 'My Jobs', icon: <Business />, path: '/app/employer/jobs', protected: true },
    { text: 'Post Job', icon: <PostAdd />, path: '/app/jobs/create', highlight: true, protected: true },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ];

  // For non-logged in users, show public menu
  const publicMenuItems = [
    { text: 'All Jobs', icon: <Work />, path: '/' },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ];

  // Choose which menu to show based on user authentication and role
  const currentMenuItems = user 
    ? (user.role === UserRole.EMPLOYER ? employerMenuItems : menuItems)
    : publicMenuItems;

  const drawer = (
    <Box sx={{ width: { xs: 280, sm: 320 } }}>
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img 
            src="/exjobnetlogo.png" 
            alt="ExJobNet" 
            style={{ height: 40, width: 'auto' }}
          />
          <Typography variant="h6" fontWeight="bold">
            ExJobNet
          </Typography>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {currentMenuItems.filter(item => !item.protected || user).map((item) => (
          <ListItem
            component="button"
            key={item.text}
            onClick={() => {
              if (item.isContactDialog) {
                item.action();
              } else if (item.requiresAuth && !user) {
                navigate('/register?role=employer');
                setMobileOpen(false);
              } else {
                navigate(item.path);
                setMobileOpen(false);
              }
            }}
            sx={{
              backgroundColor: item.highlight 
                ? alpha(theme.palette.primary.main, 0.9)
                : (location.pathname === item.path ? 'primary.light' : 'transparent'),
              '&:hover': {
                backgroundColor: item.highlight 
                  ? alpha(theme.palette.primary.main, 1)
                  : 'primary.light',
              },
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              border: item.highlight ? `2px solid ${theme.palette.primary.main}` : 'none',
              boxShadow: item.highlight ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
            }}
          >
            <ListItemIcon sx={{ 
              color: item.highlight 
                ? 'white' 
                : (location.pathname === item.path ? 'primary.main' : 'inherit') 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                '& .MuiListItemText-primary': { 
                  fontWeight: (item.highlight || location.pathname === item.path) ? 'bold' : 'normal',
                  color: item.highlight 
                    ? 'white' 
                    : (location.pathname === item.path ? 'primary.main' : 'inherit')
                } 
              }}
            />
          </ListItem>
          
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ px: 2 }}>
        <FormControlLabel
          control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              Dark Mode
            </Box>
          }
        />
      </Box>
      {!user && (
        <Box sx={{ p: 2, mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Login />}
            onClick={() => {
              navigate('/login');
              setMobileOpen(false);
            }}
            sx={{ mb: 1 }}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => {
              navigate('/register');
              setMobileOpen(false);
            }}
          >
            Sign Up
          </Button>
        </Box>
      )}
    </Box>
  );

  // Contact methods data
  const contactMethods = [
    {
      icon: <Phone sx={{ color: '#4caf50' }} />,
      title: 'Call Us',
      description: '+250 0788535156',
      action: () => window.open('tel:+0788535156', '_self'),
    },
    {
      icon: <WhatsApp sx={{ color: '#25d366' }} />,
      title: 'WhatsApp',
      description: 'Chat with us instantly',
      action: () => window.open('https://wa.me/0788535156?text=Hello%20ExJobNet', '_blank'),
    },
    {
      icon: <Email sx={{ color: '#1976d2' }} />,
      title: 'Email',
      description: 'info@excellencecoachinghub.com',
      action: () => window.open('mailto:info@excellencecoachinghub.com', '_self'),
    },
  ];

  const socialMedia = [
    {
      icon: <Facebook sx={{ color: '#1877f2' }} />,
      title: 'Facebook',
      profileName: '@excellencecoachinghub',
      action: () => window.open('https://facebook.com/excellencecoachinghub', '_blank'),
    },
    {
      icon: <Instagram sx={{ color: '#e4405f' }} />,
      title: 'Instagram',
      profileName: '@excellencecoachinghub',
      action: () => window.open('https://www.instagram.com/excellencecoachinghub/?utm_source=qr&igsh=Ym5xMXh5aXZmNHVi#', '_blank'),
    },
    {
      icon: <LinkedIn sx={{ color: '#0077b5' }} />,
      title: 'LinkedIn',
      profileName: 'ExJobNet',
      action: () => window.open('https://www.linkedin.com/in/excellence-coachinghub-1b8b1a380?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', '_blank'),
    },
    {
      icon: <Twitter sx={{ color: '#1DA1F2' }} />,
      title: 'Twitter',
      profileName: '@ECH_coachinghub',
      action: () => window.open('https://x.com/ECH_coachinghub?t=Awf4GVPp9eCkSZhDlHkFew&s=08', '_blank'),
    },
    {
      icon: <VideoLibrary sx={{ color: '#ff0050' }} />,
      title: 'TikTok',
      profileName: '@excellence.coachi4',
      action: () => window.open('https://www.tiktok.com/@excellence.coachi4?_t=ZM-8zCgEouFb8w&_r=1', '_blank'),
    },
  ];

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ 
          px: { xs: 1, sm: 1, md: 4 }, 
          minHeight: { xs: 60, sm: 48, md: 80 },
          py: { xs: 1, sm: 0.25, md: 2 }
        }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: { xs: 1, sm: 2 },
                p: { xs: 1, sm: 1.5 },
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isTablet ? 1 : 2,
              cursor: 'pointer'
            }}
            onClick={() => navigate(user ? '/app/network' : '/')}
          >
            <img 
              src="/exjobnetlogo.png" 
              alt="ExJobNet" 
              style={{ 
                height: isMobile ? 50 : isTablet ? 35 : 80, 
                width: 'auto',
                transition: 'height 0.3s ease'
              }}
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 0, 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
      
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {!isMobile && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isTablet ? 0.125 : 1, 
              mr: isTablet ? 0.5 : 3 
            }}>
              {currentMenuItems.filter(item => !('protected' in item) || !item.protected || user).map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={isTablet ? undefined : item.icon}
                  onClick={() => {
                    if (item.isContactDialog && 'action' in item) {
                      item.action();
                    } else if ('requiresAuth' in item && item.requiresAuth && !user) {
                      navigate('/register?role=employer');
                    } else if ('path' in item) {
                      navigate(item.path);
                    }
                  }}
                  variant={('highlight' in item && item.highlight) ? 'contained' : 'text'}
                  sx={{
                    fontWeight: ('path' in item && location.pathname === item.path) ? 'bold' : (('highlight' in item && item.highlight) ? 'bold' : 'normal'),
                    color: ('highlight' in item && item.highlight) ? 'white' : (('path' in item && location.pathname === item.path) ? 'primary.main' : 'text.primary'),
                    backgroundColor: ('highlight' in item && item.highlight)
                      ? 'primary.main' 
                      : (('path' in item && location.pathname === item.path) ? 'primary.light' : 'transparent'),
                    '&:hover': {
                      backgroundColor: ('highlight' in item && item.highlight)
                        ? 'primary.dark' 
                        : 'primary.light',
                      transform: ('highlight' in item && item.highlight) ? 'translateY(-1px)' : 'none',
                      boxShadow: ('highlight' in item && item.highlight) ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                    },
                    borderRadius: 1,
                    px: isTablet ? 0.75 : 2,
                    py: isTablet ? 0.125 : 1,
                    minWidth: isTablet ? 'auto' : undefined,
                    fontSize: isTablet ? '0.625rem' : '1rem',
                    height: isTablet ? 28 : 'auto',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {!isMobile && (location.pathname === '/jobs' || location.pathname === '/' || location.pathname === '/app') && (
            <Box sx={{ mx: isTablet ? 0.25 : 2 }}>
              <TextField
                size={isTablet ? 'small' : 'small'}
                placeholder={isTablet ? "Search..." : "Search jobs..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                sx={{
                  width: isTablet ? 120 : 300,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    borderRadius: 1,
                    fontSize: isTablet ? '0.625rem' : '1rem',
                    height: isTablet ? 28 : 'auto',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.background.paper,
                    }
                  },
                  '& .MuiInputBase-input': {
                    padding: isTablet ? '4px 6px' : undefined,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ 
                        color: 'text.secondary',
                        fontSize: isTablet ? '0.875rem' : '1.5rem'
                      }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {!isMobile && (
            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton 
                onClick={toggleTheme} 
                color="inherit" 
                sx={{ 
                  mr: isTablet ? 0.125 : 1,
                  p: isTablet ? 0.25 : 1.5,
                  width: isTablet ? 28 : 'auto',
                  height: isTablet ? 28 : 'auto',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {mode === 'dark' ? 
                  <Brightness7 sx={{ fontSize: isTablet ? '0.875rem' : '1.5rem' }} /> : 
                  <Brightness4 sx={{ fontSize: isTablet ? '0.875rem' : '1.5rem' }} />
                }
              </IconButton>
            </Tooltip>
          )}

          {/* Post Job Button for Employers */}
          {user && user.role === UserRole.EMPLOYER && !isMobile && (
            <Button
              variant="contained"
              startIcon={isTablet ? undefined : <PostAdd />}
              onClick={() => navigate('/app/jobs/create')}
              sx={{
                mr: isTablet ? 0.25 : 2,
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)',
                  boxShadow: '0 5px 15px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-1px)',
                },
                borderRadius: 1,
                px: isTablet ? 0.75 : 3,
                py: isTablet ? 0.125 : 1,
                fontSize: isTablet ? '0.625rem' : '1rem',
                minWidth: isTablet ? 'auto' : undefined,
                height: isTablet ? 28 : 'auto',
                transition: 'all 0.3s ease',
              }}
            >
              {isTablet ? 'Post' : 'Post Job'}
            </Button>
          )}

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: isTablet ? 24 : 32,
                    height: isTablet ? 24 : 32,
                    fontSize: isTablet ? '0.625rem' : '0.9rem'
                  }}
                >
                  {user.firstName?.charAt(0) || user.email?.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <MenuItem onClick={() => { navigate('/app/network'); handleClose(); }}>
                  <Home sx={{ mr: 1 }} />
                  Network Home
                </MenuItem>
                <MenuItem onClick={() => { navigate('/app/profile'); handleClose(); }}>
                  <Person sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                {user?.role === UserRole.EMPLOYER && (
                  <MenuItem 
                    onClick={() => { navigate('/app/jobs/create'); handleClose(); }}
                    sx={{ 
                      color: 'primary.main', 
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <PostAdd sx={{ mr: 1 }} />
                    Post a Job
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Login sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            !isMobile && (
              <Box sx={{ display: 'flex', gap: isTablet ? 0.125 : 1 }}>
                <Button
                  color="inherit"
                  startIcon={isTablet ? undefined : <Login />}
                  onClick={() => navigate('/login')}
                  sx={{ 
                    fontWeight: 'bold',
                    px: isTablet ? 0.75 : 2,
                    py: isTablet ? 0.125 : 1,
                    fontSize: isTablet ? '0.625rem' : '1rem',
                    minWidth: isTablet ? 'auto' : undefined,
                    height: isTablet ? 28 : 'auto',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  startIcon={isTablet ? undefined : <PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{ 
                    fontWeight: 'bold',
                    px: isTablet ? 0.75 : 2,
                    py: isTablet ? 0.125 : 1,
                    fontSize: isTablet ? '0.625rem' : '1rem',
                    minWidth: isTablet ? 'auto' : undefined,
                    height: isTablet ? 28 : 'auto',
                    borderRadius: 1,
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                    }
                  }}
                >
                  {isTablet ? 'Sign Up' : 'Sign Up'}
                </Button>
              </Box>
            )
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: { xs: 280, sm: 320 },
            borderRadius: '0 20px 20px 0',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Contact Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={handleContactClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
        TransitionComponent={SafeSlideUp}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #22c55e, #4ade80)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            py: 3,
          }}
        >
          <IconButton
            onClick={handleContactClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <Close />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            Get in Touch
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            We're here to help you succeed!
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Contact Methods */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Contact Methods
            </Typography>
            <List>
              {contactMethods.map((method, index) => (
                <ListItem
                  key={index}
                  onClick={method.action}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {method.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={method.title}
                    secondary={method.description}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          {/* Business Hours */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Business Hours
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Schedule color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Monday - Friday: 8:00 AM - 6:00 PM (CAT)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Saturday: 9:00 AM - 4:00 PM (CAT)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sunday: Closed
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Location */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Location
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Kigali, Rwanda
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serving clients across East Africa and globally
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Social Media */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {socialMedia.map((social, index) => (
                <Tooltip 
                  key={index} 
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {social.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {social.profileName}
                      </Typography>
                    </Box>
                  } 
                  arrow
                >
                  <Box
                    onClick={social.action}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <IconButton
                      sx={{
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        },
                        pointerEvents: 'none',
                      }}
                    >
                      {social.icon}
                    </IconButton>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem',
                        textAlign: 'center',
                        color: 'text.secondary',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {social.profileName}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleContactClose}
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(45deg, #22c55e, #4ade80)',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #16a34a, #22c55e)',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;