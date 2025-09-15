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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  ListItemIcon as ListItemIconMui,
  ListItemText as ListItemTextMui,
  Tooltip,
  Fade,
  Paper,
  MenuList,
  ClickAwayListener,
  Popper,
  Grow
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
  PostAdd,
  KeyboardArrowDown,
  WorkOutline,
  Psychology as InterviewIcon,
  Description as TenderIcon,
  CastForEducation as TrainingIcon,
  AccountBalance as FinanceIcon,
  Category as CategoryIcon
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
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const opportunitiesRef = React.useRef<HTMLButtonElement>(null);

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



  const handleContactOpen = () => {
    setContactDialogOpen(true);
    setMobileOpen(false); // Close mobile drawer if open
  };

  const handleContactClose = () => {
    setContactDialogOpen(false);
  };

  const handleOpportunitiesToggle = () => {
    setOpportunitiesOpen((prevOpen) => !prevOpen);
  };

  const handleOpportunitiesClose = (event?: Event | React.SyntheticEvent) => {
    if (
      opportunitiesRef.current &&
      opportunitiesRef.current.contains(event?.target as HTMLElement)
    ) {
      return;
    }
    setOpportunitiesOpen(false);
  };

  // Define opportunity categories with modern styling
  const opportunityCategories = [
    {
      id: 'internship',
      label: 'Internships',
      icon: <School sx={{ fontSize: 20 }} />,
      path: user ? '/app/jobs/all?categories=internships' : '/jobs?categories=internships',
      description: 'Student & graduate internships'
    },
    {
      id: 'tender',
      label: 'Tenders',
      icon: <TenderIcon sx={{ fontSize: 20 }} />,
      path: user ? '/app/jobs/all?categories=tenders' : '/jobs?categories=tenders',
      description: 'Government & business tenders'
    },
    {
      id: 'training',
      label: 'Training',
      icon: <TrainingIcon sx={{ fontSize: 20 }} />,
      path: user ? '/app/jobs/all?categories=trainings' : '/jobs?categories=trainings',
      description: 'Professional development'
    },
    {
      id: 'finance',
      label: 'Access to Finance',
      icon: <FinanceIcon sx={{ fontSize: 20 }} />,
      path: user ? '/app/jobs/all?categories=access_to_finance' : '/jobs?categories=access_to_finance',
      description: 'Funding & financial support'
    }
  ];

  const menuItems = [
    // Protected items - only show if user is logged in (Network is the main page for logged users)
    { text: 'Network', icon: <Public />, path: '/app/network', protected: true, isHome: true },
    { text: 'Jobs', icon: <Work />, path: '/app/jobs', protected: true },
    { text: 'Internships', icon: <School />, path: '/app/internships', protected: true },
    { text: 'Other Opportunities', icon: <CategoryIcon />, isDropdown: true, protected: true },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ];

  // Separate menu items for logged-in employers
  const employerMenuItems = [
    // Protected items - only show if user is logged in (Network is the main page for logged users)
    { text: 'Network', icon: <Public />, path: '/app/network', protected: true, isHome: true },
    { text: 'My Jobs', icon: <Business />, path: '/app/employer/jobs', protected: true },
    { text: 'My Internships', icon: <School />, path: '/app/employer/internships', protected: true },
    { text: 'Other Opportunities', icon: <CategoryIcon />, isDropdown: true, protected: true },
    { text: 'Post Job', icon: <PostAdd />, path: '/app/jobs/create', highlight: true, protected: true },
    { text: 'Post Internship', icon: <School />, path: '/app/internships/create', highlight: true, protected: true },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ];

  // For non-logged in users, show public menu
  const publicMenuItems = [
    { text: 'All Jobs', icon: <Work />, path: '/', special: true },
    { text: 'Internships', icon: <School />, path: '/internships' },
    { text: 'Other Opportunities', icon: <CategoryIcon />, isDropdown: true },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ];

  // Choose which menu to show based on user authentication and role
  const currentMenuItems = user 
    ? (user.role === UserRole.EMPLOYER ? employerMenuItems : menuItems)
    : publicMenuItems;

  const drawer = (
    <Box sx={{ width: { xs: 280, sm: 300, md: 320 } }}>
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
        {currentMenuItems.filter(item => !item.protected || user).map((item) => {
          // If it's the dropdown item, render the opportunities as sub-items
          if (item.isDropdown) {
            return (
              <React.Fragment key={item.text}>
                {/* Dropdown header */}
                <ListItem sx={{ px: 3, py: 1.5 }}>
                  <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        fontSize: '1rem'
                      } 
                    }}
                  />
                </ListItem>
                {/* Render opportunity categories as sub-items */}
                {opportunityCategories.map((opportunity) => (
                  <ListItem
                    component="button"
                    key={opportunity.id}
                    onClick={() => {
                      console.log('Navigating to:', opportunity.path);
                      window.location.href = opportunity.path;
                      setMobileOpen(false);
                    }}
                    sx={{
                      backgroundColor: location.pathname === opportunity.path 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                      mx: 3,
                      borderRadius: 3,
                      mb: 1,
                      pl: 5,
                      py: 1.5,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: location.pathname === opportunity.path ? 'primary.main' : 'inherit',
                      minWidth: 40
                    }}>
                      {opportunity.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={opportunity.label}
                      secondary={opportunity.description}
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontWeight: location.pathname === opportunity.path ? 'bold' : 'normal',
                          color: location.pathname === opportunity.path ? 'primary.main' : 'inherit',
                          fontSize: '0.95rem'
                        },
                        '& .MuiListItemText-secondary': {
                          fontSize: '0.8rem',
                          color: 'text.secondary',
                          mt: 0.5
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </React.Fragment>
            );
          }

          // Regular menu item
          return (
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
                  : ('special' in item && item.special)
                    ? alpha(theme.palette.primary.main, 0.05)
                    : (location.pathname === item.path ? alpha(theme.palette.primary.main, 0.1) : 'transparent'),
                '&:hover': {
                  backgroundColor: item.highlight 
                    ? alpha(theme.palette.primary.main, 1)
                    : ('special' in item && item.special)
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.08),
                },
                mx: 2,
                borderRadius: 3,
                mb: 1,
                py: 1.5,
                border: item.highlight 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : ('special' in item && item.special)
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    : 'none',
                boxShadow: item.highlight 
                  ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                  : ('special' in item && item.special)
                    ? '0 2px 8px rgba(76, 175, 80, 0.1)'
                    : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon sx={{ 
                color: item.highlight 
                  ? 'white' 
                  : ('special' in item && item.special)
                    ? 'primary.main'
                    : (location.pathname === item.path ? 'primary.main' : 'inherit') 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontWeight: (item.highlight || ('special' in item && item.special) || location.pathname === item.path) ? 'bold' : 'normal',
                    color: item.highlight 
                      ? 'white' 
                      : ('special' in item && item.special)
                        ? 'primary.main'
                        : (location.pathname === item.path ? 'primary.main' : 'inherit')
                  } 
                }}
              />
            </ListItem>
          );
        })}
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
          px: { xs: 2, md: 3, lg: 4 }, 
          minHeight: { xs: 64, md: 72, lg: 80 },
          py: { xs: 1, md: 1.5, lg: 2 },
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon sx={{ fontSize: '1.5rem' }} />
            </IconButton>
          )}
          
          {/* Left Section - Logo */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, md: 1.5, lg: 2 },
              cursor: 'pointer',
              minWidth: 'fit-content'
            }}
            onClick={() => navigate(user ? '/app/network' : '/')}
          >
            <img 
              src="/exjobnetlogo.png" 
              alt="ExJobNet" 
              style={{ 
                height: isMobile ? 40 
                  : isTablet ? 48 
                  : 56, 
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

          {/* Center Section - Navigation */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flex: 1,
            justifyContent: 'center',
          }}>
            {!isMobile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, md: 1.5, lg: 2 }
              }}>
              {currentMenuItems.filter(item => !('protected' in item) || !item.protected || user).map((item) => {
                // Handle dropdown menu item
                if (item.isDropdown) {
                  return (
                    <React.Fragment key={item.text}>
                      <Button
                        ref={opportunitiesRef}
                        color="inherit"
                        startIcon={isTablet ? undefined : item.icon}
                        endIcon={<KeyboardArrowDown sx={{ 
                          fontSize: 16, 
                          transform: opportunitiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }} />}
                        onClick={handleOpportunitiesToggle}
                        variant="text"
                        sx={{
                          fontWeight: 'bold',
                          color: opportunitiesOpen ? 'primary.main' : 'text.primary',
                          backgroundColor: opportunitiesOpen ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'translateY(-1px)',
                          },
                          borderRadius: 2,
                          px: { xs: 1.5, md: 2, lg: 2.5 },
                          py: { xs: 0.75, md: 1, lg: 1.25 },
                          minWidth: isTablet ? 'auto' : undefined,
                          fontSize: { xs: '0.85rem', md: '0.95rem', lg: '1rem' },
                          height: { xs: 36, md: 40, lg: 44 },
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:active': {
                            transform: 'scale(0.98)',
                          },
                        }}
                      >
                        {item.text}
                      </Button>
                      
                      {/* Dropdown menu */}
                      <Popper
                        open={opportunitiesOpen}
                        anchorEl={opportunitiesRef.current}
                        role={undefined}
                        placement="bottom-start"
                        transition
                        disablePortal
                        sx={{ zIndex: 1300 }}
                      >
                        {({ TransitionProps, placement }) => (
                          <Grow
                            {...TransitionProps}
                            style={{
                              transformOrigin: placement === 'bottom-start' ? 'left top' : 'left bottom',
                            }}
                          >
                            <Paper
                              sx={{
                                mt: 1,
                                borderRadius: 3,
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                minWidth: 280,
                                maxWidth: 320
                              }}
                            >
                              <ClickAwayListener onClickAway={handleOpportunitiesClose}>
                                <MenuList
                                  autoFocusItem={opportunitiesOpen}
                                  sx={{ py: 1 }}
                                >
                                  {opportunityCategories.map((opportunity) => (
                                    <MenuItem
                                      key={opportunity.id}
                                      onClick={() => {
                                        console.log('Desktop navigating to:', opportunity.path);
                                        window.location.href = opportunity.path;
                                        setOpportunitiesOpen(false);
                                      }}
                                      sx={{
                                        py: 1.5,
                                        px: 2,
                                        mx: 1,
                                        borderRadius: 2,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                          transform: 'translateX(4px)',
                                        },
                                        transition: 'all 0.2s ease',
                                        gap: 2,
                                        display: 'flex',
                                        alignItems: 'flex-start'
                                      }}
                                    >
                                      <Box sx={{ 
                                        color: 'primary.main',
                                        mt: 0.2,
                                        minWidth: 'auto'
                                      }}>
                                        {opportunity.icon}
                                      </Box>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography 
                                          variant="subtitle2" 
                                          sx={{ 
                                            fontWeight: 600, 
                                            color: 'text.primary',
                                            mb: 0.25 
                                          }}
                                        >
                                          {opportunity.label}
                                        </Typography>
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            color: 'text.secondary',
                                            lineHeight: 1.3,
                                            display: 'block'
                                          }}
                                        >
                                          {opportunity.description}
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </MenuList>
                              </ClickAwayListener>
                            </Paper>
                          </Grow>
                        )}
                      </Popper>
                    </React.Fragment>
                  );
                }

                // Regular menu item
                return (
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
                      fontWeight: ('path' in item && location.pathname === item.path) 
                        ? 'bold' 
                        : (('highlight' in item && item.highlight) || ('special' in item && item.special)) 
                          ? 'bold' 
                          : 'normal',
                      color: ('highlight' in item && item.highlight) 
                        ? 'white' 
                        : ('special' in item && item.special)
                          ? 'primary.main'
                          : (('path' in item && location.pathname === item.path) ? 'primary.main' : 'text.primary'),
                      backgroundColor: ('highlight' in item && item.highlight)
                        ? 'primary.main' 
                        : (('path' in item && location.pathname === item.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent'),
                      border: ('special' in item && item.special) 
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                        : 'none',
                      '&:hover': {
                        backgroundColor: ('highlight' in item && item.highlight)
                          ? 'primary.dark' 
                          : ('special' in item && item.special)
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.primary.main, 0.04),
                        transform: (('highlight' in item && item.highlight) || ('special' in item && item.special)) 
                          ? 'translateY(-1px)' 
                          : 'none',
                        boxShadow: ('highlight' in item && item.highlight) 
                          ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                          : ('special' in item && item.special)
                            ? '0 2px 8px rgba(76, 175, 80, 0.2)'
                            : 'none',
                        border: ('special' in item && item.special) 
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
                          : undefined,
                      },
                      borderRadius: 2,
                      px: { xs: 1.5, md: 2, lg: 2.5 },
                      py: { xs: 0.75, md: 1, lg: 1.25 },
                      minWidth: isTablet ? 'auto' : undefined,
                      fontSize: { xs: '0.85rem', md: '0.95rem', lg: '1rem' },
                      height: { xs: 36, md: 40, lg: 44 },
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                );
              })}
            </Box>
          )}


          </Box>

          {/* Right Section - Theme Toggle and Auth */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 1.5, lg: 2 },
            minWidth: 'fit-content'
          }}>
          {!isMobile && (
            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton 
                onClick={toggleTheme} 
                color="inherit" 
                sx={{ 
                  p: { xs: 1, md: 1.5, lg: 1.8 },
                  width: { xs: 36, md: 40, lg: 44 },
                  height: { xs: 36, md: 40, lg: 44 },
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)',
                    boxShadow: isDesktop ? '0 6px 20px rgba(76, 175, 80, 0.3)' : '0 4px 12px rgba(76, 175, 80, 0.2)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {mode === 'dark' ? 
                  <Brightness7 sx={{ fontSize: { xs: '1.2rem', md: '1.4rem', lg: '1.5rem' } }} /> : 
                  <Brightness4 sx={{ fontSize: { xs: '1.2rem', md: '1.4rem', lg: '1.5rem' } }} />
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
                mr: { xs: 1, md: 1.5, lg: 2 },
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)',
                  boxShadow: isDesktop ? '0 8px 24px rgba(76, 175, 80, 0.5)' : '0 5px 15px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-2px)',
                },
                borderRadius: 2,
                px: { xs: 1.5, md: 2, lg: 2.5 },
                py: { xs: 0.8, md: 1, lg: 1.2 },
                fontSize: { xs: '0.85rem', md: '0.95rem', lg: '1rem' },
                minWidth: isTablet ? 'auto' : undefined,
                height: { xs: 36, md: 40, lg: 44 },
                transition: 'all 0.3s ease',
              }}
            >
              {isDesktop ? 'Post New Job' : 'Post Job'}
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
                    width: { xs: 32, md: 36, lg: 40 },
                    height: { xs: 32, md: 36, lg: 40 },
                    fontSize: { xs: '0.9rem', md: '1rem', lg: '1.1rem' },
                    boxShadow: isDesktop ? '0 3px 12px rgba(76, 175, 80, 0.25)' : 'none',
                    transition: 'all 0.3s ease',
                    border: isDesktop ? '3px solid transparent' : '2px solid transparent',
                    backgroundClip: 'padding-box',
                    '&:hover': {
                      transform: 'scale(1.08)',
                      boxShadow: isDesktop ? '0 6px 20px rgba(76, 175, 80, 0.4)' : '0 4px 12px rgba(76, 175, 80, 0.3)',
                      borderColor: alpha(theme.palette.primary.light, 0.5),
                    }
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
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 0.5, md: 1, lg: 1.5 }
            }}>
              <Button
                color="inherit"
                startIcon={isMobile ? undefined : (isTablet ? undefined : <Login />)}
                onClick={() => navigate('/login')}
                variant={isMobile ? 'contained' : 'text'}
                sx={{ 
                  fontWeight: 'bold',
                  px: { xs: 1.5, md: 2, lg: 2.5 },
                  py: { xs: 0.5, md: 1, lg: 1.25 },
                  fontSize: { xs: '0.8rem', md: '0.9rem', lg: '1rem' },
                  minWidth: isMobile ? 'auto' : (isTablet ? 'auto' : undefined),
                  height: { xs: 32, md: 40, lg: 44 },
                  borderRadius: 2,
                  background: isMobile ? 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)' : 'transparent',
                  color: isMobile ? 'white' : 'inherit',
                  boxShadow: isMobile ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none',
                  '&:hover': {
                    backgroundColor: isMobile ? 'transparent' : 'primary.light',
                    background: isMobile ? 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)' : undefined,
                    boxShadow: isMobile ? '0 4px 12px rgba(76, 175, 80, 0.4)' 
                      : isDesktop ? '0 4px 16px rgba(76, 175, 80, 0.25)'
                      : '0 2px 8px rgba(76, 175, 80, 0.2)',
                    transform: isDesktop ? 'translateY(-2px)' : 'none',
                  },
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
              >
                Login
              </Button>
              {!isMobile && (
                <Button
                  variant="contained"
                  startIcon={isTablet ? undefined : <PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{ 
                    fontWeight: 'bold',
                    px: { xs: 1.5, md: 2, lg: 2.5 },
                    py: { xs: 0.75, md: 1, lg: 1.25 },
                    fontSize: { xs: '0.8rem', md: '0.95rem', lg: '1rem' },
                    minWidth: isTablet ? 'auto' : undefined,
                    height: { xs: 36, md: 40, lg: 44 },
                    borderRadius: 2,
                    boxShadow: '0 3px 12px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      boxShadow: isDesktop ? '0 8px 24px rgba(76, 175, 80, 0.5)' : '0 4px 12px rgba(76, 175, 80, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  }}
                >
                  {isDesktop ? 'Sign Up Free' : 'Sign Up'}
                </Button>
              )}
            </Box>
          )}
          </Box>
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
            width: { xs: 280, sm: 300, md: 320 },
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