import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Box,
  Fab,
  useTheme,
  alpha,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Home,
  Work,
  Add,
  People,
  Notifications,
  Message,
  Business,
  School
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../contexts/AuthContext';

interface MobileFooterNavbarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  userRole?: UserRole | string;
  onCreatePost?: () => void;
  candidateCount?: number;
}

const MobileFooterNavbar: React.FC<MobileFooterNavbarProps> = ({
  unreadNotifications = 0,
  unreadMessages = 0,
  userRole,
  onCreatePost,
  candidateCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);

  // Check if user is an employer
  const isEmployer = userRole === UserRole.EMPLOYER;

  // Speed dial actions for employers
  const speedDialActions = isEmployer ? [
    {
      icon: <Work />,
      name: 'Post Job',
      onClick: () => navigate('/app/jobs/create')
    },
    {
      icon: <School />,
      name: 'Post Internship',
      onClick: () => navigate('/app/internships/create')
    }
  ] : [
    {
      icon: <Add />,
      name: 'Create Post',
      onClick: onCreatePost || (() => {})
    }
  ];

  // Simplified navigation - only 5 essential tabs
  const getCurrentTab = () => {
    const path = location.pathname;
    
    // Network/Home is always tab 0
    if (path.includes('/app/network')) return 0;
    
    // Jobs tab (tab 1)
    if (path.includes('/app/jobs') || path.includes('/app/employer/jobs')) return 1;
    
    // Messages tab (tab 2)
    if (path.includes('/app/messages')) return 2;
    
    // Notifications tab (tab 3)  
    if (path.includes('/app/notifications')) return 3;
    
    // People tab (tab 4) - Candidates for employers, Network connections for job seekers
    if (isEmployer && path.includes('/app/employer/candidates')) return 4;
    if (!isEmployer && path.includes('/app/connections')) return 4;
    
    // Default to Network/Home tab
    return 0;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Simplified navigation logic for 5 tabs
    switch (newValue) {
      case 0:
        // Network/Home - the main landing page for logged-in users
        navigate('/app/network');
        break;
      case 1:
        // Jobs - specific to user role
        if (isEmployer) {
          navigate('/app/employer/jobs');
        } else {
          navigate('/app/jobs');
        }
        break;
      case 2:
        // Messages
        navigate('/app/messages');
        break;
      case 3:
        // Notifications  
        navigate('/app/notifications');
        break;
      case 4:
        // People - Candidates for employers, Connections for job seekers
        if (isEmployer) {
          navigate('/app/employer/candidates');
        } else {
          navigate('/app/connections');
        }
        break;
      default:
        // Fallback to network
        navigate('/app/network');
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
        {/* Network/Home - Main landing page */}
        <BottomNavigationAction
          label="Network"
          icon={<Home />}
        />
        
        {/* Jobs - Role-specific */}
        <BottomNavigationAction
          label={isEmployer ? "My Jobs" : "Jobs"}
          icon={isEmployer ? <Business /> : <Work />}
        />
        
        {/* Messages */}
        <BottomNavigationAction
          label="Messages"
          icon={
            <Badge badgeContent={unreadMessages > 0 ? unreadMessages : undefined} color="error">
              <Message />
            </Badge>
          }
        />
        
        {/* Notifications */}
        <BottomNavigationAction
          label="Alerts"
          icon={
            <Badge badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined} color="error">
              <Notifications />
            </Badge>
          }
        />
        
        {/* People - Candidates for employers, Connections for job seekers */}
        <BottomNavigationAction
          label={isEmployer ? "Candidates" : "People"}
          icon={
            isEmployer ? (
              <Badge badgeContent={candidateCount > 0 ? candidateCount : undefined} color="secondary">
                <People />
              </Badge>
            ) : (
              <People />
            )
          }
        />
      </BottomNavigation>
      </Paper>

      {/* Floating Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{
          position: 'absolute',
          bottom: 85,
          right: 16,
          '& .MuiFab-primary': {
            backgroundColor: theme.palette.primary.main,
            boxShadow: theme.shadows[8],
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={() => {
              action.onClick();
              setSpeedDialOpen(false);
            }}
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[4],
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default MobileFooterNavbar;