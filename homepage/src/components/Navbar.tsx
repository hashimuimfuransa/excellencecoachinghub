import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Login,
  PersonAdd,
  Home,
  Info,
  Work,
  Handyman,
  Star,
  AccountCircle,
  ExitToApp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setMobileOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileOpen(false);
  };

  const handleRegister = () => {
    navigate('/register');
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMobileOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { label: 'Home', action: () => scrollToSection('hero'), icon: <Home /> },
    { label: 'About', action: () => scrollToSection('about'), icon: <Info /> },
    { label: 'Services', action: () => scrollToSection('services'), icon: <Handyman /> },
    { label: 'How It Works', action: () => scrollToSection('how-it-works'), icon: <Work /> },
    { label: 'Platforms', action: () => scrollToSection('platforms'), icon: <Handyman /> },
    { label: 'Testimonials', action: () => scrollToSection('testimonials'), icon: <Star /> },
  ];

  const drawer = (
    <Box 
      sx={{ 
        width: 280, 
        height: '100%',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5530 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)
          `,
          zIndex: 0,
        }}
      />
      
      {/* Header with Logo and Close Button */}
      <Box sx={{ 
        position: 'relative',
        zIndex: 1,
        p: 3, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/logo.webp"
            alt="ECH Logo"
            sx={{ height: 32, filter: 'brightness(0) invert(1)' }}
          />
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            ECH
          </Typography>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              transform: 'rotate(90deg)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Navigation Items */}
      <List sx={{ pt: 2, position: 'relative', zIndex: 1 }}>
        {navItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ListItem 
              onClick={item.action} 
              sx={{ 
                cursor: 'pointer',
                mx: 2,
                mb: 1,
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  transform: 'translateX(8px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                color: 'white' 
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  {item.icon}
                </Box>
                <ListItemText 
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }
                  }}
                />
              </Box>
            </ListItem>
          </motion.div>
        ))}
        
        {/* Divider */}
        <Box sx={{ mx: 3, my: 2, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* Auth Section */}
        {!user ? (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <ListItem 
                onClick={handleLogin} 
                sx={{ 
                  cursor: 'pointer',
                  mx: 2,
                  mb: 1,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(34, 197, 94, 0.2)',
                    transform: 'translateX(8px)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
                  <Login sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  <ListItemText 
                    primary="Login"
                    sx={{ '& .MuiTypography-root': { color: 'white', fontWeight: 500 } }}
                  />
                </Box>
              </ListItem>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <ListItem 
                onClick={handleRegister} 
                sx={{ 
                  cursor: 'pointer',
                  mx: 2,
                  mb: 1,
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #16a34a, #15803d)',
                    transform: 'translateX(8px) scale(1.02)',
                    boxShadow: '0 8px 20px rgba(34, 197, 94, 0.3)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
                  <PersonAdd />
                  <ListItemText 
                    primary="Get Started"
                    sx={{ '& .MuiTypography-root': { color: 'white', fontWeight: 600 } }}
                  />
                </Box>
              </ListItem>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <ListItem sx={{ mx: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
                  <AccountCircle sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  <ListItemText 
                    primary={`Welcome, ${user.firstName}!`}
                    secondary={user.email}
                    sx={{ 
                      '& .MuiTypography-root': { color: 'white', fontWeight: 500 },
                      '& .MuiTypography-body2': { color: 'rgba(255, 255, 255, 0.6)' }
                    }}
                  />
                </Box>
              </ListItem>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <ListItem 
                onClick={handleLogout} 
                sx={{ 
                  cursor: 'pointer',
                  mx: 2,
                  mb: 1,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.2)',
                    transform: 'translateX(8px)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
                  <ExitToApp sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  <ListItemText 
                    primary="Logout"
                    sx={{ '& .MuiTypography-root': { color: 'white', fontWeight: 500 } }}
                  />
                </Box>
              </ListItem>
            </motion.div>
          </>
        )}
      </List>
      
      {/* Footer */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        p: 3, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        zIndex: 1
      }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          © 2024 Excellence Coaching Hub
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 2 : 0}
        sx={{
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease-in-out',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
          boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
          borderRadius: 0,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: { xs: 0.5, sm: 1 }, minHeight: { xs: 56, sm: 64 } }}>
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => scrollToSection('hero')}
              >
                <Box
                  component="img"
                  src="/logo.webp"
                  alt="Excellence Coaching Hub Logo"
                  sx={{
                    height: { xs: 32, sm: 38, md: 42 },
                    mr: { xs: 1.5, sm: 2 },
                    filter: scrolled ? 'none' : 'brightness(0) invert(1)',
                    transition: 'filter 0.3s ease-in-out'
                  }}
                />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    color: scrolled ? 'text.primary' : 'white',
                    fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
                    textShadow: scrolled ? 'none' : '0px 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: 1.2,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
            
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    color: scrolled ? 'text.primary' : 'white',
                    fontSize: '0.8rem',
                    textShadow: scrolled ? 'none' : '0px 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: 1.2,
                    display: { xs: 'block', sm: 'none' }
                  }}
                >
                  ECH
                </Typography>
              </Box>
            </motion.div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Button
                      onClick={item.action}
                      sx={{
                        color: scrolled ? 'text.primary' : 'white',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: scrolled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                ))}

                {/* Auth Buttons */}
                {!user ? (
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    <Button
                      component={motion.button}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogin}
                      variant="outlined"
                      startIcon={<Login />}
                      sx={{
                        color: scrolled ? 'primary.main' : 'white',
                        borderColor: scrolled ? 'primary.main' : 'white',
                        borderWidth: '1px',
                        borderRadius: '4px',
                        px: 2,
                        '&:hover': {
                          borderColor: scrolled ? 'primary.dark' : 'rgba(255, 255, 255, 0.8)',
                          bgcolor: scrolled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={motion.button}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRegister}
                      variant="contained"
                      startIcon={<PersonAdd />}
                      sx={{
                        bgcolor: scrolled ? 'primary.main' : 'secondary.main',
                        borderRadius: '4px',
                        px: 2,
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                        '&:hover': {
                          bgcolor: scrolled ? 'primary.dark' : 'secondary.dark',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                        }
                      }}
                    >
                      Register
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: scrolled ? 'text.primary' : 'white',
                        fontWeight: 500,
                        textShadow: scrolled ? 'none' : '0px 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      Welcome, {user.firstName}!
                    </Typography>
                    <Button
                      component={motion.button}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: scrolled ? 'primary.main' : 'white',
                        borderColor: scrolled ? 'primary.main' : 'white',
                        borderRadius: '4px',
                        borderWidth: '1px',
                        '&:hover': {
                          borderColor: scrolled ? 'primary.dark' : 'rgba(255, 255, 255, 0.8)',
                          bgcolor: scrolled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ color: scrolled ? 'text.primary' : 'white' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            border: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;