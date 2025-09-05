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
  Message,
  Business,
  Person
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../contexts/AuthContext';

interface MobileFooterNavbarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  userRole?: UserRole | string;
  onCreatePost?: () => void;
  onShowConnections?: () => void;
  onShowCandidates?: () => void;
  candidateCount?: number;
}

const MobileFooterNavbar: React.FC<MobileFooterNavbarProps> = ({
  unreadNotifications = 0,
  unreadMessages = 0,
  userRole,
  onCreatePost,
  onShowConnections,
  onShowCandidates,
  candidateCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Check if user is an employer
  const isEmployer = userRole === UserRole.EMPLOYER;

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/app/network') return 0;
    
    if (isEmployer) {
      // Employer navigation mapping (6 tabs total: 0-5)
      if (path.includes('/app/employer/jobs') || path === '/app/jobs') return 1;
      if (path.includes('/app/messages')) return 2;
      if (path.includes('/app/notifications')) return 3;
      if (path.includes('/app/applications')) return 4;
      if (path.includes('/app/employer/candidates')) return 5;
      // Create post button is index 6 but doesn't stay selected
    } else {
      // Job seeker navigation mapping (6 tabs total: 0-5)  
      if (path === '/app/jobs') return 1;
      if (path.includes('/app/messages')) return 2;
      if (path.includes('/app/notifications')) return 3;
      if (path.includes('/app/applications')) return 4;
      if (path.includes('/app/connections')) return 5;
      // Create post button is index 6 but doesn't stay selected
    }
    return 0;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (isEmployer) {
      // Employer navigation logic
      switch (newValue) {
        case 0:
          navigate('/app/network');
          break;
        case 1:
          navigate('/app/employer/jobs');
          break;
        case 2:
          navigate('/app/messages');
          break;
        case 3:
          navigate('/app/notifications');
          break;
        case 4:
          navigate('/app/applications');
          break;
        case 5:
          if (onShowCandidates) {
            onShowCandidates();
          } else {
            navigate('/app/employer/candidates');
          }
          break;
        case 6:
          if (onCreatePost) {
            onCreatePost();
          }
          break;
      }
    } else {
      // Job seeker navigation logic
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
          navigate('/app/applications');
          break;
        case 5:
          if (onShowConnections) {
            onShowConnections();
          } else {
            navigate('/app/connections');
          }
          break;
        case 6:
          if (onCreatePost) {
            onCreatePost();
          }
          break;
      }
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
        {/* Home */}
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
        />
        
        {/* Jobs/Employer Jobs */}
        <BottomNavigationAction
          label={isEmployer ? "My Jobs" : "Jobs"}
          icon={isEmployer ? <Business /> : <Work />}
        />
        
        {/* Messages */}
        <BottomNavigationAction
          label="Messages"
          icon={
            <Badge badgeContent={unreadMessages} color="error">
              <Message />
            </Badge>
          }
        />
        
        {/* Notifications */}
        <BottomNavigationAction
          label="Alerts"
          icon={
            <Badge badgeContent={unreadNotifications} color="error">
              <Notifications />
            </Badge>
          }
        />
        
        {/* Applications tab */}
        <BottomNavigationAction
          label={isEmployer ? "My Apps" : "Apps"}
          icon={<Assignment />}
        />
        
        {/* Candidates tab for employers, Applications/Connections for job seekers */}
        <BottomNavigationAction
          label={isEmployer ? "Candidates" : "Connections"}
          icon={
            isEmployer ? (
              <Badge badgeContent={candidateCount > 0 ? candidateCount : undefined} color="secondary">
                <People />
              </Badge>
            ) : (
              <Person />
            )
          }
        />
        
        {/* Create Post */}
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