import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  Home,
  Search,
  Add,
  People,
  Notifications,
  Work,
  Psychology,
  Assignment,
  Message
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileFooterNavbarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  onCreatePost?: () => void;
  onShowConnections?: () => void;
}

const MobileFooterNavbar: React.FC<MobileFooterNavbarProps> = ({
  unreadNotifications = 0,
  unreadMessages = 0,
  onCreatePost,
  onShowConnections
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/app/network') return 0;
    if (path === '/app/jobs') return 1;
    if (path.includes('/app/messages')) return 2;
    if (path.includes('/app/notifications')) return 3;
    if (path.includes('/app/connections')) return 4;
    return 0;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/app/network');
        break;
      case 1:
        navigate('/app/jobs');
        break;
      case 2:
        navigate('/app/messages');
        break;
      case 3:
        navigate('/app/notifications');
        break;
      case 4:
        if (onShowConnections) {
          onShowConnections();
        } else {
          navigate('/app/connections');
        }
        break;
      case 5:
        if (onCreatePost) {
          onCreatePost();
        }
        break;
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        mt: 2, // Add some margin top for spacing
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <Paper
        sx={{
          width: '100%',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)'
            : '0 4px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
          borderRadius: '20px', // Rounded corners all around
          position: 'relative',
          overflow: 'hidden',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 4,
            backgroundColor: alpha(theme.palette.text.secondary, 0.3),
            borderRadius: 2,
            zIndex: 1,
          },
          // Add a subtle gradient overlay for extra depth
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
          }
        }}
        elevation={0}
      >
      <BottomNavigation
        value={getCurrentTab()}
        onChange={handleTabChange}
        sx={{
          height: 'auto', // Let it size naturally
          minHeight: 70, // Minimum height
          backgroundColor: 'transparent',
          pt: 1.5, // Top padding for handle
          pb: 1, // Bottom padding for safe area
          width: '100%',
          display: 'flex',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            flex: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            borderRadius: 2,
            margin: '0 2px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              transform: 'translateY(-2px)',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              marginTop: 0.5,
              transition: 'all 0.2s ease',
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.08),
              transform: 'translateY(-1px)',
            }
          }
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
        />
        
        <BottomNavigationAction
          label="Jobs"
          icon={<Work />}
        />
        
        <BottomNavigationAction
          label="Messages"
          icon={
            <Badge badgeContent={unreadMessages} color="error">
              <Message />
            </Badge>
          }
        />
        
        <BottomNavigationAction
          label="Alerts"
          icon={
            <Badge badgeContent={unreadNotifications} color="error">
              <Notifications />
            </Badge>
          }
        />
        
        <BottomNavigationAction
          label="People"
          icon={<People />}
        />
        
        <BottomNavigationAction
          label="Post"
          icon={
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Add sx={{ fontSize: 20 }} />
            </Box>
          }
        />
      </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default MobileFooterNavbar;