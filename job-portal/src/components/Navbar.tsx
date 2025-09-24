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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLargeTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl'));
  
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
  ] as any[];

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
  ] as any[];

  // For non-logged in users, show public menu
  const publicMenuItems = [
    { text: 'All Jobs', icon: <Work />, path: '/' },
    { text: 'Internships', icon: <School />, path: '/internships' },
    { text: 'Other Opportunities', icon: <CategoryIcon />, isDropdown: true },
    { text: 'Support', icon: <Support />, path: '/support' },
    { text: 'Contact Us', icon: <ContactSupport />, action: handleContactOpen, isContactDialog: true },
  ] as any[];

  // Choose which menu to show based on user authentication and role
  const currentMenuItems = user 
    ? (user.role === UserRole.EMPLOYER ? employerMenuItems : menuItems)
    : publicMenuItems;

  const drawer = (
    <Box sx={{ 
      width: { xs: '100vw', sm: 320, md: 360 },
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: mode === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Enhanced Header */}
      <Box sx={{ 
        p: { xs: 2.5, sm: 3 },
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)',
        color: 'white',
        position: 'relative',
        minHeight: { xs: 80, sm: 90 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(76, 175, 80, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(33, 150, 243, 0.1) 0%, transparent 50%)',
          zIndex: 2,
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1.5, sm: 2 },
          position: 'relative',
          zIndex: 3
        }}>
          <Box
            sx={{
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <img 
              src="/exjobnetlogo.png" 
              alt="ExJobNet" 
              style={{ 
                height: '70%', 
                width: '70%',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)'
              }}
            />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.2rem' },
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                letterSpacing: '-0.02em'
              }}
            >
              ExJobNet
            </Typography>
            <Typography 
              variant="caption"
              sx={{
                opacity: 0.9,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                fontWeight: 500,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              Career Hub
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            color: 'white',
            position: 'relative',
            zIndex: 3,
            p: { xs: 1.5, sm: 2 },
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Close sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
        </IconButton>
      </Box>
      
      {/* User Info Section */}
      {user && (
        <Box sx={{
          p: { xs: 2, sm: 2.5 },
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(46, 125, 50, 0.02) 100%)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          position: 'relative'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2 },
            p: { xs: 1.5, sm: 2 },
            borderRadius: '16px',
            background: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}>
            <Avatar
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 'bold'
              }}
            >
              {user.firstName?.charAt(0) || user.email?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  color: 'text.primary',
                  lineHeight: 1.2
                }}
                noWrap
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Typography 
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  display: 'block',
                  mt: 0.25
                }}
                noWrap
              >
                {user.email}
              </Typography>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: '8px',
                background: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <Typography 
                  variant="caption"
                  sx={{
                    color: 'primary.main',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                >
                  {user.role}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Scrollable Content */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: alpha(theme.palette.primary.main, 0.5),
        },
      }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* Main Navigation */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                px: { xs: 2, sm: 2.5 },
                py: 1,
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Navigation
            </Typography>
            <List sx={{ py: 0 }}>
              {currentMenuItems.filter(item => !item.protected || user).map((item) => {
                // If it's the dropdown item, render the opportunities as sub-items
                if (item.isDropdown) {
                  return (
                    <React.Fragment key={item.text}>
                      {/* Dropdown header */}
                      <ListItem sx={{ 
                        px: { xs: 2, sm: 2.5 },
                        py: { xs: 1.5, sm: 2 },
                        mb: 1,
                        borderRadius: '16px',
                        background: mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      }}>
                        <ListItemIcon sx={{ 
                          color: 'primary.main', 
                          minWidth: { xs: 36, sm: 40 },
                          mr: { xs: 1.5, sm: 2 }
                        }}>
                          <Box sx={{
                            p: 1,
                            borderRadius: '12px',
                            background: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {item.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          sx={{ 
                            '& .MuiListItemText-primary': { 
                              fontWeight: 'bold',
                              color: 'primary.main',
                              fontSize: { xs: '0.95rem', sm: '1rem' }
                            } 
                          }}
                        />
                      </ListItem>
                      {/* Render opportunity categories as sub-items */}
                      <Box sx={{ pl: { xs: 2, sm: 2.5 }, pr: { xs: 1.5, sm: 2 } }}>
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
                                ? alpha(theme.palette.primary.main, 0.12) 
                                : 'transparent',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                transform: 'translateX(4px)',
                              },
                              borderRadius: '12px',
                              mb: 0.5,
                              pl: { xs: 3, sm: 3.5 },
                              py: { xs: 1.2, sm: 1.5 },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: location.pathname === opportunity.path 
                                ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                : '1px solid transparent',
                              boxShadow: location.pathname === opportunity.path 
                                ? '0 2px 8px rgba(76, 175, 80, 0.15)'
                                : 'none',
                            }}
                          >
                            <ListItemIcon sx={{ 
                              color: location.pathname === opportunity.path ? 'primary.main' : 'inherit',
                              minWidth: { xs: 32, sm: 36 }
                            }}>
                              <Box sx={{
                                p: 0.5,
                                borderRadius: '8px',
                                background: location.pathname === opportunity.path 
                                  ? alpha(theme.palette.primary.main, 0.1)
                                  : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {opportunity.icon}
                              </Box>
                            </ListItemIcon>
                            <ListItemText 
                              primary={opportunity.label}
                              secondary={opportunity.description}
                              sx={{ 
                                '& .MuiListItemText-primary': { 
                                  fontWeight: location.pathname === opportunity.path ? 'bold' : 'normal',
                                  color: location.pathname === opportunity.path ? 'primary.main' : 'inherit',
                                  fontSize: { xs: '0.9rem', sm: '0.95rem' }
                                },
                                '& .MuiListItemText-secondary': {
                                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                  color: 'text.secondary',
                                  mt: 0.25,
                                  lineHeight: 1.3
                                }
                              }}
                            />
                          </ListItem>
                        ))}
                      </Box>
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
                        transform: 'translateX(4px)',
                      },
                      mx: { xs: 1.5, sm: 2 },
                      borderRadius: '16px',
                      mb: 1,
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                      border: item.highlight 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : ('special' in item && item.special)
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                          : (location.pathname === item.path ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : '1px solid transparent'),
                      boxShadow: item.highlight 
                        ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                        : ('special' in item && item.special)
                          ? '0 2px 8px rgba(76, 175, 80, 0.1)'
                          : (location.pathname === item.path ? '0 2px 8px rgba(76, 175, 80, 0.15)' : 'none'),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: item.highlight 
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                          : 'transparent',
                        zIndex: 1,
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: item.highlight 
                        ? 'white' 
                        : ('special' in item && item.special)
                          ? 'primary.main'
                          : (location.pathname === item.path ? 'primary.main' : 'inherit'),
                      minWidth: { xs: 36, sm: 40 },
                      mr: { xs: 1.5, sm: 2 },
                      position: 'relative',
                      zIndex: 2
                    }}>
                      <Box sx={{
                        p: 1,
                        borderRadius: '12px',
                        background: item.highlight 
                          ? 'rgba(255, 255, 255, 0.2)'
                          : ('special' in item && item.special)
                            ? alpha(theme.palette.primary.main, 0.1)
                            : (location.pathname === item.path ? alpha(theme.palette.primary.main, 0.1) : 'transparent'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: item.highlight ? 'blur(10px)' : 'none',
                        border: item.highlight ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
                      }}>
                        {item.icon}
                      </Box>
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
                              : (location.pathname === item.path ? 'primary.main' : 'inherit'),
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          position: 'relative',
                          zIndex: 2
                        } 
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
          {/* Theme Toggle Section */}
          <Box sx={{ 
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '16px',
            background: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 1.5,
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Appearance
            </Typography>
            <FormControlLabel
              control={
                <Switch 
                  checked={mode === 'dark'} 
                  onChange={toggleTheme}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.primary.main,
                      '& + .MuiSwitch-track': {
                        backgroundColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: alpha(theme.palette.text.primary, 0.2),
                    },
                  }}
                />
              }
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  ml: 1
                }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: '10px',
                    background: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {mode === 'dark' ? 
                      <Brightness7 sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, color: 'primary.main' }} /> : 
                      <Brightness4 sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, color: 'primary.main' }} />
                    }
                  </Box>
                  <Typography 
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.9rem', sm: '0.95rem' },
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                  >
                    {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          {/* Authentication Section */}
          {!user && (
            <Box sx={{ 
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: '16px',
              background: mode === 'dark' 
                ? 'rgba(76, 175, 80, 0.05)'
                : 'rgba(76, 175, 80, 0.02)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1.5,
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Account
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Login sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />}
                  onClick={() => {
                    navigate('/login');
                    setMobileOpen(false);
                  }}
                  sx={{ 
                    py: { xs: 1.5, sm: 2 },
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    fontWeight: 600
                  }}
                >
                  Login
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonAdd sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />}
                  onClick={() => {
                    navigate('/register');
                    setMobileOpen(false);
                  }}
                  sx={{ 
                    py: { xs: 1.5, sm: 2 },
                    borderRadius: '12px',
                    border: `2px solid ${theme.palette.primary.main}`,
                    color: 'primary.main',
                    background: 'transparent',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    fontWeight: 600
                  }}
                >
                  Sign Up Free
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
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
          backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: mode === 'dark' 
            ? '0 4px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 4px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(2, 6, 23, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(226, 232, 240, 0.98) 100%)',
            zIndex: -1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'dark'
              ? 'radial-gradient(circle at 20% 50%, rgba(76, 175, 80, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(33, 150, 243, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(156, 39, 176, 0.06) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(76, 175, 80, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(33, 150, 243, 0.04) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(156, 39, 176, 0.03) 0%, transparent 50%)',
            zIndex: -1,
          }
        }}
      >
        <Toolbar sx={{ 
          px: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }, 
          minHeight: { xs: 70, sm: 75, md: 80, lg: 85, xl: 88 },
          py: { xs: 1.5, sm: 1.8, md: 2, lg: 2.2, xl: 2.5 },
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          fontWeight: 500
        }}>
          {(isMobile || isSmallTablet) && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                p: { xs: 1.5, sm: 1.8 },
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
              gap: { xs: 1.5, md: 2, lg: 2.5 },
              cursor: 'pointer',
              minWidth: 'fit-content',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.02)',
              }
            }}
            onClick={() => navigate(user ? '/app/network' : '/')}
          >
            <Box
              sx={{
                width: { xs: 44, sm: 48, md: 52, lg: 56, xl: 60 },
                height: { xs: 44, sm: 48, md: 52, lg: 56, xl: 60 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)',
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3), 0 0 0 1px rgba(76, 175, 80, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  zIndex: 1,
                },
                '&:hover': {
                  boxShadow: '0 12px 32px rgba(76, 175, 80, 0.4), 0 0 0 1px rgba(76, 175, 80, 0.2)',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <img 
                src="/exjobnetlogo.png" 
                alt="ExJobNet" 
                style={{ 
                  height: '70%', 
                  width: '70%',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  zIndex: 2,
                  position: 'relative'
                }}
              />
            </Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 0, 
                fontWeight: 700,
                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem', lg: '1.05rem', xl: '1.1rem' },
                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                letterSpacing: '-0.02em'
              }}
            >
              ExJobNet
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
            {!(isMobile || isSmallTablet) && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { sm: 1.8, md: 2.2, lg: 2.8, xl: 3 }
              }}>
              {currentMenuItems.filter(item => !('protected' in item) || !(item as any).protected || user).map((item) => {
                // Handle dropdown menu item
                if (item.isDropdown) {
                  return (
                    <React.Fragment key={item.text}>
                      <Button
                        ref={opportunitiesRef}
                        color="inherit"
                        startIcon={(isTablet || isSmallTablet) ? undefined : item.icon}
                        endIcon={<KeyboardArrowDown sx={{ 
                          fontSize: 16, 
                          transform: opportunitiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }} />}
                        onClick={handleOpportunitiesToggle}
                        variant="text"
                        sx={{
                          fontWeight: 600,
                          color: opportunitiesOpen ? 'primary.main' : 'text.primary',
                          backgroundColor: opportunitiesOpen ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                          borderRadius: 3,
                          px: { sm: 2.2, md: 2.5, lg: 2.8, xl: 3 },
                          py: { sm: 1.2, md: 1.25, lg: 1.4, xl: 1.5 },
                          minWidth: (isTablet || isSmallTablet) ? 'auto' : undefined,
                          fontSize: { sm: '0.82rem', md: '0.85rem', lg: '0.88rem', xl: '0.9rem' },
                          height: { sm: 42, md: 44, lg: 46, xl: 48 },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          letterSpacing: '-0.01em',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.15)',
                          },
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
                    startIcon={(isTablet || isSmallTablet) ? undefined : item.icon}
                    onClick={() => {
                      if (item.isContactDialog && 'action' in item) {
                        item.action();
                      } else if ('requiresAuth' in item && (item as any).requiresAuth && !user) {
                        navigate('/register?role=employer');
                      } else if ('path' in item) {
                        navigate(item.path);
                      }
                    }}
                    variant={('highlight' in item && (item as any).highlight) ? 'contained' : 'text'}
                    sx={{
                      fontWeight: ('path' in item && location.pathname === item.path) 
                        ? 'bold' 
                        : (('highlight' in item && (item as any).highlight) || ('special' in item && (item as any).special)) 
                          ? 'bold' 
                          : 'normal',
                      color: ('highlight' in item && (item as any).highlight) 
                        ? 'white' 
                        : ('special' in item && (item as any).special)
                          ? 'primary.main'
                          : (('path' in item && location.pathname === item.path) ? 'primary.main' : 'text.primary'),
                      backgroundColor: ('highlight' in item && (item as any).highlight)
                        ? 'primary.main' 
                        : (('path' in item && location.pathname === item.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent'),
                      border: ('special' in item && (item as any).special) 
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                        : 'none',
                      borderRadius: 3,
                      px: { sm: 2.2, md: 2.5, lg: 2.8, xl: 3 },
                      py: { sm: 1.2, md: 1.25, lg: 1.4, xl: 1.5 },
                      minWidth: (isTablet || isSmallTablet) ? 'auto' : undefined,
                      fontSize: { sm: '0.82rem', md: '0.85rem', lg: '0.88rem', xl: '0.9rem' },
                      height: { sm: 42, md: 44, lg: 46, xl: 48 },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      letterSpacing: '-0.01em',
                      '&:hover': {
                        backgroundColor: ('highlight' in item && (item as any).highlight)
                          ? 'linear-gradient(135deg, #45a049 0%, #1b5e20 100%)' 
                          : ('special' in item && (item as any).special)
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateY(-2px)',
                        boxShadow: ('highlight' in item && (item as any).highlight) 
                          ? '0 8px 24px rgba(76, 175, 80, 0.3)' 
                          : ('special' in item && (item as any).special)
                            ? '0 4px 16px rgba(76, 175, 80, 0.2)'
                            : '0 4px 16px rgba(76, 175, 80, 0.1)',
                        border: ('special' in item && (item as any).special) 
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
                          : undefined,
                      },
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
            gap: { xs: 1, sm: 1.2, md: 1.5, lg: 1.8, xl: 2 },
            minWidth: 'fit-content'
          }}>
          {!(isMobile || isSmallTablet) && (
            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton 
                onClick={toggleTheme} 
                color="inherit" 
                sx={{ 
                  p: { sm: 1.2, md: 1.5, lg: 1.7, xl: 1.8 },
                  width: { sm: 38, md: 40, lg: 42, xl: 44 },
                  height: { sm: 38, md: 40, lg: 42, xl: 44 },
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)',
                    boxShadow: (isLargeTablet || isDesktop) ? '0 6px 20px rgba(76, 175, 80, 0.3)' : '0 4px 12px rgba(76, 175, 80, 0.2)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {mode === 'dark' ? 
                  <Brightness7 sx={{ fontSize: { sm: '1.3rem', md: '1.4rem', lg: '1.45rem', xl: '1.5rem' } }} /> : 
                  <Brightness4 sx={{ fontSize: { sm: '1.3rem', md: '1.4rem', lg: '1.45rem', xl: '1.5rem' } }} />
                }
              </IconButton>
            </Tooltip>
          )}

          {/* Post Job Button for Employers */}
          {user && user.role === UserRole.EMPLOYER && !(isMobile || isSmallTablet) && (
            <Button
              variant="contained"
              startIcon={(isTablet || isSmallTablet) ? undefined : <PostAdd />}
              onClick={() => navigate('/app/jobs/create')}
              sx={{
                mr: { sm: 1.2, md: 1.5, lg: 1.8, xl: 2 },
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)',
                  boxShadow: (isLargeTablet || isDesktop) ? '0 8px 24px rgba(76, 175, 80, 0.5)' : '0 5px 15px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-2px)',
                },
                borderRadius: 2,
                px: { sm: 1.8, md: 2, lg: 2.3, xl: 2.5 },
                py: { sm: 0.9, md: 1, lg: 1.1, xl: 1.2 },
                fontSize: { sm: '0.87rem', md: '0.95rem', lg: '0.98rem', xl: '1rem' },
                minWidth: (isTablet || isSmallTablet) ? 'auto' : undefined,
                height: { sm: 38, md: 40, lg: 42, xl: 44 },
                transition: 'all 0.3s ease',
              }}
            >
              {(isLargeTablet || isDesktop) ? 'Post New Job' : 'Post Job'}
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
                    width: { xs: 32, sm: 34, md: 36, lg: 38, xl: 40 },
                    height: { xs: 32, sm: 34, md: 36, lg: 38, xl: 40 },
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem', lg: '1.05rem', xl: '1.1rem' },
                    boxShadow: (isLargeTablet || isDesktop) ? '0 3px 12px rgba(76, 175, 80, 0.25)' : 'none',
                    transition: 'all 0.3s ease',
                    border: (isLargeTablet || isDesktop) ? '3px solid transparent' : '2px solid transparent',
                    backgroundClip: 'padding-box',
                    '&:hover': {
                      transform: 'scale(1.08)',
                      boxShadow: (isLargeTablet || isDesktop) ? '0 6px 20px rgba(76, 175, 80, 0.4)' : '0 4px 12px rgba(76, 175, 80, 0.3)',
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
              gap: { xs: 0.5, sm: 0.8, md: 1, lg: 1.3, xl: 1.5 }
            }}>
              <Button
                color="inherit"
                startIcon={(isMobile || isSmallTablet) ? undefined : ((isTablet || isSmallTablet) ? undefined : <Login />)}
                onClick={() => navigate('/login')}
                variant={(isMobile || isSmallTablet) ? 'contained' : 'text'}
                sx={{ 
                  fontWeight: 'bold',
                  px: { xs: 1.5, sm: 1.8, md: 2, lg: 2.3, xl: 2.5 },
                  py: { xs: 0.5, sm: 0.7, md: 1, lg: 1.1, xl: 1.25 },
                  fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem', lg: '0.95rem', xl: '1rem' },
                  minWidth: (isMobile || isSmallTablet) ? 'auto' : ((isTablet || isSmallTablet) ? 'auto' : undefined),
                  height: { xs: 32, sm: 36, md: 40, lg: 42, xl: 44 },
                  borderRadius: 2,
                  background: (isMobile || isSmallTablet) ? 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)' : 'transparent',
                  color: (isMobile || isSmallTablet) ? 'white' : 'inherit',
                  boxShadow: (isMobile || isSmallTablet) ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none',
                  '&:hover': {
                    backgroundColor: (isMobile || isSmallTablet) ? 'transparent' : 'primary.light',
                    background: (isMobile || isSmallTablet) ? 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)' : undefined,
                    boxShadow: (isMobile || isSmallTablet) ? '0 4px 12px rgba(76, 175, 80, 0.4)' 
                      : (isLargeTablet || isDesktop) ? '0 4px 16px rgba(76, 175, 80, 0.25)'
                      : '0 2px 8px rgba(76, 175, 80, 0.2)',
                    transform: (isLargeTablet || isDesktop) ? 'translateY(-2px)' : 'none',
                  },
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
              >
                Login
              </Button>
              {!(isMobile || isSmallTablet) && (
                <Button
                  variant="contained"
                  startIcon={(isTablet || isSmallTablet) ? undefined : <PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{ 
                    fontWeight: 'bold',
                    px: { sm: 1.8, md: 2, lg: 2.3, xl: 2.5 },
                    py: { sm: 0.8, md: 1, lg: 1.1, xl: 1.25 },
                    fontSize: { sm: '0.82rem', md: '0.95rem', lg: '0.98rem', xl: '1rem' },
                    minWidth: (isTablet || isSmallTablet) ? 'auto' : undefined,
                    height: { sm: 38, md: 40, lg: 42, xl: 44 },
                    borderRadius: 2,
                    boxShadow: '0 3px 12px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      boxShadow: (isLargeTablet || isDesktop) ? '0 8px 24px rgba(76, 175, 80, 0.5)' : '0 4px 12px rgba(76, 175, 80, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  }}
                >
                  {(isLargeTablet || isDesktop) ? 'Sign Up Free' : 'Sign Up'}
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
            width: { xs: '100vw', sm: 320, md: 360 },
            borderRadius: '0 20px 20px 0',
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
            boxShadow: mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: mode === 'dark'
                ? 'radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(33, 150, 243, 0.03) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(33, 150, 243, 0.01) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0,
            }
          },
        }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
              backgroundColor: mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.7)' 
                : 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
            }
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