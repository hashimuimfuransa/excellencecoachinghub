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
  FormControlLabel
} from '@mui/material';
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
  TrendingUp
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
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Jobs', icon: <Work />, path: '/jobs' },
    { text: 'Companies', icon: <Business />, path: '/companies' },
    { text: 'Support', icon: <Support />, path: '/support' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img 
            src="/exjobnetlogo.png" 
            alt="ExJobNet" 
            style={{ height: 30, width: 'auto' }}
          />
         
        </Box>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              backgroundColor: location.pathname === item.path ? 'primary.light' : 'transparent',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
              mx: 1,
              borderRadius: 1,
              mb: 0.5
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                '& .MuiListItemText-primary': { 
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  color: location.pathname === item.path ? 'primary.main' : 'inherit'
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
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            <img 
              src="/exjobnetlogo.png" 
              alt="ExJobNet" 
              style={{ height: 80, width: 'auto' }}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    backgroundColor: location.pathname === item.path ? 'primary.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {!isMobile && (
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
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
                    width: 32,
                    height: 32,
                    fontSize: '0.9rem'
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
                <MenuItem onClick={() => { navigate('/app/profile'); handleClose(); }}>
                  <Person sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { navigate('/app/dashboard'); handleClose(); }}>
                  <Work sx={{ mr: 1 }} />
                  Dashboard
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Login sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            !isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{ 
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{ 
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                    }
                  }}
                >
                  Sign Up
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
            width: 250,
            borderRadius: '0 16px 16px 0'
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;