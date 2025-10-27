import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Home,
  Search,
  Add,
  Favorite,
  Person,
  Notifications,
  Chat,
  Groups,
  Work,
  BookmarkBorder,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface SocialMobileNavProps {
  onCreatePost: () => void;
}

const SocialMobileNav: React.FC<SocialMobileNavProps> = ({ onCreatePost }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      icon: <Home />,
      value: '/social',
      badge: 0,
    },
    {
      label: 'Network',
      icon: <Groups />,
      value: '/connections',
      badge: 3,
    },
    {
      label: 'Post',
      icon: <Add />,
      value: 'create',
      badge: 0,
      isAction: true,
    },
    {
      label: 'Notifications',
      icon: <Notifications />,
      value: '/notifications',
      badge: 12,
    },
    {
      label: 'Messages',
      icon: <Chat />,
      value: '/messages',
      badge: 5,
    },
  ];

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'create') {
      onCreatePost();
    } else {
      navigate(newValue);
    }
  };

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    return navItems.find(item => item.value === currentPath)?.value || '/social';
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        '& .MuiBottomNavigation-root': {
          bgcolor: 'background.paper',
          borderRadius: 0,
        },
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        sx={{
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
            },
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          },
        }}
      >
        {navItems.map((item, index) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {item.isAction ? (
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {item.icon}
                  </Box>
                ) : item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </motion.div>
            }
            sx={{
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 500,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default SocialMobileNav;