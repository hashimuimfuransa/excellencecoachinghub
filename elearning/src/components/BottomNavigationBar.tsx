import React, { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  Home,
  Search,
  Add,
  School,
  Person,
  People,
  Analytics
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import CreatePostModal from './CreatePostModal';

interface BottomNavigationBarProps {
  unreadNotifications?: number;
  onCreatePost?: () => void;
  userRole?: string;
  userName?: string;
  userAvatar?: string;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  unreadNotifications = 0,
  onCreatePost,
  userRole = 'student',
  userName,
  userAvatar,
  onOpenProfile
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Determine current tab based on location and user role
  const getCurrentTab = () => {
    const path = location.pathname;
    const isTeacher = userRole === 'teacher';
    
    // Home/Dashboard
    if (path.includes('/dashboard') && !path.includes('/courses') && !path.includes('/profile') && !path.includes('/students')) {
      return 0;
    }
    
    // Courses/Search (for students) or Students (for teachers)
    if (isTeacher) {
      if (path.includes('/students') || path.includes('/student-management')) {
        return 1;
      }
    } else {
      if (path.includes('/courses') || path.includes('/search')) {
        return 1;
      }
    }
    
    // Community/Create Post
    if (path.includes('/community') || path.includes('/create')) {
      return 2;
    }
    
    // Learning/AI Assistant (for students) or Analytics (for teachers)
    if (isTeacher) {
      if (path.includes('/analytics') || path.includes('/reports')) {
        return 3;
      }
    } else {
      if (path.includes('/ai-assistant') || path.includes('/assessments')) {
        return 3;
      }
    }
    
    // Profile/Settings
    if ((isTeacher && path.includes('/teacher/profile')) || 
        (!isTeacher && path.includes('/student/settings')) ||
        path.includes('/profile') || path.includes('/settings')) {
      return 4;
    }
    
    return 0; // Default to home
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const isTeacher = userRole === 'teacher';
    
    switch (newValue) {
      case 0:
        // Home/Dashboard
        navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student');
        break;
      case 1:
        // Tab 1: Courses (students) or Students (teachers)
        if (isTeacher) {
          navigate('/dashboard/teacher/students');
        } else {
          navigate('/dashboard/student/courses');
        }
        break;
      case 2:
        // Create Post - Open modal instead of navigating
        setCreatePostOpen(true);
        break;
      case 3:
        // Tab 3: Learning/Analytics (students) or Analytics (teachers)
        if (isTeacher) {
          navigate('/dashboard/teacher/analytics');
        } else {
          navigate('/dashboard/student/ai-assistant');
        }
        break;
      case 4:
        // Profile/Settings
        if (isTeacher) {
          navigate('/dashboard/teacher/profile');
        } else {
          // For students, trigger profile completion popup
          window.dispatchEvent(new CustomEvent('openProfileModal'));
        }
        break;
      default:
        navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student');
    }
  };

  const handleCreatePost = (content: string) => {
    console.log('Creating post:', content);
    // In real implementation, create post via API
    if (onCreatePost) {
      onCreatePost();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area
        display: { xs: 'block', md: 'none' }, // Only show on mobile
        boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <BottomNavigation
        value={getCurrentTab()}
        onChange={handleTabChange}
        sx={{
          height: 60,
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            paddingTop: '8px',
            paddingBottom: '8px',
            color: theme.palette.text.secondary,
            transition: theme.transitions.create([
              'color',
              'padding-top',
            ], {
              duration: theme.transitions.duration.short,
            }),
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              paddingTop: '4px',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '10px',
              fontWeight: 500,
              marginTop: '4px',
              lineHeight: 1.2,
              transition: theme.transitions.create([
                'font-size',
                'line-height',
              ], {
                duration: theme.transitions.duration.short,
              }),
            },
            '&.Mui-selected .MuiBottomNavigationAction-label': {
              fontSize: '11px',
              fontWeight: 600,
            },
          },
          '& .MuiBottomNavigationAction-icon': {
            transition: theme.transitions.create([
              'transform',
            ], {
              duration: theme.transitions.duration.short,
            }),
          },
          '& .Mui-selected .MuiBottomNavigationAction-icon': {
            transform: 'scale(1.1)',
          },
        }}
        showLabels
      >
        {/* Home Tab */}
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
          sx={{
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
        
        {/* Tab 1: Courses (students) or Students (teachers) */}
        <BottomNavigationAction
          label={userRole === 'teacher' ? 'Students' : 'Courses'}
          icon={userRole === 'teacher' ? <People /> : <Search />}
          sx={{
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
        
        {/* Add/Create Tab */}
        <BottomNavigationAction
          label="Create"
          icon={
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: theme.transitions.create([
                  'transform',
                  'box-shadow',
                ], {
                  duration: theme.transitions.duration.short,
                }),
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              <Add />
            </Box>
          }
          sx={{
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          }}
        />
        
        {/* Tab 3: AI Assistant (students) or Analytics (teachers) */}
        <BottomNavigationAction
          label={userRole === 'teacher' ? 'Analytics' : 'AI Assistant'}
          icon={
            <Badge 
              color="error" 
              variant="dot" 
              invisible={unreadNotifications === 0}
              sx={{
                '& .MuiBadge-badge': {
                  right: -2,
                  top: -2,
                  width: 8,
                  height: 8,
                },
              }}
            >
              {userRole === 'teacher' ? <Analytics /> : <School />}
            </Badge>
          }
          sx={{
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
        
        {/* Profile Tab */}
        <BottomNavigationAction
          label="Profile"
          icon={<Person />}
          sx={{
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
      </BottomNavigation>
      
      {/* Create Post Modal */}
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPost={handleCreatePost}
        userAvatar={userAvatar}
        userName={userName}
      />
    </Box>
  );
};

export default BottomNavigationBar;
