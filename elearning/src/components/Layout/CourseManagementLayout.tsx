import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Breadcrumbs,
  Link,
  Chip,
  useTheme,
  useMediaQuery,
  Container,
  Divider,
  Paper,
  Fade,
  Slide,
  alpha,
  styled
} from '@mui/material';
import {
  ArrowBack,
  Dashboard,
  School,
  Settings,
  Logout,
  Person,
  Menu as MenuIcon,
  Notifications,
  Home,
  TrendingUp,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { useEffect } from 'react';

// Styled components for modern design
const ModernAppBar = styled(AppBar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  backdropFilter: 'blur(10px)',
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
  borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const ModernChip = styled(Chip)(({ theme }) => ({
  borderRadius: 20,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 28,
  '&.MuiChip-colorSuccess': {
    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
    color: 'white',
  },
  '&.MuiChip-colorWarning': {
    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
    color: 'white',
  },
}));

const CourseManagementLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams<{ courseId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      if (courseId) {
        try {
          const course = await courseService.getCourseById(courseId);
          setCourseData(course);
        } catch (error) {
          console.error('Error loading course:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCourse();
  }, [courseId]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleBackToCourses = () => {
    navigate('/dashboard/teacher/courses');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/teacher');
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Add dashboard
    breadcrumbs.push(
      <Link
        key="dashboard"
        color="inherit"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate('/dashboard/teacher');
        }}
        sx={{ 
          textDecoration: 'none', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          '&:hover': { 
            color: 'primary.main',
            textDecoration: 'underline' 
          } 
        }}
      >
        <Home sx={{ fontSize: '1rem' }} />
        Dashboard
      </Link>
    );
    
    // Add courses
    breadcrumbs.push(
      <Link
        key="courses"
        color="inherit"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate('/dashboard/teacher/courses');
        }}
        sx={{ 
          textDecoration: 'none', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          '&:hover': { 
            color: 'primary.main',
            textDecoration: 'underline' 
          } 
        }}
      >
        <School sx={{ fontSize: '1rem' }} />
        My Courses
      </Link>
    );
    
    // Add current course
    if (courseData) {
      breadcrumbs.push(
        <Typography 
          key="course" 
          color="text.primary"
          sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <TrendingUp sx={{ fontSize: '1rem' }} />
          {courseData.title}
        </Typography>
      );
    }
    
    return breadcrumbs;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      {/* Top App Bar */}
      <ModernAppBar 
        position="static" 
        elevation={0}
        sx={{ 
          color: 'white',
          zIndex: 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Back Button */}
          <Fade in={true} timeout={800}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBackToCourses}
              sx={{ 
                mr: 2,
                backgroundColor: alpha('#fff', 0.1),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <ArrowBack />
            </IconButton>
          </Fade>
          
          {/* Course Title */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Slide direction="right" in={true} timeout={1000}>
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px',
                }}
              >
                {loading ? 'Loading...' : courseData?.title || 'Course Management'}
              </Typography>
            </Slide>
            <Slide direction="right" in={true} timeout={1200}>
              <Typography
                variant="body2"
                sx={{
                  color: alpha('#fff', 0.8),
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 500,
                  mt: 0.5,
                }}
              >
                📚 Course Management Dashboard
              </Typography>
            </Slide>
          </Box>
          
          {/* Course Status Chip */}
          {courseData && (
            <Fade in={true} timeout={1400}>
              <ModernChip
                label={courseData.isPublished ? '✅ Published' : '📝 Draft'}
                color={courseData.isPublished ? 'success' : 'warning'}
                size="small"
                sx={{ 
                  mr: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            </Fade>
          )}
          
          {/* Notifications */}
          <Fade in={true} timeout={1600}>
            <IconButton 
              color="inherit" 
              sx={{ 
                mr: 1,
                backgroundColor: alpha('#fff', 0.1),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Notifications />
            </IconButton>
          </Fade>
          
          {/* User Menu */}
          <Fade in={true} timeout={1800}>
            <IconButton
              onClick={handleMenuOpen}
              sx={{ 
                p: 0,
                '&:hover': {
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Avatar
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Fade>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                mt: 1,
                minWidth: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }
            }}
          >
            <MenuItem 
              onClick={handleGoToDashboard}
              sx={{ 
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: alpha('#667eea', 0.1),
                }
              }}
            >
              <Dashboard sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography fontWeight={500}>Dashboard</Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => navigate('/dashboard/teacher/profile')}
              sx={{ 
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: alpha('#667eea', 0.1),
                }
              }}
            >
              <Person sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography fontWeight={500}>Profile</Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => navigate('/dashboard/teacher/settings')}
              sx={{ 
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: alpha('#667eea', 0.1),
                }
              }}
            >
              <Settings sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography fontWeight={500}>Settings</Typography>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: alpha('#f44336', 0.1),
                }
              }}
            >
              <Logout sx={{ mr: 1.5, color: 'error.main' }} />
              <Typography fontWeight={500} color="error.main">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </ModernAppBar>

      {/* Breadcrumbs */}
      <ModernPaper elevation={0} sx={{ 
        backgroundColor: alpha('#fff', 0.9),
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: alpha('#000', 0.05),
        zIndex: 1,
      }}>
        <Container maxWidth="xl">
          <Box sx={{ py: 1.5 }}>
            <Breadcrumbs 
              separator={
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  →
                </Typography>
              } 
              aria-label="breadcrumb"
              sx={{
                '& .MuiBreadcrumbs-separator': {
                  mx: 1,
                }
              }}
            >
              {getBreadcrumbs()}
            </Breadcrumbs>
          </Box>
        </Container>
      </ModernPaper>

      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        py: 4, 
        position: 'relative',
        zIndex: 1,
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Fade in={true} timeout={2000}>
            <Box>
              <Outlet />
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Footer */}
      <ModernPaper
        component="footer"
        elevation={0}
        sx={{
          backgroundColor: alpha('#fff', 0.9),
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid',
          borderColor: alpha('#000', 0.05),
          py: 3,
          mt: 'auto',
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                © 2024 Excellence Coaching Hub
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Made with ❤️ for education
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <ModernButton 
                size="small" 
                onClick={handleGoToDashboard}
                variant="outlined"
                startIcon={<Home />}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                }}
              >
                Dashboard
              </ModernButton>
              <ModernButton 
                size="small" 
                onClick={handleBackToCourses}
                variant="outlined"
                startIcon={<School />}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                }}
              >
                My Courses
              </ModernButton>
            </Box>
          </Box>
        </Container>
      </ModernPaper>
    </Box>
  );
};

export default CourseManagementLayout;
